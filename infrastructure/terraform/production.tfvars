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

# Database (production-ready with multi-AZ)
db_instance_class    = "db.t4g.small"  # Larger instance for production
db_allocated_storage = 100              # More storage
db_engine_version    = "15.5"
db_name              = "embark_quoting_prod"
db_username          = "embark_admin"
# db_password - MUST be passed via -var flag or environment variable

# ECS (production resources with auto-scaling)
ecs_task_cpu         = 512   # 0.5 vCPU
ecs_task_memory      = 1024  # 1 GB
ecs_desired_count    = 2     # Start with 2 tasks for redundancy
ecs_autoscaling_min  = 2
ecs_autoscaling_max  = 10
ecs_cpu_threshold    = 70
ecs_memory_threshold = 80

# CloudFront
cloudfront_price_class = "PriceClass_100" # Can upgrade to PriceClass_200 or PriceClass_All

# Domain (configure custom domain for production)
domain_name         = ""  # e.g., "app.embarkquoting.com"
acm_certificate_arn = ""  # e.g., "arn:aws:acm:us-east-1:123456789012:certificate/..."
