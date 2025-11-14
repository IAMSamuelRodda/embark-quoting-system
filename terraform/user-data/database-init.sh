#!/bin/bash
# ===================================================================
# Database EC2 Initialization Script
# ===================================================================
# This script runs on first boot to install Docker and PostgreSQL
# All output is logged to /var/log/database-init.log
# ===================================================================

set -e # Exit on error
set -x # Print commands for debugging

# Redirect all output to log file
exec > >(tee -a /var/log/database-init.log)
exec 2>&1

echo "==================================================================="
echo "  Embark Quoting System - Database Initialization"
echo "==================================================================="
echo "Started at: $(date)"
echo "Hostname: $(hostname)"
echo "Private IP: $(hostname -I | awk '{print $1}')"
echo ""

# ===================================================================
# System Updates
# ===================================================================

echo "[1/8] Updating system packages..."
dnf update -y

echo "[2/8] Installing utilities..."
dnf install -y \
  htop \
  vim \
  curl \
  wget \
  jq \
  postgresql15 \
  postgresql15-contrib \
  amazon-cloudwatch-agent

# ===================================================================
# Docker Installation (Amazon Linux 2023)
# ===================================================================

echo "[3/8] Installing Docker..."
dnf install -y docker

# Start and enable Docker service
systemctl start docker
systemctl enable docker

# Verify Docker installation
docker --version

# ===================================================================
# Docker Compose Installation
# ===================================================================

echo "[4/8] Installing Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
curl -L "https://github.com/docker/compose/releases/download/$${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify Docker Compose installation
docker-compose --version

# ===================================================================
# Database Directory Setup
# ===================================================================

echo "[5/8] Setting up database directory..."
mkdir -p /opt/embark/database
mkdir -p /opt/embark/database/backups
mkdir -p /opt/embark/database/scripts
cd /opt/embark/database

# ===================================================================
# Docker Compose Configuration
# ===================================================================

echo "[6/8] Creating Docker Compose configuration..."
cat > docker-compose.yml <<'EOF_COMPOSE'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: embark-postgres
    restart: unless-stopped

    environment:
      POSTGRES_DB: ${db_name}
      POSTGRES_USER: ${db_username}
      POSTGRES_PASSWORD: ${db_password}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"

      # Performance tuning for t3.micro (1GB RAM)
      POSTGRES_SHARED_BUFFERS: "256MB"
      POSTGRES_EFFECTIVE_CACHE_SIZE: "768MB"
      POSTGRES_WORK_MEM: "4MB"
      POSTGRES_MAINTENANCE_WORK_MEM: "64MB"

      # Connection limits
      POSTGRES_MAX_CONNECTIONS: "100"

    ports:
      - "5432:5432"

    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
      - ./scripts:/docker-entrypoint-initdb.d

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${db_username} -d ${db_name}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

    # Security
    security_opt:
      - no-new-privileges:true

    # Resource limits (match t3.micro resources)
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 768M
        reservations:
          cpus: '0.25'
          memory: 512M

volumes:
  postgres-data:
    driver: local

EOF_COMPOSE

# ===================================================================
# Backup Scripts
# ===================================================================

echo "[6.5/8] Creating backup scripts..."

# Daily backup script
cat > /opt/embark/database/scripts/daily-backup.sh <<'EOF_BACKUP'
#!/bin/bash
# Daily database backup script
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="embark_backup_$${TIMESTAMP}.sql"
S3_BUCKET="embark-quoting-staging-db-backups"

echo "Starting backup at $(date)"

# Create backup using pg_dump
docker exec embark-postgres pg_dump \
  -U ${db_username} \
  -d ${db_name} \
  -F c \
  -b \
  -v \
  -f /backups/$${BACKUP_FILE}

# Compress backup
gzip /opt/embark/database/backups/$${BACKUP_FILE}

# Upload to S3
if command -v aws &> /dev/null; then
  aws s3 cp /opt/embark/database/backups/$${BACKUP_FILE}.gz \
    s3://$${S3_BUCKET}/daily/$${BACKUP_FILE}.gz
  echo "Backup uploaded to S3: $${BACKUP_FILE}.gz"
else
  echo "AWS CLI not available, backup saved locally only"
fi

# Clean up old local backups (keep last 3)
cd /opt/embark/database/backups
ls -t embark_backup_*.sql.gz | tail -n +4 | xargs -r rm

echo "Backup complete at $(date)"
EOF_BACKUP

chmod +x /opt/embark/database/scripts/daily-backup.sh

# Restore script
cat > /opt/embark/database/scripts/restore-backup.sh <<'EOF_RESTORE'
#!/bin/bash
# Database restore script
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo "Available backups:"
  ls -lh /opt/embark/database/backups/
  exit 1
fi

BACKUP_FILE=$1

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -k $BACKUP_FILE
  BACKUP_FILE=$${BACKUP_FILE%.gz}
fi

echo "Restoring from $BACKUP_FILE at $(date)"

# Restore using pg_restore
docker exec -i embark-postgres pg_restore \
  -U ${db_username} \
  -d ${db_name} \
  -v \
  -c \
  --if-exists \
  < $BACKUP_FILE

echo "Restore complete at $(date)"
EOF_RESTORE

chmod +x /opt/embark/database/scripts/restore-backup.sh

# ===================================================================
# Cron Job for Daily Backups
# ===================================================================

echo "[7/8] Setting up daily backup cron job..."
cat > /etc/cron.d/database-backup <<'EOF_CRON'
# Daily database backup at 3 AM UTC
0 3 * * * root /opt/embark/database/scripts/daily-backup.sh >> /var/log/database-backup.log 2>&1
EOF_CRON

chmod 0644 /etc/cron.d/database-backup

# ===================================================================
# Start PostgreSQL Container
# ===================================================================

echo "[8/8] Starting PostgreSQL container..."
cd /opt/embark/database
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec embark-postgres pg_isready -U ${db_username} -d ${db_name} > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo "Waiting for PostgreSQL... ($i/30)"
  sleep 2
done

# ===================================================================
# CloudWatch Agent Configuration
# ===================================================================

echo "Setting up CloudWatch Agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF_CW
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/database-init.log",
            "log_group_name": "/aws/ec2/embark-quoting-staging-database",
            "log_stream_name": "{instance_id}/init"
          },
          {
            "file_path": "/var/log/database-backup.log",
            "log_group_name": "/aws/ec2/embark-quoting-staging-database",
            "log_stream_name": "{instance_id}/backup"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "Embark/Database",
    "metrics_collected": {
      "cpu": {
        "measurement": [{"name": "cpu_usage_idle"}],
        "totalcpu": false
      },
      "disk": {
        "measurement": [{"name": "used_percent"}],
        "resources": ["*"]
      },
      "mem": {
        "measurement": [{"name": "mem_used_percent"}]
      }
    }
  }
}
EOF_CW

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# ===================================================================
# Verification
# ===================================================================

echo ""
echo "==================================================================="
echo "  Database Initialization Complete!"
echo "==================================================================="
echo ""
echo "PostgreSQL Status:"
docker-compose ps
echo ""
echo "PostgreSQL Logs:"
docker-compose logs postgres | tail -20
echo ""
echo "Database Connection Test:"
docker exec embark-postgres psql -U ${db_username} -d ${db_name} -c "SELECT version();"
echo ""
echo "Available Databases:"
docker exec embark-postgres psql -U ${db_username} -d ${db_name} -c "\l"
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "Memory Usage:"
free -h
echo ""
echo "Completed at: $(date)"
echo "==================================================================="
