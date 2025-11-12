# ===================================================================
# Core Configuration Variables
# ===================================================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-2" # Sydney, Australia
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "embark-quoting"
}

# ===================================================================
# Networking Variables (Task 0.2.1)
# ===================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ===================================================================
# Cost Optimization Flags
# ===================================================================

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (costs ~$50/month). Set to false for minimal cost POC."
  type        = bool
  default     = true
}

variable "enable_alb" {
  description = "Enable Application Load Balancer (costs ~$25/month). Set to false for minimal cost POC."
  type        = bool
  default     = true
}

variable "ecs_assign_public_ip" {
  description = "Assign public IPs to ECS tasks (required if no NAT Gateway)"
  type        = bool
  default     = false
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS (production only, doubles cost)"
  type        = bool
  default     = false
}

# ===================================================================
# GitHub OIDC Variables (Task 0.2.2)
# ===================================================================

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "IAMSamuelRodda"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "embark-quoting-system"
}

variable "github_branch" {
  description = "GitHub branch for deployments"
  type        = string
  default     = "main"
}

# ===================================================================
# Database Variables (Task 0.2.4)
# ===================================================================

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.5"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "embark_quoting"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "embark_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# ===================================================================
# Cognito Variables (Task 0.2.5)
# ===================================================================

variable "cognito_user_groups" {
  description = "Cognito user groups to create"
  type        = list(string)
  default     = ["admins", "field_workers"]
}

# ===================================================================
# ECS Variables (Task 0.2.6)
# ===================================================================

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecs_autoscaling_min" {
  description = "Minimum number of ECS tasks for autoscaling"
  type        = number
  default     = 1
}

variable "ecs_autoscaling_max" {
  description = "Maximum number of ECS tasks for autoscaling"
  type        = number
  default     = 4
}

variable "ecs_cpu_threshold" {
  description = "CPU percentage threshold for ECS autoscaling"
  type        = number
  default     = 70
}

variable "ecs_memory_threshold" {
  description = "Memory percentage threshold for ECS autoscaling"
  type        = number
  default     = 80
}

# ===================================================================
# CloudFront Variables (Task 0.2.7)
# ===================================================================

variable "domain_name" {
  description = "Custom domain name (optional, leave empty to use CloudFront default)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (required if domain_name is set)"
  type        = string
  default     = ""
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "Price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}
