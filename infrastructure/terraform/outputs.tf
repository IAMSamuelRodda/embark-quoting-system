# ===================================================================
# Terraform Outputs
# ===================================================================
# These values should be added to GitHub Secrets after deployment
# ===================================================================

# ===================================================================
# GitHub Actions (for CI/CD workflows)
# ===================================================================

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (add to AWS_ROLE_TO_ASSUME secret)"
  value       = aws_iam_role.github_actions.arn
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

# ===================================================================
# ECR (Container Registry)
# ===================================================================

output "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.backend.name
}

# ===================================================================
# ECS (Backend Service)
# ===================================================================

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "ecs_task_definition_family" {
  description = "ECS task definition family"
  value       = aws_ecs_task_definition.backend.family
}

# ===================================================================
# Application Load Balancer (Optional)
# ===================================================================

output "alb_dns_name" {
  description = "ALB DNS name (add to STAGING_API_URL or PROD_API_URL secret). Empty if ALB disabled."
  value       = var.enable_alb ? aws_lb.main[0].dns_name : "ALB_DISABLED"
}

output "alb_url" {
  description = "Full ALB URL. Shows 'ALB_DISABLED' if minimal config."
  value       = var.enable_alb ? "http://${aws_lb.main[0].dns_name}" : "ALB_DISABLED"
}

output "alb_arn" {
  description = "ALB ARN. Empty if ALB disabled."
  value       = var.enable_alb ? aws_lb.main[0].arn : "ALB_DISABLED"
}

# ===================================================================
# S3 and CloudFront (Frontend Hosting)
# ===================================================================

output "s3_bucket_name" {
  description = "S3 bucket name for frontend (add to STAGING_S3_BUCKET or PROD_S3_BUCKET secret)"
  value       = aws_s3_bucket.frontend.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (add to STAGING_CLOUDFRONT_ID or PROD_CLOUDFRONT_ID secret)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (add to STAGING_FRONTEND_URL or PROD_FRONTEND_URL secret)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_url" {
  description = "Full CloudFront URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

# ===================================================================
# Cognito (Authentication)
# ===================================================================

output "cognito_user_pool_id" {
  description = "Cognito user pool ID (add to STAGING_COGNITO_USER_POOL_ID or PROD_COGNITO_USER_POOL_ID secret)"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_arn" {
  description = "Cognito user pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_client_id" {
  description = "Cognito app client ID (add to STAGING_COGNITO_CLIENT_ID or PROD_COGNITO_CLIENT_ID secret)"
  value       = aws_cognito_user_pool_client.frontend.id
}

output "cognito_domain" {
  description = "Cognito hosted UI domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

# ===================================================================
# RDS (Database)
# ===================================================================

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "RDS database address (hostname)"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "RDS database port"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_secret_arn" {
  description = "Secrets Manager ARN for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

# ===================================================================
# VPC (Networking)
# ===================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# ===================================================================
# Quick Setup Summary
# ===================================================================

output "setup_summary" {
  description = "Quick setup summary for GitHub Secrets"
  value = <<-EOT
    ╔══════════════════════════════════════════════════════════════╗
    ║          GITHUB SECRETS CONFIGURATION (${upper(var.environment)})          ║
    ╚══════════════════════════════════════════════════════════════╝

    Add these values to GitHub Secrets:

    AWS Configuration:
    ------------------
    AWS_ROLE_TO_ASSUME:             ${aws_iam_role.github_actions.arn}

    Backend (ECS):
    -------------
    ${upper(var.environment)}_ECS_CLUSTER:               ${aws_ecs_cluster.main.name}
    ${upper(var.environment)}_ECS_SERVICE:               ${aws_ecs_service.backend.name}
    ${upper(var.environment)}_ECR_REPOSITORY:            ${aws_ecr_repository.backend.repository_url}
    ${upper(var.environment)}_API_URL:                   ${var.enable_alb ? "http://${aws_lb.main[0].dns_name}" : "NO_ALB_USE_ECS_PUBLIC_IP"}

    Frontend (S3 + CloudFront):
    --------------------------
    ${upper(var.environment)}_S3_BUCKET:                 ${aws_s3_bucket.frontend.id}
    ${upper(var.environment)}_CLOUDFRONT_ID:             ${aws_cloudfront_distribution.frontend.id}
    ${upper(var.environment)}_FRONTEND_URL:              https://${aws_cloudfront_distribution.frontend.domain_name}

    Cognito (Authentication):
    ------------------------
    ${upper(var.environment)}_COGNITO_USER_POOL_ID:      ${aws_cognito_user_pool.main.id}
    ${upper(var.environment)}_COGNITO_CLIENT_ID:         ${aws_cognito_user_pool_client.frontend.id}

    Database (for reference, accessed via Secrets Manager):
    ------------------------------------------------------
    RDS Endpoint:    ${aws_db_instance.main.endpoint}
    Database Name:   ${aws_db_instance.main.db_name}
    Secret ARN:      ${aws_secretsmanager_secret.db_credentials.arn}

    ╔══════════════════════════════════════════════════════════════╗
    ║                       NEXT STEPS                             ║
    ╚══════════════════════════════════════════════════════════════╝

    1. Add the above secrets to GitHub repository:
       https://github.com/${var.github_org}/${var.github_repo}/settings/secrets/actions

    2. Configure GitHub Environments (staging/production):
       https://github.com/${var.github_org}/${var.github_repo}/settings/environments

    3. Test the deployment workflows:
       - Push to main branch → triggers staging deployment
       - Create tag v*.*.* → triggers production deployment

    4. Access your application:
       - Backend API:  ${var.enable_alb ? aws_lb.main[0].dns_name : "Use ECS task public IP (check AWS Console)"}
       - Frontend:     ${aws_cloudfront_distribution.frontend.domain_name}
       - Cognito UI:   https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com
  EOT
}

# ===================================================================
# VPC Endpoints
# ===================================================================

output "vpc_endpoint_ecr_api_id" {
  description = "ECR API VPC Endpoint ID"
  value       = aws_vpc_endpoint.ecr_api.id
}

output "vpc_endpoint_ecr_dkr_id" {
  description = "ECR Docker VPC Endpoint ID"
  value       = aws_vpc_endpoint.ecr_dkr.id
}

output "vpc_endpoint_s3_id" {
  description = "S3 Gateway VPC Endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_secretsmanager_id" {
  description = "Secrets Manager VPC Endpoint ID"
  value       = aws_vpc_endpoint.secretsmanager.id
}

output "vpc_endpoint_logs_id" {
  description = "CloudWatch Logs VPC Endpoint ID"
  value       = aws_vpc_endpoint.logs.id
}
