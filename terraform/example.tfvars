# ===================================================================
# Example Terraform Variables File
# ===================================================================
# Copy this file to create your own .tfvars file:
#   cp example.tfvars staging.tfvars
#   cp example.tfvars production.tfvars
# ===================================================================

# Core Configuration
environment  = "staging"          # "staging" or "production"
project_name = "embark-quoting"   # Project name prefix for resources
aws_region   = "ap-southeast-2"   # AWS region (Sydney, Australia)

# Networking
vpc_cidr              = "10.0.0.0/16"                      # VPC CIDR block
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]    # Public subnet CIDRs
private_subnet_cidrs  = ["10.0.10.0/24", "10.0.11.0/24"]  # Private subnet CIDRs

# GitHub OIDC (for GitHub Actions authentication)
github_org    = "your-github-org"          # GitHub organization or username
github_repo   = "your-repo-name"           # GitHub repository name
github_branch = "main"                     # Branch for deployments

# Database Configuration
db_instance_class    = "db.t4g.micro"      # RDS instance class (t4g.micro, t4g.small, etc.)
db_allocated_storage = 20                  # Storage in GB
db_engine_version    = "15.5"              # PostgreSQL version
db_name              = "embark_quoting"    # Database name
db_username          = "embark_admin"      # Database username
# db_password - REQUIRED: Pass via -var flag or TF_VAR_db_password environment variable
#   Example: terraform apply -var="db_password=YourSecurePassword123!"

# ECS Configuration
ecs_task_cpu         = 256                 # CPU units (256 = 0.25 vCPU, 512 = 0.5 vCPU)
ecs_task_memory      = 512                 # Memory in MB (512, 1024, 2048, etc.)
ecs_desired_count    = 1                   # Initial number of tasks
ecs_autoscaling_min  = 1                   # Minimum tasks for auto-scaling
ecs_autoscaling_max  = 4                   # Maximum tasks for auto-scaling
ecs_cpu_threshold    = 70                  # CPU % threshold for scaling up
ecs_memory_threshold = 80                  # Memory % threshold for scaling up

# CloudFront Configuration
cloudfront_price_class = "PriceClass_100"  # PriceClass_100, PriceClass_200, or PriceClass_All

# Custom Domain (optional)
domain_name         = ""                   # Leave empty to use CloudFront default domain
acm_certificate_arn = ""                   # Required if domain_name is set
