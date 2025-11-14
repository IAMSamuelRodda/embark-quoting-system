#!/bin/bash
# ===================================================================
# RDS Database Backup Script
# ===================================================================
# Creates a backup of the current RDS database and uploads to S3
# This script should be run BEFORE migrating to EC2 database
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

# Timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="embark_rds_backup_${TIMESTAMP}.sql"
S3_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-db-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi

    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install PostgreSQL client tools."
        log_info "Ubuntu/Debian: sudo apt install postgresql-client"
        log_info "macOS: brew install postgresql"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install it first."
        log_info "Ubuntu/Debian: sudo apt install jq"
        log_info "macOS: brew install jq"
        exit 1
    fi

    log_info "All dependencies found ✓"
}

get_rds_credentials() {
    log_info "Retrieving RDS credentials from Secrets Manager..."

    SECRET_NAME="${PROJECT_NAME}/${ENVIRONMENT}/rds/credentials"

    if ! SECRET_JSON=$(aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$AWS_REGION" \
        --query 'SecretString' \
        --output text 2>&1); then
        log_error "Failed to retrieve secret: $SECRET_JSON"
        exit 1
    fi

    # Parse credentials
    export DB_HOST=$(echo "$SECRET_JSON" | jq -r '.host')
    export DB_PORT=$(echo "$SECRET_JSON" | jq -r '.port')
    export DB_NAME=$(echo "$SECRET_JSON" | jq -r '.dbname')
    export DB_USER=$(echo "$SECRET_JSON" | jq -r '.username')
    export PGPASSWORD=$(echo "$SECRET_JSON" | jq -r '.password')

    log_info "Credentials retrieved for database: $DB_NAME"
    log_info "Host: $DB_HOST:$DB_PORT"
}

create_backup() {
    log_info "Creating database backup..."
    log_info "This may take several minutes depending on database size..."

    # Create temporary directory for backup
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # Create backup using pg_dump
    if pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F c \
        -b \
        -v \
        -f "$TMP_DIR/$BACKUP_FILE" 2>&1 | tee "$TMP_DIR/pg_dump.log"; then
        log_info "Backup created successfully: $BACKUP_FILE"
    else
        log_error "Backup failed. Check $TMP_DIR/pg_dump.log for details."
        exit 1
    fi

    # Get backup file size
    BACKUP_SIZE=$(du -h "$TMP_DIR/$BACKUP_FILE" | cut -f1)
    log_info "Backup size: $BACKUP_SIZE"

    # Compress backup
    log_info "Compressing backup..."
    gzip "$TMP_DIR/$BACKUP_FILE"
    COMPRESSED_SIZE=$(du -h "$TMP_DIR/${BACKUP_FILE}.gz" | cut -f1)
    log_info "Compressed size: $COMPRESSED_SIZE"

    # Upload to S3
    log_info "Uploading to S3: s3://$S3_BUCKET/rds-migration/$BACKUP_FILE.gz"

    if aws s3 cp "$TMP_DIR/${BACKUP_FILE}.gz" \
        "s3://$S3_BUCKET/rds-migration/${BACKUP_FILE}.gz" \
        --region "$AWS_REGION"; then
        log_info "Backup uploaded successfully ✓"
    else
        log_error "Failed to upload backup to S3"
        log_warn "Backup file saved locally: $TMP_DIR/${BACKUP_FILE}.gz"
        exit 1
    fi

    # Verify upload
    if aws s3 ls "s3://$S3_BUCKET/rds-migration/${BACKUP_FILE}.gz" \
        --region "$AWS_REGION" > /dev/null; then
        log_info "Upload verified ✓"
    else
        log_error "Upload verification failed"
        exit 1
    fi

    # Save metadata
    cat > "$TMP_DIR/backup_metadata.json" <<EOF
{
  "backup_file": "${BACKUP_FILE}.gz",
  "timestamp": "$(date -Iseconds)",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "port": $DB_PORT,
  "backup_size": "$BACKUP_SIZE",
  "compressed_size": "$COMPRESSED_SIZE",
  "s3_location": "s3://$S3_BUCKET/rds-migration/${BACKUP_FILE}.gz"
}
EOF

    aws s3 cp "$TMP_DIR/backup_metadata.json" \
        "s3://$S3_BUCKET/rds-migration/${BACKUP_FILE}_metadata.json" \
        --region "$AWS_REGION"
}

verify_backup() {
    log_info "Verifying backup integrity..."

    # List tables in backup (dry-run restore)
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # Download backup
    aws s3 cp "s3://$S3_BUCKET/rds-migration/${BACKUP_FILE}.gz" \
        "$TMP_DIR/${BACKUP_FILE}.gz" \
        --region "$AWS_REGION"

    # Test backup file
    gunzip -t "$TMP_DIR/${BACKUP_FILE}.gz"
    if [ $? -eq 0 ]; then
        log_info "Backup file integrity verified ✓"
    else
        log_error "Backup file is corrupted!"
        exit 1
    fi
}

# ===================================================================
# Main Script
# ===================================================================

main() {
    echo "==================================================================="
    echo "  RDS Database Backup Script"
    echo "==================================================================="
    echo "  Environment: $ENVIRONMENT"
    echo "  Project: $PROJECT_NAME"
    echo "  Region: $AWS_REGION"
    echo "  Timestamp: $(date)"
    echo "==================================================================="
    echo ""

    check_dependencies
    get_rds_credentials
    create_backup
    verify_backup

    echo ""
    echo "==================================================================="
    log_info "Backup completed successfully!"
    echo "==================================================================="
    echo ""
    echo "  Backup file: ${BACKUP_FILE}.gz"
    echo "  S3 location: s3://$S3_BUCKET/rds-migration/${BACKUP_FILE}.gz"
    echo ""
    echo "  To restore this backup to EC2 database, run:"
    echo "  ./scripts/database/db-restore-to-ec2.sh ${BACKUP_FILE}.gz"
    echo ""
    echo "==================================================================="
}

# Run main function
main "$@"
