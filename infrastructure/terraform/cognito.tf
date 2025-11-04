# ============================================================================
# AWS Cognito User Pool Configuration
# Feature 1.3: Cognito User Pool Setup
# ============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-2" # Sydney
}

# ============================================================================
# COGNITO USER POOL
# ============================================================================

resource "aws_cognito_user_pool" "embark_quoting" {
  name = "embark-quoting-users"

  # Custom attributes (Note: custom: prefix added automatically by Cognito)
  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
    required            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  # Password Policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Email Configuration
  auto_verified_attributes = ["email"]

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT" # Use Cognito's email service (50 emails/day free)
    # TODO: Upgrade to SES for production (configure_ses = true)
  }

  # Account Recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # MFA Configuration (Optional for now)
  mfa_configuration = "OPTIONAL"

  # User Pool Add-ons
  user_pool_add_ons {
    advanced_security_mode = "AUDIT" # Enables compromised credentials detection
  }

  # Device Tracking (Important for offline-first apps)
  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = false
  }

  # Email Verification Message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Embark Quoting System - Verify your email"
    email_message        = "Welcome to Embark Quoting System! Your verification code is: {####}"
  }

  # User Attributes
  # Standard attributes: email (required for login)
  # Custom attributes: role (configured in schema above)

  # Deletion Protection
  deletion_protection = "ACTIVE" # Prevent accidental deletion

  tags = {
    Name    = "embark-quoting-users"
    Project = "embark-quoting-system"
    ManagedBy = "terraform"
  }
}

# ============================================================================
# COGNITO USER POOL CLIENT (App Client)
# ============================================================================

resource "aws_cognito_user_pool_client" "embark_pwa" {
  name         = "embark-pwa-client"
  user_pool_id = aws_cognito_user_pool.embark_quoting.id

  # OAuth Configuration
  allowed_oauth_flows  = ["code", "implicit"]
  allowed_oauth_scopes = ["email", "openid", "profile"]
  callback_urls        = [
    "http://localhost:5173/callback",  # Vite dev server
    "http://localhost:3000/callback",  # Production frontend (will update with ALB URL)
    "https://your-domain.com/callback" # TODO: Update with actual domain
  ]
  logout_urls = [
    "http://localhost:5173/logout",
    "http://localhost:3000/logout",
    "https://your-domain.com/logout"
  ]
  allowed_oauth_flows_user_pool_client = true

  # Token Validity (Optimized for offline-first PWA)
  access_token_validity  = 1  # 1 hour (short-lived for security)
  id_token_validity      = 1  # 1 hour
  refresh_token_validity = 30 # 30 days (long-lived for offline support)

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Prevent client secret (for SPA/PWA - public client)
  generate_secret = false

  # Auth Flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",      # Username/password login
    "ALLOW_REFRESH_TOKEN_AUTH",      # Critical for offline-first apps
    "ALLOW_USER_SRP_AUTH",           # Secure Remote Password protocol
    "ALLOW_CUSTOM_AUTH"              # For future custom auth flows
  ]

  # Read/Write Attributes
  read_attributes = [
    "email",
    "email_verified",
    "name",
    "custom:role"
  ]

  write_attributes = [
    "email",
    "name"
  ]

  # Prevent user existence errors (security best practice)
  prevent_user_existence_errors = "ENABLED"
}

# ============================================================================
# COGNITO USER GROUPS
# ============================================================================

# Admin Group
resource "aws_cognito_user_group" "admins" {
  name         = "admins"
  user_pool_id = aws_cognito_user_pool.embark_quoting.id
  description  = "Administrators with full access to price management and user management"
  precedence   = 1 # Lower number = higher precedence
}

# Field Worker Group
resource "aws_cognito_user_group" "field_workers" {
  name         = "field_workers"
  user_pool_id = aws_cognito_user_pool.embark_quoting.id
  description  = "Field workers with access to quote management (no price management)"
  precedence   = 2
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.embark_quoting.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.embark_quoting.arn
}

output "user_pool_endpoint" {
  description = "Cognito User Pool Endpoint"
  value       = aws_cognito_user_pool.embark_quoting.endpoint
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID (for frontend app)"
  value       = aws_cognito_user_pool_client.embark_pwa.id
}

output "user_pool_domain" {
  description = "Cognito User Pool Domain (if using hosted UI)"
  value       = "https://cognito-idp.ap-southeast-2.amazonaws.com/${aws_cognito_user_pool.embark_quoting.id}"
}

# ============================================================================
# NOTES
# ============================================================================

# Authentication Flow for Offline-First PWA:
# 1. User logs in → receives ID token, access token, refresh token
# 2. Store tokens in IndexedDB (accessible by service worker)
# 3. Access token expires after 1 hour
# 4. Use refresh token (valid 30 days) to get new tokens
# 5. If offline: Continue using cached tokens until online
# 6. When reconnecting: Refresh tokens before syncing data

# Token Storage Best Practices:
# - Store in IndexedDB (NOT localStorage for service worker compatibility)
# - Encrypt sensitive data at rest
# - Clear tokens on logout
# - Implement token refresh mechanism (75% of lifetime)

# Testing Steps:
# 1. terraform init
# 2. terraform plan
# 3. terraform apply
# 4. Create test users via AWS Console:
#    - Admin user: admin@example.com (add to admins group)
#    - Field worker: field@example.com (add to field_workers group)
# 5. Test email verification flow
# 6. Test password reset flow
# 7. Test token refresh mechanism
