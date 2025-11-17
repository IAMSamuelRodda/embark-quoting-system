# ===================================================================
# Staging Environment Configuration
# ===================================================================
# This file contains non-sensitive staging environment variables
# Sensitive values (db_password) should be passed via -var flags
# ===================================================================

# Core Configuration
environment  = "staging"
project_name = "embark-quoting"
aws_region   = "ap-southeast-2" # Sydney, Australia

# Networking
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

# GitHub OIDC
github_org    = "IAMSamuelRodda"
github_repo   = "embark-quoting-system"
github_branch = "main"

# Database (smaller instance for staging)
db_instance_class    = "db.t4g.micro"
db_allocated_storage = 20
db_engine_version    = "15.14"
db_name              = "embark_quoting_staging"
db_username          = "embark_admin"
# db_password - MUST be passed via -var flag or environment variable

# ECS (minimal resources for staging)
ecs_task_cpu         = 256 # 0.25 vCPU
ecs_task_memory      = 512 # 512 MB
ecs_desired_count    = 1
ecs_autoscaling_min  = 1
ecs_autoscaling_max  = 2
ecs_cpu_threshold    = 70
ecs_memory_threshold = 80

# CloudFront
cloudfront_price_class = "PriceClass_100" # North America and Europe only

# Domain (leave empty to use CloudFront default domain)
domain_name         = ""
acm_certificate_arn = ""

# ===================================================================
# COST OPTIMIZATION FOR DEVELOPMENT
# ===================================================================
# These settings reduce costs from $140/month to ~$5/month
# ONLY enable NAT Gateway and ALB when you have paying customers!
# ===================================================================

# Disable NAT Gateway (saves $65/month)
enable_nat_gateway = false

# Disable Application Load Balancer (saves $25/month)
enable_alb = false

# Disable ECS Fargate (saves $9/month) - Use EC2 instead (FREE tier)
enable_ecs = false

# Enable EC2 consolidated instance (FREE for 12 months)
enable_consolidated_ec2 = true

# Enable public IPs for ECS tasks (not used when ECS disabled)
ecs_assign_public_ip = false

# Keep database in single AZ (saves $20/month vs Multi-AZ)
db_multi_az = false

# Backend API endpoint (ECS task public IP - update when task restarts)
# Current task IP: 3.27.195.113 (deployed 2025-11-13)
backend_api_endpoint = "3.27.195.113"
