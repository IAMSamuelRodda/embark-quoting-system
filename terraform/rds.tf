# ===================================================================
# Task 0.2.4: RDS PostgreSQL Databases
# ===================================================================
# Creates RDS PostgreSQL instances with Secrets Manager integration
# Dependencies: VPC (subnets), Security Groups
# ===================================================================

# ===================================================================
# Database Subnet Group
# ===================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

# ===================================================================
# Database Parameter Group (PostgreSQL 15)
# ===================================================================

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-postgres15"
  family = "postgres15"

  # Enable query logging for debugging (disable in production for performance)
  parameter {
    name  = "log_statement"
    value = var.environment == "staging" ? "all" : "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking longer than 1 second
  }

  # Connection limits (static parameter requires pending-reboot)
  parameter {
    name         = "max_connections"
    value        = "100"
    apply_method = "pending-reboot"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-postgres15"
  }
}

# ===================================================================
# Secrets Manager for Database Credentials
# ===================================================================

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/rds/credentials"
  description             = "Database credentials for ${var.environment} environment"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-${var.environment}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username             = var.db_username
    password             = var.db_password
    engine               = "postgres"
    host                 = aws_db_instance.main.address
    port                 = aws_db_instance.main.port
    dbname               = var.db_name
    dbInstanceIdentifier = aws_db_instance.main.id
  })
}

# ===================================================================
# RDS PostgreSQL Instance
# ===================================================================

resource "aws_db_instance" "main" {
  identifier        = "${var.project_name}-${var.environment}-db"
  engine            = "postgres"
  engine_version    = var.db_engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  # Backup configuration
  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window           = "03:00-04:00" # UTC
  maintenance_window      = "sun:04:00-sun:05:00"

  # Snapshot configuration
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  # Performance Insights (free tier available)
  performance_insights_enabled          = true
  performance_insights_kms_key_id       = null # Use default AWS managed key
  performance_insights_retention_period = 7

  # High availability (multi-AZ doubles cost - use only for production)
  multi_az = var.db_multi_az

  # Prevent accidental deletion in production
  deletion_protection = var.environment == "production"

  # Auto minor version upgrades
  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.project_name}-${var.environment}-db"
  }
}

# ===================================================================
# RDS Enhanced Monitoring IAM Role
# ===================================================================

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ===================================================================
# CloudWatch Alarms for Database Monitoring
# ===================================================================

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-db-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2000000000 # 2 GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-db-storage-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "${var.project_name}-${var.environment}-db-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-db-connections-alarm"
  }
}
