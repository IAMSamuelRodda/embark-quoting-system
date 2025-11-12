import { execSync } from 'child_process';

/**
 * Test Utilities for E2E Tests
 *
 * Centralized utilities to ensure consistent credential management
 * and prevent tests from hanging due to missing credentials.
 */

export interface TestCredentials {
  email: string;
  password: string;
}

/**
 * Get test credentials from environment or AWS Secrets Manager
 *
 * Priority:
 * 1. Environment variables (TEST_USER_EMAIL, TEST_USER_PASSWORD)
 * 2. AWS Secrets Manager (embark-quoting/staging/e2e-test-credentials)
 * 3. Fail fast with clear error message
 *
 * @throws Error if credentials cannot be retrieved
 */
export function getTestCredentials(): TestCredentials {
  // Try environment variables first
  const emailFromEnv = process.env.TEST_USER_EMAIL;
  const passwordFromEnv = process.env.TEST_USER_PASSWORD;

  if (emailFromEnv && passwordFromEnv) {
    console.log('[Test Utils] Using credentials from environment variables');
    return {
      email: emailFromEnv,
      password: passwordFromEnv,
    };
  }

  // Try AWS Secrets Manager
  try {
    console.log('[Test Utils] Retrieving credentials from AWS Secrets Manager...');
    const secretString = execSync(
      'aws secretsmanager get-secret-value --secret-id embark-quoting/staging/e2e-test-credentials --query SecretString --output text',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const credentials = JSON.parse(secretString);

    if (!credentials.email || !credentials.password) {
      throw new Error('Credentials retrieved from AWS but missing email or password fields');
    }

    console.log('[Test Utils] Successfully retrieved credentials from AWS');
    return {
      email: credentials.email,
      password: credentials.password,
    };
  } catch (error) {
    // Provide helpful error message
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(
      `❌ CRITICAL: Cannot retrieve test credentials!\n\n` +
      `Tests require valid credentials to run. You have two options:\n\n` +
      `1. Set environment variables:\n` +
      `   export TEST_USER_EMAIL="e2e-test@embark-quoting.local"\n` +
      `   export TEST_USER_PASSWORD="<password>"\n\n` +
      `2. Configure AWS CLI with access to staging secrets:\n` +
      `   aws secretsmanager get-secret-value --secret-id embark-quoting/staging/e2e-test-credentials\n\n` +
      `Error details: ${errorMessage}\n\n` +
      `⚠️  DO NOT run tests without credentials - they will hang indefinitely at login!`
    );
  }
}

/**
 * Validate that credentials are not empty
 * (Safety check before using credentials in tests)
 */
export function validateCredentials(credentials: TestCredentials): void {
  if (!credentials.email || !credentials.password) {
    throw new Error(
      '❌ CRITICAL: Credentials are empty!\n' +
      'Email or password is blank. Tests will fail.\n' +
      'Check your environment variables or AWS credentials.'
    );
  }

  if (credentials.password.length < 8) {
    throw new Error(
      '❌ WARNING: Password looks invalid (too short).\n' +
      `Password length: ${credentials.password.length} characters\n` +
      'Expected: At least 8 characters for Cognito'
    );
  }

  console.log('[Test Utils] Credentials validated successfully');
  console.log(`[Test Utils] Email: ${credentials.email}`);
  console.log(`[Test Utils] Password: ${'*'.repeat(credentials.password.length)} (${credentials.password.length} chars)`);
}

/**
 * Get and validate credentials in one call
 *
 * Use this at the top of test files:
 * ```typescript
 * const credentials = getAndValidateCredentials();
 * const { email, password } = credentials;
 * ```
 */
export function getAndValidateCredentials(): TestCredentials {
  const credentials = getTestCredentials();
  validateCredentials(credentials);
  return credentials;
}
