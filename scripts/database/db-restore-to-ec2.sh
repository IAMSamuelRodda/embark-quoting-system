#!/bin/bash
# ===================================================================
# EC2 Database Restore Script
# ===================================================================
# Restores a database backup from S3 to EC2-hosted PostgreSQL
# This script should be run AFTER deploying EC2 database infrastructure
# ===================================================================

set -e # Exit on error

# ===================================================================
# Configuration
# ===================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values (can be overridden via environment variables)
ENVIRONMENT="${ENVIRONMENT:-staging}"
PROJECT_NAME="${PROJECT_NAME:-embark-quoting}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
S3_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-db-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===================================================================
# Helper Functions
# ===================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi

    if ! command -v pg_restore &> /dev/null; then
        log_error "pg_restore not found. Please install PostgreSQL client tools."
        log_info "Ubuntu/Debian: sudo apt install postgresql-client"
        log_info "macOS: brew install postgresql"
        exit 1
    fi

    if ! command -v psql &> /dev/null; then
        log_error "psql not found. Please install PostgreSQL client tools."
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install it first."
        exit 1
    fi

    log_info "All dependencies found ✓"
}

get_ec2_database_info() {
    log_info "Retrieving EC2 database information..."

    # Get EC2 instance IP from Terraform output or Secrets Manager
    SECRET_NAME="${PROJECT_NAME}/${ENVIRONMENT}/rds/credentials"

    if ! SECRET_JSON=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$AWS_REGION" \
        --query 'SecretString' \
        --output text 2>&1); then
        log_error "Failed to retrieve secret: $SECRET_JSON"
        log_warn "You can also set DB_HOST manually: export DB_HOST=<ec2-private-ip>"
        exit 1
    fi

    # Parse credentials
    export DB_HOST=$(echo "$SECRET_JSON" | jq -r '.host')
    export DB_PORT=$(echo "$SECRET_JSON" | jq -r '.port // 5432')
    export DB_NAME=$(echo "$SECRET_JSON" | jq -r '.dbname')
    export DB_USER=$(echo "$SECRET_JSON" | jq -r '.username')
    export PGPASSWORD=$(echo "$SECRET_JSON" | jq -r '.password')

    log_info "EC2 Database: $DB_NAME"
    log_info "Host: $DB_HOST:$DB_PORT"
}

list_available_backups() {
    log_info "Available backups in S3:"
    echo ""

    aws s3 ls "s3://$S3_BUCKET/rds-migration/" \
        --region "$AWS_REGION" \
        | grep ".sql.gz" \
        | awk '{print "  - " $4 " (" $3 " " $1 " " $2 ")"}'

    echo ""
}

verify_ec2_connection() {
    log_info "Testing connection to EC2 database..."

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c "SELECT version();" > /dev/null 2>&1; then
        log_info "Connection successful ✓"
    else
        log_error "Cannot connect to EC2 database"
        log_warn "Ensure:"
        log_warn "  1. EC2 instance is running"
        log_warn "  2. PostgreSQL container is running"
        log_warn "  3. Security group allows connection from your IP"
        log_warn "  4. You're connected to VPN (if required)"
        exit 1
    fi
}

download_backup() {
    local backup_file=$1

    log_info "Downloading backup from S3..."

    # Create temporary directory
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # Download backup
    if aws s3 cp "s3://$S3_BUCKET/rds-migration/$backup_file" \
        "$TMP_DIR/$backup_file" \
        --region "$AWS_REGION"; then
        log_info "Download complete ✓"
    else
        log_error "Failed to download backup"
        exit 1
    fi

    # Decompress
    log_info "Decompressing backup..."
    gunzip "$TMP_DIR/$backup_file"

    BACKUP_FILE_PATH="$TMP_DIR/${backup_file%.gz}"
    echo "$BACKUP_FILE_PATH"
}

check_existing_data() {
    log_warn "Checking for existing data in target database..."

    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

    if [ "$TABLE_COUNT" -gt 0 ]; then
        log_warn "Database contains $TABLE_COUNT tables"
        log_warn "Restore will DROP existing tables and recreate them"
        echo ""
        read -p "Continue with restore? (yes/no): " confirm

        if [ "$confirm" != "yes" ]; then
            log_info "Restore cancelled by user"
            exit 0
        fi
    else
        log_info "Database is empty, safe to restore"
    fi
}

restore_backup() {
    local backup_file_path=$1

    log_info "Restoring database from backup..."
    log_info "This may take several minutes..."

    # Restore using pg_restore
    if pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -v \
        -c \
        --if-exists \
        --no-owner \
        --no-acl \
        "$backup_file_path" 2>&1 | tee "$TMP_DIR/pg_restore.log"; then
        log_info "Restore completed ✓"
    else
        # pg_restore exits with non-zero even for warnings, so check log
        if grep -q "ERROR" "$TMP_DIR/pg_restore.log"; then
            log_error "Restore encountered errors. Check $TMP_DIR/pg_restore.log"
            exit 1
        else
            log_warn "Restore completed with warnings (this is normal)"
        fi
    fi
}

verify_restore() {
    log_info "Verifying restored data..."

    # Get table count
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

    log_info "Tables restored: $TABLE_COUNT"

    # Get row counts for main tables
    echo ""
    log_info "Row counts:"

    for table in quotes jobs price_sheets users; do
        if ROW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null); then
            echo "  - $table: $ROW_COUNT rows"
        else
            log_debug "  - $table: table not found (may not exist in backup)"
        fi
    done

    echo ""
    log_info "Data verification complete ✓"
}

# ===================================================================
# Main Script
# ===================================================================

main() {
    echo "==================================================================="
    echo "  EC2 Database Restore Script"
    echo "==================================================================="
    echo "  Environment: $ENVIRONMENT"
    echo "  Project: $PROJECT_NAME"
    echo "  Region: $AWS_REGION"
    echo "  Timestamp: $(date)"
    echo "==================================================================="
    echo ""

    # Check if backup file provided
    if [ -z "$1" ]; then
        log_error "No backup file specified"
        echo ""
        echo "Usage: $0 <backup-file.sql.gz>"
        echo ""
        list_available_backups
        exit 1
    fi

    BACKUP_FILE=$1

    check_dependencies
    get_ec2_database_info
    verify_ec2_connection
    check_existing_data

    # Download and decompress backup
    BACKUP_FILE_PATH=$(download_backup "$BACKUP_FILE")

    # Restore backup
    restore_backup "$BACKUP_FILE_PATH"

    # Verify restore
    verify_restore

    echo ""
    echo "==================================================================="
    log_info "Database restore completed successfully!"
    echo "==================================================================="
    echo ""
    echo "  Database: $DB_NAME"
    echo "  Host: $DB_HOST"
    echo "  Tables: $TABLE_COUNT"
    echo ""
    echo "  Next steps:"
    echo "  1. Update backend configuration to use EC2 database"
    echo "  2. Test backend connectivity"
    echo "  3. Run E2E tests to verify functionality"
    echo "  4. If successful, destroy RDS instance after 7-day grace period"
    echo ""
    echo "==================================================================="
}

# Run main function
main "$@"
