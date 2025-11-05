# ===================================================================
# VPC Endpoints for ECS Fargate Access to AWS Services
# ===================================================================
# Required for ECS tasks to access ECR, S3, and other AWS services
# Enables image pulling without NAT Gateway (~$7/month vs $50/month)
# IMPORTANT: VPC endpoints must be in same subnets as ECS tasks
# Note: Security group is defined in ecr-security.tf
# ===================================================================

# ===================================================================
# ECR API Endpoint (for authentication)
# ===================================================================

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  # FIXED: Use same subnets as ECS tasks (private if they exist, otherwise public)
  subnet_ids          = length(var.private_subnet_cidrs) > 0 ? aws_subnet.private[*].id : aws_subnet.public[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-${var.environment}-ecr-api"
  }
}

# ===================================================================
# ECR Docker Endpoint (for image pulling)
# ===================================================================

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  # FIXED: Use same subnets as ECS tasks (private if they exist, otherwise public)
  subnet_ids          = length(var.private_subnet_cidrs) > 0 ? aws_subnet.private[*].id : aws_subnet.public[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-${var.environment}-ecr-dkr"
  }
}

# ===================================================================
# S3 Gateway Endpoint (for ECR image layers - FREE!)
# ===================================================================

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  # FIXED: Attach to private route table if it exists, otherwise public
  route_table_ids   = length(var.private_subnet_cidrs) > 0 ? [aws_route_table.private[0].id] : [aws_route_table.public.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-s3"
  }
}

# ===================================================================
# Secrets Manager Endpoint (for database credentials)
# ===================================================================

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  # FIXED: Use same subnets as ECS tasks (private if they exist, otherwise public)
  subnet_ids          = length(var.private_subnet_cidrs) > 0 ? aws_subnet.private[*].id : aws_subnet.public[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-${var.environment}-secretsmanager"
  }
}

# ===================================================================
# CloudWatch Logs Endpoint (for container logging)
# ===================================================================

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  # FIXED: Use same subnets as ECS tasks (private if they exist, otherwise public)
  subnet_ids          = length(var.private_subnet_cidrs) > 0 ? aws_subnet.private[*].id : aws_subnet.public[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-${var.environment}-logs"
  }
}
