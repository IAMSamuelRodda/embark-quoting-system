terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for storing Terraform state
  # Uncomment after creating the S3 bucket and DynamoDB table manually
  # backend "s3" {
  #   bucket         = "embark-terraform-state"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "embark-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "embark-quoting-system"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
