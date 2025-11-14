# ===================================================================
# Minimal Staging Configuration (~$3-5/month with AWS Free Tier)
# ===================================================================
# This configuration minimizes costs for proof-of-concept deployment
# Remove NAT Gateway, ALB, and use Free Tier resources
# ===================================================================

# Core Configuration
environment  = "staging"
project_name = "embark-quoting"
aws_region   = "ap-southeast-2" # Sydney, Australia

# Networking - SIMPLIFIED (no NAT Gateway needed)
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"] # For RDS only (RDS doesn't need NAT)

# Deployment flags for minimal setup
enable_nat_gateway = false # Save $50/month
enable_alb         = true  # Enable ALB for operational stability (~$18/month)

# GitHub OIDC
github_org    = "IAMSamuelRodda"
github_repo   = "embark-quoting-system"
github_branch = "main"

# Database - FREE TIER (t3.micro, single-AZ)
db_instance_class    = "db.t3.micro" # FREE for 12 months (was db.t4g.micro)
db_allocated_storage = 20            # FREE tier allows up to 20 GB
db_engine_version    = "15"          # Use latest 15.x version available in region
db_name              = "embark_quoting_staging"
db_username          = "embark_admin"
db_multi_az          = false # Single AZ for minimal cost
# db_password - MUST be passed via -var flag or environment variable

# ECS - MINIMAL (use FREE compute credits)
ecs_task_cpu         = 256 # 0.25 vCPU (lowest possible)
ecs_task_memory      = 512 # 512 MB (lowest possible)
ecs_desired_count    = 1   # Single task
ecs_autoscaling_min  = 1
ecs_autoscaling_max  = 2  # Minimal scaling
ecs_cpu_threshold    = 80 # Higher threshold to avoid scaling
ecs_memory_threshold = 85

# ECS Networking - PUBLIC SUBNETS (no NAT Gateway needed)
ecs_assign_public_ip = true # Tasks get public IPs directly

# CloudFront
cloudfront_price_class = "PriceClass_100" # Cheapest option

# Domain (leave empty to use defaults)
domain_name         = ""
acm_certificate_arn = ""

# ===================================================================
# COST ESTIMATE: ~$3-5/month (with AWS Free Tier)
# ===================================================================
#
# FREE (12 months Free Tier):
#   - RDS t3.micro: 750 hours/month FREE
#   - ECS Fargate: First 6 months compute credits
#   - 20 GB RDS storage: FREE
#   - 5 GB S3 storage: FREE
#
# PAID:
#   - S3 requests: ~$0.50/month
#   - CloudFront: ~$2/month (10 GB transfer)
#   - Data transfer: ~$1/month
#   - ECR storage: ~$0.10/month
#
# SAVINGS vs Full Setup:
#   - NAT Gateway: -$50/month
#   - ALB: -$25/month
#   - Total saved: -$75/month
#
# ===================================================================
