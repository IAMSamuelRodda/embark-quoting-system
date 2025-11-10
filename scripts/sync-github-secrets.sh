#!/usr/bin/env bash

# ===================================================================
# Sync Terraform Outputs to GitHub Secrets
# ===================================================================
# This script reads Terraform outputs and updates GitHub Secrets
# to ensure they stay in sync with your infrastructure.
#
# Usage:
#   ./sync-github-secrets.sh [staging|production]
#
# Requirements:
#   - Terraform must be initialized and applied
#   - GitHub CLI (gh) must be authenticated
#   - AWS CLI must be configured
# ===================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===================================================================
# Functions
# ===================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    log_info "Checking requirements..."

    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi

    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Run: gh auth login"
        exit 1
    fi

    log_success "All requirements met"
}

get_terraform_outputs() {
    local env=$1

    log_info "Getting Terraform outputs for ${env}..."

    cd "$(dirname "$0")/../terraform"

    # Select workspace
    terraform workspace select "$env" || {
        log_error "Workspace '${env}' does not exist"
        exit 1
    }

    # Get outputs
    ECR_REPOSITORY=$(terraform output -raw ecr_repository_name)
    ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
    ECS_SERVICE=$(terraform output -raw ecs_service_name)
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
    CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
    COGNITO_POOL_ID=$(terraform output -raw cognito_user_pool_id)
    COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
    E2E_EMAIL=$(terraform output -raw e2e_test_user_email)
    E2E_PASSWORD=$(terraform output -raw e2e_test_user_password)
    ALB_URL=$(terraform output -raw alb_url)

    log_success "Terraform outputs retrieved"
}

sync_secrets() {
    local env=$1
    local env_upper=$(echo "$env" | tr '[:lower:]' '[:upper:]')

    log_info "Syncing secrets for ${env_upper} environment..."

    # Backend secrets
    gh secret set "${env_upper}_ECS_CLUSTER" --body "$ECS_CLUSTER"
    gh secret set "${env_upper}_ECS_SERVICE" --body "$ECS_SERVICE"
    gh secret set "${env_upper}_ECR_REPOSITORY" --body "$ECR_REPOSITORY"

    # API URL
    if [ "$ALB_URL" != "ALB_DISABLED" ]; then
        gh secret set "${env_upper}_API_URL" --body "$ALB_URL"
    else
        log_warning "ALB disabled - ${env_upper}_API_URL should be set manually after deployment"
    fi

    # Frontend secrets
    gh secret set "${env_upper}_S3_BUCKET" --body "$S3_BUCKET"
    gh secret set "${env_upper}_CLOUDFRONT_ID" --body "$CLOUDFRONT_ID"
    gh secret set "${env_upper}_FRONTEND_URL" --body "$CLOUDFRONT_URL"

    # Cognito secrets
    gh secret set "${env_upper}_COGNITO_USER_POOL_ID" --body "$COGNITO_POOL_ID"
    gh secret set "${env_upper}_COGNITO_CLIENT_ID" --body "$COGNITO_CLIENT_ID"

    log_success "${env_upper} secrets synced"

    # E2E credentials (environment-specific)
    if [ "$env" = "staging" ]; then
        log_info "Syncing E2E test credentials (staging)..."
        gh secret set E2E_TEST_USER_EMAIL --body "$E2E_EMAIL"
        gh secret set E2E_TEST_USER_PASSWORD --body "$E2E_PASSWORD"
        log_success "E2E staging credentials synced"
    elif [ "$env" = "production" ]; then
        log_info "Syncing E2E test credentials (production)..."
        gh secret set E2E_TEST_USER_EMAIL --body "$E2E_EMAIL"
        gh secret set E2E_PROD_USER_PASSWORD --body "$E2E_PASSWORD"
        log_success "E2E production credentials synced"
    fi
}

print_summary() {
    local env=$1
    local env_upper=$(echo "$env" | tr '[:lower:]' '[:upper:]')

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              SECRETS SYNC COMPLETE                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Environment: ${env_upper}"
    echo ""
    echo "Updated secrets:"
    echo "  - ${env_upper}_ECS_CLUSTER"
    echo "  - ${env_upper}_ECS_SERVICE"
    echo "  - ${env_upper}_ECR_REPOSITORY"
    echo "  - ${env_upper}_API_URL"
    echo "  - ${env_upper}_S3_BUCKET"
    echo "  - ${env_upper}_CLOUDFRONT_ID"
    echo "  - ${env_upper}_FRONTEND_URL"
    echo "  - ${env_upper}_COGNITO_USER_POOL_ID"
    echo "  - ${env_upper}_COGNITO_CLIENT_ID"

    if [ "$env" = "staging" ]; then
        echo "  - E2E_TEST_USER_EMAIL"
        echo "  - E2E_TEST_USER_PASSWORD"
    elif [ "$env" = "production" ]; then
        echo "  - E2E_TEST_USER_EMAIL"
        echo "  - E2E_PROD_USER_PASSWORD"
    fi

    echo ""
    echo "Source: Terraform outputs from '${env}' workspace"
    echo ""
    log_success "All GitHub Secrets are now synchronized with Terraform! 🎉"
}

# ===================================================================
# Main Script
# ===================================================================

main() {
    # Check arguments
    if [ $# -ne 1 ]; then
        echo "Usage: $0 [staging|production]"
        exit 1
    fi

    local environment=$1

    # Validate environment
    if [ "$environment" != "staging" ] && [ "$environment" != "production" ]; then
        log_error "Invalid environment. Must be 'staging' or 'production'"
        exit 1
    fi

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║       TERRAFORM → GITHUB SECRETS SYNC                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    # Run sync process
    check_requirements
    get_terraform_outputs "$environment"
    sync_secrets "$environment"
    print_summary "$environment"
}

main "$@"
