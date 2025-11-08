# ===================================================================
# Production Environment Configuration
# ===================================================================
# This file contains non-sensitive production environment variables
# Sensitive values (db_password) should be passed via -var flags
# ===================================================================

# Core Configuration
environment  = "production"
project_name = "embark-quoting"
aws_region   = "ap-southeast-2"  # Sydney, Australia

# Networking
vpc_cidr              = "10.1.0.0/16"  # Different CIDR from staging
public_subnet_cidrs   = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs  = ["10.1.10.0/24", "10.1.11.0/24"]

# GitHub OIDC
github_org    = "IAMSamuelRodda"
github_repo   = "embark-quoting-system"
github_branch = "main"

# Database (right-sized for 1-10 users)
db_instance_class    = "db.t3.micro"   # Sufficient for small user base
db_allocated_storage = 20              # 20GB is plenty for 1-10 users
db_engine_version    = "15.14"
db_name              = "embark_quoting_prod"
db_username          = "embark_admin"
# db_password - MUST be passed via -var flag or environment variable

# ECS (right-sized for 1-10 users)
ecs_task_cpu         = 256   # 0.25 vCPU (sufficient for low traffic)
ecs_task_memory      = 512   # 512 MB
ecs_desired_count    = 1     # Single task is fine for 1-10 users
ecs_autoscaling_min  = 1
ecs_autoscaling_max  = 3     # Can scale up to 3 if needed
ecs_cpu_threshold    = 70
ecs_memory_threshold = 80

# CloudFront
cloudfront_price_class = "PriceClass_100" # Can upgrade to PriceClass_200 or PriceClass_All

# Domain (configure custom domain for production)
domain_name         = ""  # e.g., "app.embarkquoting.com"
acm_certificate_arn = ""  # e.g., "arn:aws:acm:us-east-1:123456789012:certificate/..."
