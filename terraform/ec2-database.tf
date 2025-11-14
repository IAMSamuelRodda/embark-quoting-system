# ===================================================================
# EC2-Based Database Instance (Alternative to RDS)
# ===================================================================
# Creates a self-managed PostgreSQL database on EC2 for cost savings
# Free Tier: t2.micro/t3.micro eligible (750 hours/month for 12 months)
# Post-Free Tier: ~$7-8/month vs $15-20/month for RDS
# ===================================================================

# ===================================================================
# Data Sources
# ===================================================================

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ===================================================================
# EC2 Instance for PostgreSQL
# ===================================================================

resource "aws_instance" "database" {
  count = var.enable_ec2_database ? 1 : 0

  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro" # Free Tier eligible (750 hours/month for 12 months)

  subnet_id                   = aws_subnet.private[0].id
  vpc_security_group_ids      = [aws_security_group.ec2_database[0].id]
  associate_public_ip_address = false # Keep in private subnet

  # EBS root volume (30GB gp3 - minimum for Amazon Linux 2023 AMI)
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = false # Preserve data if instance replaced
  }

  # User data script to install Docker and PostgreSQL
  user_data = base64encode(templatefile("${path.module}/user-data/database-init.sh", {
    db_name     = var.db_name
    db_username = var.db_username
    db_password = var.db_password
  }))

  iam_instance_profile = aws_iam_instance_profile.ec2_database[0].name

  # Enable detailed monitoring (Free Tier: 10 custom metrics)
  monitoring = true

  # Metadata service configuration (IMDSv2 required for security)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Require IMDSv2
    http_put_response_hop_limit = 1
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-database"
  }

  lifecycle {
    ignore_changes = [ami] # Don't replace instance on AMI updates
  }
}

# ===================================================================
# Security Group for EC2 Database
# ===================================================================

resource "aws_security_group" "ec2_database" {
  count = var.enable_ec2_database ? 1 : 0

  name        = "${var.project_name}-${var.environment}-ec2-db-sg"
  description = "Security group for EC2 PostgreSQL database"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-db-sg"
  }
}

# PostgreSQL port from ECS tasks
resource "aws_security_group_rule" "ec2_db_from_ecs" {
  count = var.enable_ec2_database ? 1 : 0

  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs.id
  security_group_id        = aws_security_group.ec2_database[0].id
  description              = "PostgreSQL from ECS tasks"
}

# SSH access for administration (optional - can use SSM Session Manager instead)
resource "aws_security_group_rule" "ec2_db_ssh" {
  count = var.enable_ec2_database && var.enable_ec2_ssh_access ? 1 : 0

  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # TODO: Restrict to specific IP ranges
  security_group_id = aws_security_group.ec2_database[0].id
  description       = "SSH access for administration"
}

# Allow all outbound traffic
resource "aws_security_group_rule" "ec2_db_egress" {
  count = var.enable_ec2_database ? 1 : 0

  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2_database[0].id
  description       = "Allow all outbound traffic"
}

# ===================================================================
# IAM Role and Instance Profile
# ===================================================================

resource "aws_iam_role" "ec2_database" {
  count = var.enable_ec2_database ? 1 : 0

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

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-db-role"
  }
}

resource "aws_iam_instance_profile" "ec2_database" {
  count = var.enable_ec2_database ? 1 : 0

  name = "${var.project_name}-${var.environment}-ec2-db-profile"
  role = aws_iam_role.ec2_database[0].name

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-db-profile"
  }
}

# Allow EC2 to write logs to CloudWatch
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_logs" {
  count = var.enable_ec2_database ? 1 : 0

  role       = aws_iam_role.ec2_database[0].name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Allow SSM Session Manager access (for SSH alternative)
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  count = var.enable_ec2_database ? 1 : 0

  role       = aws_iam_role.ec2_database[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Allow EC2 to backup to S3
resource "aws_iam_role_policy" "ec2_database_s3_backup" {
  count = var.enable_ec2_database ? 1 : 0

  name = "${var.project_name}-${var.environment}-ec2-db-s3-backup"
  role = aws_iam_role.ec2_database[0].id

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
          aws_s3_bucket.database_backups[0].arn,
          "${aws_s3_bucket.database_backups[0].arn}/*"
        ]
      }
    ]
  })
}

# Allow EC2 to read Secrets Manager (for database password rotation)
resource "aws_iam_role_policy" "ec2_database_secrets" {
  count = var.enable_ec2_database ? 1 : 0

  name = "${var.project_name}-${var.environment}-ec2-db-secrets"
  role = aws_iam_role.ec2_database[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn
        ]
      }
    ]
  })
}

# ===================================================================
# S3 Bucket for Database Backups
# ===================================================================

resource "aws_s3_bucket" "database_backups" {
  count  = var.enable_ec2_database ? 1 : 0
  bucket = "${var.project_name}-${var.environment}-db-backups"

  tags = {
    Name = "${var.project_name}-${var.environment}-db-backups"
  }
}

# Enable versioning for backup files
resource "aws_s3_bucket_versioning" "database_backups" {
  count  = var.enable_ec2_database ? 1 : 0
  bucket = aws_s3_bucket.database_backups[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "database_backups" {
  count  = var.enable_ec2_database ? 1 : 0
  bucket = aws_s3_bucket.database_backups[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy to delete old backups
resource "aws_s3_bucket_lifecycle_configuration" "database_backups" {
  count  = var.enable_ec2_database ? 1 : 0
  bucket = aws_s3_bucket.database_backups[0].id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.db_backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 3
    }
  }
}

# Block public access to backup bucket
resource "aws_s3_bucket_public_access_block" "database_backups" {
  count  = var.enable_ec2_database ? 1 : 0
  bucket = aws_s3_bucket.database_backups[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ===================================================================
# CloudWatch Log Group for Database Logs
# ===================================================================

resource "aws_cloudwatch_log_group" "ec2_database" {
  count = var.enable_ec2_database ? 1 : 0

  name              = "/aws/ec2/${var.project_name}-${var.environment}-database"
  retention_in_days = 7 # Free Tier: unlimited retention, but limit for cost control

  tags = {
    Name = "${var.project_name}-${var.environment}-db-logs"
  }
}

# ===================================================================
# CloudWatch Alarms for EC2 Database Monitoring
# ===================================================================

# CPU utilization alarm
resource "aws_cloudwatch_metric_alarm" "ec2_db_cpu" {
  count = var.enable_ec2_database ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-ec2-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "EC2 database CPU utilization is too high"
  alarm_actions       = [] # TODO: Add SNS topic ARN for notifications

  dimensions = {
    InstanceId = aws_instance.database[0].id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-db-cpu-alarm"
  }
}

# Status check alarm (instance health)
resource "aws_cloudwatch_metric_alarm" "ec2_db_status" {
  count = var.enable_ec2_database ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-ec2-db-status-check-failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "EC2 database status check failed"
  alarm_actions       = [] # TODO: Add SNS topic ARN for notifications

  dimensions = {
    InstanceId = aws_instance.database[0].id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-db-status-alarm"
  }
}

# ===================================================================
# Outputs
# ===================================================================

output "ec2_database_instance_id" {
  value       = var.enable_ec2_database ? aws_instance.database[0].id : null
  description = "EC2 database instance ID"
}

output "ec2_database_private_ip" {
  value       = var.enable_ec2_database ? aws_instance.database[0].private_ip : null
  description = "Private IP address of EC2 database instance"
  sensitive   = false
}

output "ec2_database_private_dns" {
  value       = var.enable_ec2_database ? aws_instance.database[0].private_dns : null
  description = "Private DNS name of EC2 database instance"
}

output "database_backup_bucket" {
  value       = var.enable_ec2_database ? aws_s3_bucket.database_backups[0].bucket : null
  description = "S3 bucket name for database backups"
}

output "database_connection_string" {
  value = var.enable_ec2_database ? format(
    "postgresql://%s:%s@%s:5432/%s",
    var.db_username,
    var.db_password,
    aws_instance.database[0].private_ip,
    var.db_name
  ) : null
  description = "PostgreSQL connection string for EC2 database"
  sensitive   = true
}
