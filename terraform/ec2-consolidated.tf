# ===================================================================
# CONSOLIDATED EC2 INSTANCE (Backend + Database)
# ===================================================================
# Single EC2 instance running BOTH backend and database containers
# Free Tier: t3.micro eligible (750 hours/month for 12 months)
# After Free Tier: ~$8/month (vs $22/month with ECS + separate DB)
# ===================================================================

# ===================================================================
# EC2 Instance (Backend + Database)
# ===================================================================

resource "aws_instance" "consolidated" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro" # Free Tier eligible (750 hours/month for 12 months)

  # Use PUBLIC subnet (no NAT Gateway needed, saves $65/month)
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.consolidated[0].id]
  associate_public_ip_address = true

  # EBS root volume (minimal size for cost optimization)
  root_block_device {
    volume_size           = 30 # Minimum for Amazon Linux 2023 AMI
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = false # Preserve data if instance replaced
  }

  # User data script to install Docker and run backend + database
  user_data = base64encode(templatefile("${path.module}/user-data/consolidated-init.sh", {
    db_name     = var.db_name
    db_username = var.db_username
    db_password = var.db_password
    aws_region  = var.aws_region
  }))

  iam_instance_profile = aws_iam_instance_profile.consolidated[0].name

  # Disable detailed monitoring (Free Tier only covers basic monitoring)
  monitoring = false

  # Metadata service configuration (IMDSv2 required for security)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Require IMDSv2
    http_put_response_hop_limit = 1
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-consolidated"
  }

  lifecycle {
    ignore_changes = [ami] # Don't replace instance on AMI updates
  }
}

# ===================================================================
# Security Group for Consolidated Instance
# ===================================================================

resource "aws_security_group" "consolidated" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  name        = "${var.project_name}-${var.environment}-consolidated-sg"
  description = "Security group for consolidated EC2 instance (backend + database)"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-consolidated-sg"
  }
}

# HTTP from CloudFront (backend API)
resource "aws_security_group_rule" "consolidated_http" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # CloudFront uses dynamic IPs
  security_group_id = aws_security_group.consolidated[0].id
  description       = "HTTP from CloudFront"
}

# HTTPS from CloudFront (backend API)
resource "aws_security_group_rule" "consolidated_https" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # CloudFront uses dynamic IPs
  security_group_id = aws_security_group.consolidated[0].id
  description       = "HTTPS from CloudFront"
}

# Backend API port (3000) - for direct access during development
resource "aws_security_group_rule" "consolidated_backend" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"] # TODO: Restrict to specific IP ranges
  security_group_id = aws_security_group.consolidated[0].id
  description       = "Backend API for development"
}

# Allow all outbound traffic
resource "aws_security_group_rule" "consolidated_egress" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.consolidated[0].id
  description       = "Allow all outbound traffic"
}

# ===================================================================
# IAM Role and Instance Profile
# ===================================================================

resource "aws_iam_role" "consolidated" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  name = "${var.project_name}-${var.environment}-consolidated-role"

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
    Name = "${var.project_name}-${var.environment}-consolidated-role"
  }
}

resource "aws_iam_instance_profile" "consolidated" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  name = "${var.project_name}-${var.environment}-consolidated-profile"
  role = aws_iam_role.consolidated[0].name

  tags = {
    Name = "${var.project_name}-${var.environment}-consolidated-profile"
  }
}

# Allow SSM Session Manager access (for SSH alternative)
resource "aws_iam_role_policy_attachment" "consolidated_ssm" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  role       = aws_iam_role.consolidated[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Allow EC2 to read Secrets Manager (for database password)
resource "aws_iam_role_policy" "consolidated_secrets" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  name = "${var.project_name}-${var.environment}-consolidated-secrets"
  role = aws_iam_role.consolidated[0].id

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

# Allow EC2 to pull Docker images from ECR
resource "aws_iam_role_policy" "consolidated_ecr" {
  count = var.enable_consolidated_ec2 ? 1 : 0

  name = "${var.project_name}-${var.environment}-consolidated-ecr"
  role = aws_iam_role.consolidated[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = aws_ecr_repository.backend.arn
      }
    ]
  })
}

# ===================================================================
# Outputs
# ===================================================================

output "consolidated_instance_id" {
  value       = var.enable_consolidated_ec2 ? aws_instance.consolidated[0].id : null
  description = "Consolidated EC2 instance ID"
}

output "consolidated_public_ip" {
  value       = var.enable_consolidated_ec2 ? aws_instance.consolidated[0].public_ip : null
  description = "Public IP address of consolidated instance"
}

output "consolidated_private_ip" {
  value       = var.enable_consolidated_ec2 ? aws_instance.consolidated[0].private_ip : null
  description = "Private IP address of consolidated instance"
}

output "backend_api_url" {
  value       = var.enable_consolidated_ec2 ? "http://${aws_instance.consolidated[0].public_ip}:3000" : null
  description = "Backend API endpoint URL"
}
