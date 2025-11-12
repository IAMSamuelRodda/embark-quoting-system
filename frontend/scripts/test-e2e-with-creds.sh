#!/bin/bash
# Run E2E tests with credentials from AWS Secrets Manager

set -e

echo "🔐 Fetching E2E test credentials from AWS Secrets Manager..."

# Fetch credentials from AWS Secrets Manager
CREDENTIALS=$(aws secretsmanager get-secret-value \
  --secret-id embark-quoting/staging/e2e-test-credentials \
  --query SecretString \
  --output text)

# Extract email and password
export TEST_USER_EMAIL=$(echo "$CREDENTIALS" | jq -r '.email')
export TEST_USER_PASSWORD=$(echo "$CREDENTIALS" | jq -r '.password')
export E2E_TEST_USER_EMAIL="$TEST_USER_EMAIL"
export E2E_TEST_USER_PASSWORD="$TEST_USER_PASSWORD"

echo "✓ Credentials loaded"
echo "  Email: $TEST_USER_EMAIL"
echo ""
echo "🧪 Running E2E tests..."

# Run Playwright tests with all arguments passed through
npm run test:e2e -- "$@"
