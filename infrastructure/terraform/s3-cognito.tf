# ===================================================================
# Task 0.2.5: S3 Buckets and Cognito
# ===================================================================
# Creates S3 buckets for frontend hosting and Cognito for authentication
# Dependencies: None (but will be referenced by CloudFront)
# ===================================================================

# ===================================================================
# S3 Bucket for Frontend Static Hosting
# ===================================================================

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-${var.environment}-frontend"

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend"
  }
}

# Enable versioning for rollback capability
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = var.environment == "production" ? "Enabled" : "Suspended"
  }
}

# Block public access (CloudFront will access via OAI)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable encryption at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS configuration for API calls from frontend
resource "aws_s3_bucket_cors_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"] # Will be restricted to CloudFront domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lifecycle policy to clean up old versions
resource "aws_s3_bucket_lifecycle_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# ===================================================================
# CloudFront Origin Access Identity (for S3 access)
# ===================================================================

resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for ${var.project_name}-${var.environment}-frontend"
}

# S3 bucket policy allowing CloudFront access
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# ===================================================================
# Cognito User Pool
# ===================================================================

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-users"

  # Username configuration
  username_attributes = ["email"]
  username_configuration {
    case_sensitive = false
  }

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email verification
  auto_verified_attributes = ["email"]
  email_verification_subject = "Your Embark Quoting verification code"
  email_verification_message = "Your verification code is {####}"

  # User attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 5
      max_length = 255
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 255
    }
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  # Multi-factor authentication (optional for users)
  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration {
    enabled = true
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = var.environment == "production" ? "ENFORCED" : "AUDIT"
  }

  # Device tracking
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-users"
  }
}

# ===================================================================
# Cognito User Pool Client (for frontend application)
# ===================================================================

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.project_name}-${var.environment}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth configuration
  generate_secret                      = false # Public client (SPA)
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = ["http://localhost:5173", "https://${var.domain_name}"]
  logout_urls                          = ["http://localhost:5173", "https://${var.domain_name}"]

  # Token validity
  access_token_validity  = 1  # 1 hour
  id_token_validity      = 1  # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Attribute read/write permissions
  read_attributes  = ["email", "name", "custom:role"]
  write_attributes = ["name"]

  # Prevent user existence errors (security best practice)
  prevent_user_existence_errors = "ENABLED"

  # Enable token revocation
  enable_token_revocation = true
}

# ===================================================================
# Cognito User Groups
# ===================================================================

resource "aws_cognito_user_group" "admins" {
  name         = "admins"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrator group with full access"
  precedence   = 1
}

resource "aws_cognito_user_group" "field_workers" {
  name         = "field_workers"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Field workers with quote creation and editing access"
  precedence   = 2
}

# ===================================================================
# Cognito Domain (for hosted UI)
# ===================================================================

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}
