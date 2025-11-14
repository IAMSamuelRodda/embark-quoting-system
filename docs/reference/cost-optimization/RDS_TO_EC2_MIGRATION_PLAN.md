# RDS to EC2 Database Migration Plan

> **Objective**: Migrate from AWS RDS to self-hosted PostgreSQL on EC2 to maximize Free Tier benefits and reduce long-term costs
> **Timeline**: 2-3 hours implementation + 1 hour testing
> **Risk Level**: Medium (requires database downtime, careful data migration)

---

## Executive Summary

**Current Setup**: RDS PostgreSQL (db.t3.micro, 20GB, single-AZ)
**Target Setup**: EC2 t3.micro + Docker + PostgreSQL 15

**Cost Impact:**
- **Free Tier Period (12 months)**: Both free, but EC2 gives more control
- **After Free Tier**: Save $8-12/month ($96-144/year)
- **Current Cost**: ~$15-20/month RDS
- **Target Cost**: ~$7-8/month EC2 (or $0 if bundled with backend)

**Key Benefits:**
- ✅ Lower long-term costs
- ✅ Full control over configuration
- ✅ Can bundle database + backend on same instance
- ✅ Easier local development (Docker consistency)

**Trade-offs:**
- ❌ Lose managed backups (need to implement)
- ❌ Lose automated minor version upgrades
- ❌ Lose Performance Insights dashboard
- ❌ More operational responsibility
- ⚠️ Requires database downtime during migration (15-30 minutes)

---

## Current Architecture

```
┌─────────────────────────────────────────────────────┐
│ Staging Environment (Current)                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CloudFront (HTTPS)                                 │
│       │                                             │
│       ├──> S3 (Frontend Static Assets)              │
│       │                                             │
│       └──> ECS Fargate (Backend)                    │
│                   │                                 │
│                   └──> RDS PostgreSQL ⚠️            │
│                         - db.t3.micro               │
│                         - 20GB gp3 storage          │
│                         - Private subnet            │
│                         - Managed backups           │
│                         - Performance Insights      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Current Costs (Staging):**
- RDS db.t3.micro: $15-20/month (after Free Tier)
- Storage (20GB): $2.30/month
- Backups (minimal): $0.50/month
- **Total RDS**: ~$18-23/month

---

## Target Architecture

```
┌─────────────────────────────────────────────────────┐
│ Staging Environment (Target)                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CloudFront (HTTPS)                                 │
│       │                                             │
│       ├──> S3 (Frontend Static Assets)              │
│       │                                             │
│       └──> ECS Fargate (Backend)                    │
│                   │                                 │
│                   └──> EC2 t3.micro ✅              │
│                         - Docker + PostgreSQL 15    │
│                         - 20GB EBS gp3              │
│                         - Private subnet            │
│                         - Manual backups (S3)       │
│                         - CloudWatch logs           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Target Costs (Staging):**
- EC2 t3.micro: $7.50/month (after Free Tier)
- EBS 20GB: $1.60/month
- Elastic IP: $0/month (free if attached to running instance)
- Backups (S3): $0.50/month
- **Total EC2**: ~$9.60/month

**Savings**: $8.40/month ($100/year)

---

## Alternative: Bundle Database + Backend on Same EC2

```
┌─────────────────────────────────────────────────────┐
│ Alternative Architecture (Maximum Savings)          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CloudFront (HTTPS)                                 │
│       │                                             │
│       ├──> S3 (Frontend Static Assets)              │
│       │                                             │
│       └──> EC2 t3.small 🎯                          │
│            ├─ Docker: Backend (Node.js)             │
│            └─ Docker: PostgreSQL 15                 │
│                                                     │
│  (Eliminates ECS Fargate costs entirely)            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Alternative Costs:**
- EC2 t3.small: $15/month (after Free Tier)
- EBS 20GB: $1.60/month
- **Total**: ~$16.60/month

**vs Current (RDS + ECS):**
- RDS: $18-23/month
- ECS Fargate: $10-15/month
- **Total Current**: $28-38/month

**Savings**: $11.40-21.40/month ($137-257/year)

**Recommendation**: Start with separate EC2 for database (cleaner separation), evaluate bundling later if needed.

---

## Migration Steps

### Phase 1: Infrastructure Setup (45 minutes)

#### Step 1.1: Create EC2 Instance via Terraform

Create `terraform/ec2-database.tf`:

```hcl
# EC2 instance for PostgreSQL database
resource "aws_instance" "database" {
  count = var.enable_ec2_database ? 1 : 0

  ami           = data.aws_ami.amazon_linux_2023.id  # Amazon Linux 2023
  instance_type = "t3.micro"  # Free Tier eligible

  subnet_id                   = aws_subnet.private[0].id
  vpc_security_group_ids      = [aws_security_group.ec2_database.id]
  associate_public_ip_address = false

  # EBS volume (20GB gp3)
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = false  # Keep data if instance replaced
  }

  # User data script to install Docker
  user_data = base64encode(templatefile("${path.module}/user-data/database-init.sh", {
    db_name     = var.db_name
    db_username = var.db_username
    db_password = var.db_password
  }))

  iam_instance_profile = aws_iam_instance_profile.ec2_database.name

  tags = {
    Name = "${var.project_name}-${var.environment}-database"
  }
}

# Security group for EC2 database
resource "aws_security_group" "ec2_database" {
  name        = "${var.project_name}-${var.environment}-ec2-db-sg"
  description = "Security group for EC2 PostgreSQL database"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL port from ECS tasks
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "PostgreSQL from ECS tasks"
  }

  # SSH access (optional, for troubleshooting)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # TODO: Restrict to your IP
    description = "SSH access for administration"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-db-sg"
  }
}

# IAM role for EC2 instance
resource "aws_iam_role" "ec2_database" {
  name = "${var.project_name}-${var.environment}-ec2-db-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_database" {
  name = "${var.project_name}-${var.environment}-ec2-db-profile"
  role = aws_iam_role.ec2_database.name
}

# Allow EC2 to write logs to CloudWatch
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_logs" {
  role       = aws_iam_role.ec2_database.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Allow EC2 to backup to S3
resource "aws_iam_role_policy" "ec2_database_s3_backup" {
  name = "${var.project_name}-${var.environment}-ec2-db-s3-backup"
  role = aws_iam_role.ec2_database.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.database_backups.arn}",
          "${aws_s3_bucket.database_backups.arn}/*"
        ]
      }
    ]
  })
}

# S3 bucket for database backups
resource "aws_s3_bucket" "database_backups" {
  count  = var.enable_ec2_database ? 1 : 0
  bucket = "${var.project_name}-${var.environment}-db-backups"

  tags = {
    Name = "${var.project_name}-${var.environment}-db-backups"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "database_backups" {
  count  = var.enable_ec2_database ? 1 : 0
  bucket = aws_s3_bucket.database_backups[0].id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    expiration {
      days = 7  # Keep backups for 7 days
    }
  }
}

# Output private IP
output "ec2_database_private_ip" {
  value       = var.enable_ec2_database ? aws_instance.database[0].private_ip : null
  description = "Private IP of EC2 database instance"
}
```

#### Step 1.2: Create Database Initialization Script

Create `terraform/user-data/database-init.sh`:

```bash
#!/bin/bash
set -e

# Log all output
exec > >(tee /var/log/database-init.log)
exec 2>&1

echo "=== Starting Database Initialization ==="
date

# Install Docker
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create database directory
mkdir -p /opt/embark/database
cd /opt/embark/database

# Create Docker Compose file
cat > docker-compose.yml <<EOF
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
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${db_username} -d ${db_name}"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres-data:
    driver: local

EOF

# Start PostgreSQL container
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Verify PostgreSQL is running
docker-compose ps
docker-compose logs postgres

echo "=== Database Initialization Complete ==="
date
```

#### Step 1.3: Add Variable Flag

Add to `terraform/variables.tf`:

```hcl
variable "enable_ec2_database" {
  description = "Enable EC2-based database instead of RDS"
  type        = bool
  default     = false
}
```

Add to `terraform/staging.tfvars`:

```hcl
# Database backend selection
enable_ec2_database = true  # Use EC2 + Docker instead of RDS
```

### Phase 2: Database Migration (30 minutes)

#### Step 2.1: Create Backup Scripts

Create `scripts/db-backup.sh`:

```bash
#!/bin/bash
# Database backup script
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="embark_backup_${TIMESTAMP}.sql"
S3_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-db-backups"

# Backup from RDS
echo "Creating backup from RDS..."
pg_dump -h $RDS_HOST -U $DB_USERNAME -d $DB_NAME > "/tmp/${BACKUP_FILE}"

# Compress
gzip "/tmp/${BACKUP_FILE}"

# Upload to S3
aws s3 cp "/tmp/${BACKUP_FILE}.gz" "s3://${S3_BUCKET}/rds-migration/${BACKUP_FILE}.gz"

echo "Backup complete: ${BACKUP_FILE}.gz"
echo "S3 location: s3://${S3_BUCKET}/rds-migration/${BACKUP_FILE}.gz"
```

Create `scripts/db-restore.sh`:

```bash
#!/bin/bash
# Database restore script
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1
EC2_IP=$2

# Download from S3
echo "Downloading backup from S3..."
aws s3 cp "s3://${S3_BUCKET}/rds-migration/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}"

# Decompress
gunzip "/tmp/${BACKUP_FILE}"
SQL_FILE="${BACKUP_FILE%.gz}"

# Restore to EC2 database
echo "Restoring to EC2 database..."
PGPASSWORD=$DB_PASSWORD psql -h $EC2_IP -U $DB_USERNAME -d $DB_NAME < "/tmp/${SQL_FILE}"

echo "Restore complete!"
```

#### Step 2.2: Export Data from RDS

```bash
# Get RDS endpoint from Secrets Manager
RDS_ENDPOINT=$(aws secretsmanager get-secret-value \
  --secret-id embark-quoting/staging/rds/credentials \
  --query 'SecretString' --output text | jq -r '.host')

# Export environment variables
export RDS_HOST=$RDS_ENDPOINT
export DB_USERNAME=embark_admin
export DB_NAME=embark_quoting_staging
export PROJECT_NAME=embark-quoting
export ENVIRONMENT=staging

# Run backup
./scripts/db-backup.sh
```

### Phase 3: Terraform Deployment (30 minutes)

#### Step 3.1: Deploy EC2 Instance

```bash
cd terraform

# Apply Terraform (creates EC2 database)
terraform apply -var-file="staging.tfvars" \
  -var="db_password=$(aws secretsmanager get-secret-value --secret-id embark-quoting/staging/db-password --query SecretString --output text)" \
  -auto-approve

# Get EC2 private IP
EC2_DB_IP=$(terraform output -raw ec2_database_private_ip)
echo "EC2 Database IP: $EC2_DB_IP"
```

#### Step 3.2: Verify EC2 Database Running

```bash
# SSH to EC2 instance (from bastion or via Session Manager)
aws ssm start-session --target $(terraform output -raw ec2_database_instance_id)

# Inside EC2 instance
cd /opt/embark/database
docker-compose ps
docker-compose logs postgres

# Test connection
docker exec embark-postgres psql -U embark_admin -d embark_quoting_staging -c '\l'
```

### Phase 4: Data Migration (15-30 minutes)

#### Step 4.1: Import Data to EC2

```bash
# Find latest backup
LATEST_BACKUP=$(aws s3 ls s3://embark-quoting-staging-db-backups/rds-migration/ | sort | tail -1 | awk '{print $4}')

# Restore to EC2
export EC2_IP=$(terraform output -raw ec2_database_private_ip)
export S3_BUCKET=embark-quoting-staging-db-backups
export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id embark-quoting/staging/db-password --query SecretString --output text)

./scripts/db-restore.sh $LATEST_BACKUP $EC2_IP
```

#### Step 4.2: Verify Data Migration

```bash
# Connect to EC2 database
PGPASSWORD=$DB_PASSWORD psql -h $EC2_IP -U embark_admin -d embark_quoting_staging

# Verify tables
\dt

# Check row counts
SELECT 'quotes' AS table_name, COUNT(*) FROM quotes
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'price_sheets', COUNT(*) FROM price_sheets;

\q
```

### Phase 5: Update Backend Configuration (15 minutes)

#### Step 5.1: Update Secrets Manager

```bash
# Update database credentials secret with EC2 IP
aws secretsmanager update-secret \
  --secret-id embark-quoting/staging/rds/credentials \
  --secret-string '{
    "username": "embark_admin",
    "password": "'$DB_PASSWORD'",
    "engine": "postgres",
    "host": "'$EC2_DB_IP'",
    "port": "5432",
    "dbname": "embark_quoting_staging",
    "dbInstanceIdentifier": "embark-quoting-staging-database-ec2"
  }'
```

#### Step 5.2: Update ECS Task Definition

Update `backend/.env.staging`:

```bash
# Database (EC2-hosted PostgreSQL)
DB_HOST=<EC2_PRIVATE_IP>
DB_PORT=5432
DB_NAME=embark_quoting_staging
DB_USER=embark_admin
DB_PASSWORD=<from-secrets-manager>
```

#### Step 5.3: Redeploy Backend

```bash
# Trigger redeployment via GitHub Actions
git add .
git commit -m "chore: update backend database connection to EC2"
git push

# Or manually redeploy
cd backend
npm run build
docker build -t embark-backend:staging .
# Push to ECR and update ECS service
```

### Phase 6: Testing (30 minutes)

#### Step 6.1: Health Check

```bash
# Check backend health
curl https://d2vxgs70elbgcz.cloudfront.net/api/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "timestamp": "2025-11-13T..."
# }
```

#### Step 6.2: Functional Testing

```bash
# Run E2E tests
cd frontend
npm run test:e2e -- --grep "sync"

# Expected: All sync tests pass
```

#### Step 6.3: Performance Comparison

```bash
# Test query performance
time curl https://d2vxgs70elbgcz.cloudfront.net/api/quotes

# Compare with previous RDS performance
# Expected: Similar response times (<100ms difference)
```

### Phase 7: Cleanup (10 minutes)

#### Step 7.1: Stop RDS Instance (Keep for 7 days as backup)

```bash
# Stop RDS instance (not delete yet)
aws rds stop-db-instance --db-instance-identifier embark-quoting-staging-db

# Wait 7 days, then delete if EC2 working well
```

#### Step 7.2: Update Documentation

```bash
# Update DEVELOPMENT.md with new database architecture
# Update STATUS.md with migration completion
# Update ARCHITECTURE.md with EC2 database details
```

---

## Rollback Plan

If issues occur during migration:

### Immediate Rollback (< 30 minutes)

```bash
# 1. Revert backend connection to RDS
cd backend
git revert HEAD
git push

# 2. Restart RDS if stopped
aws rds start-db-instance --db-instance-identifier embark-quoting-staging-db

# 3. Update Secrets Manager back to RDS
aws secretsmanager update-secret \
  --secret-id embark-quoting/staging/rds/credentials \
  --secret-string '<original-rds-secret>'

# 4. Redeploy backend
# Trigger GitHub Actions or manual deployment
```

### Data Loss Recovery

```bash
# Restore from latest RDS snapshot
aws rds restore-db-instance-from-snapshot \
  --db-instance-identifier embark-quoting-staging-db-restored \
  --db-snapshot-identifier <snapshot-id>
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data loss during migration | Low | Critical | Take RDS snapshot before migration, keep backups in S3 |
| Performance degradation | Medium | Medium | Monitor query times, can scale to t3.small if needed |
| Downtime > 30 minutes | Low | Medium | Practice migration on dev environment first |
| Backup failure | Low | High | Test restore procedure before decommissioning RDS |
| Security misconfiguration | Medium | High | Use security groups, no public access, encrypt EBS |

---

## Success Criteria

- ✅ All data migrated successfully (zero data loss)
- ✅ Backend connects to EC2 database
- ✅ All E2E tests pass
- ✅ Response times within 100ms of RDS performance
- ✅ Automated backups working (daily to S3)
- ✅ CloudWatch monitoring configured
- ✅ Cost reduction visible in AWS billing (after Free Tier)

---

## Post-Migration Tasks

1. **Monitor for 7 days** - Watch CloudWatch metrics, logs, error rates
2. **Test backup/restore** - Verify S3 backups can be restored successfully
3. **Delete RDS** - After 7-day stability period, delete RDS instance
4. **Update runbook** - Document EC2 database operations procedures
5. **Consider bundling** - Evaluate moving backend to same EC2 for more savings

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Infrastructure | 45 min | Create Terraform config, user data script |
| Phase 2: Backup | 30 min | Export RDS data to S3 |
| Phase 3: Deployment | 30 min | Deploy EC2 instance via Terraform |
| Phase 4: Migration | 30 min | Import data to EC2 database |
| Phase 5: Configuration | 15 min | Update backend connection strings |
| Phase 6: Testing | 30 min | Run E2E tests, verify functionality |
| Phase 7: Cleanup | 10 min | Update documentation |
| **Total** | **3 hours** | End-to-end migration |

---

## Next Steps

1. Review this plan with stakeholders
2. Schedule maintenance window (off-peak hours)
3. Practice migration on dev environment
4. Execute migration during scheduled window
5. Monitor for 7 days before decommissioning RDS

---

**Document Version**: 1.0
**Created**: 2025-11-13
**Author**: Claude Code
**Status**: Ready for Review
