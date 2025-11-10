# E2E Test User

## Overview
An E2E test user is automatically created via Terraform for automated testing.

## Credentials
- **Email**: `e2e-test@embark-quoting.local`
- **Password**: Stored in GitHub Secrets (`E2E_TEST_USER_PASSWORD`)
- **Group**: `field_workers`
- **Status**: CONFIRMED (ready for use)

## Terraform Resources
- `random_password.e2e_test_user` - Generates secure password
- `aws_cognito_user.e2e_test_user` - Creates the user
- `aws_cognito_user_in_group.e2e_test_user_group` - Adds to field_workers group
- `aws_secretsmanager_secret.e2e_test_credentials` - Stores credentials in Secrets Manager

## GitHub Secrets
The following secrets are configured for E2E tests:
- `E2E_TEST_USER_EMAIL`
- `E2E_TEST_USER_PASSWORD`

## Password Management
The password is set as permanent via `admin-set-user-password --permanent` to avoid requiring password change on first login.
