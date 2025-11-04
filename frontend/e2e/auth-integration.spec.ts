import { test, expect } from '@playwright/test';

/**
 * Real AWS Cognito Integration Tests
 *
 * These tests use REAL AWS Cognito services and should only be run:
 * - Manually before releases
 * - Locally during development (not in CI/CD)
 * - With proper AWS credentials configured
 *
 * WARNING: These tests:
 * - Make real API calls to AWS (costs money)
 * - Are slow (~10 seconds per test)
 * - Require test user cleanup
 * - Can hit AWS rate limits
 *
 * Run manually: npx playwright test auth-integration --headed
 */

// Skip all tests by default - run explicitly when needed
test.describe.skip('Authentication Integration - Real Cognito', () => {

  const TEST_USER = {
    email: process.env.TEST_USER_EMAIL || 'test.worker@embarkearth.com.au',
    tempPassword: process.env.TEST_TEMP_PASSWORD || 'TempPass123!',
    newPassword: process.env.TEST_NEW_PASSWORD || '', // Set via env var
  };

  test.beforeAll(() => {
    // Verify environment variables are set
    if (!TEST_USER.newPassword) {
      console.error('❌ TEST_NEW_PASSWORD environment variable not set');
      console.error('Set it with: export TEST_NEW_PASSWORD="YourStrongPassword123!"');
      process.exit(1);
    }
  });

  test('should complete full new password flow with real Cognito', async ({ page }) => {
    // Step 1: Navigate to login
    await page.goto('/login');

    // Step 2: Enter temporary credentials
    await page.getByPlaceholder(/email/i).fill(TEST_USER.email);
    await page.getByPlaceholder(/password/i).fill(TEST_USER.tempPassword);

    // Step 3: Submit login
    await page.getByRole('button', { name: /sign in/i }).click();

    // Step 4: Wait for new password form (10 second timeout for Cognito)
    await expect(page.getByText(/set new password/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Fill new password form
    await page.getByPlaceholder(/enter your new password/i).fill(TEST_USER.newPassword);
    await page.getByPlaceholder(/confirm your new password/i).fill(TEST_USER.newPassword);

    // Step 6: Submit new password
    await page.getByRole('button', { name: /set password/i }).click();

    // Step 7: Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Step 8: Verify dashboard content
    await expect(page.getByText(/embark quoting system/i)).toBeVisible();
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
    await expect(page.getByText(/field_worker/i)).toBeVisible();
  });

  test('should persist authentication after page refresh', async ({ page }) => {
    // Prerequisite: User must be logged in from previous test

    await page.goto('/dashboard');

    // Should be on dashboard (authenticated)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/embark quoting system/i)).toBeVisible();

    // Refresh page
    await page.reload();

    // Should STILL be on dashboard (tokens persisted)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/embark quoting system/i)).toBeVisible();
  });

  test('should logout and clear authentication', async ({ page }) => {
    // Prerequisite: User must be logged in

    await page.goto('/dashboard');

    // Click sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect back to login
    await expect(page).toHaveURL('/login');
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials
    await page.getByPlaceholder(/email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/password/i).fill('WrongPassword123!');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message (wait for Cognito response)
    await expect(page.getByText(/incorrect username or password/i)).toBeVisible({ timeout: 10000 });

    // Should NOT redirect to dashboard
    await expect(page).toHaveURL('/login');
  });

  test('should handle user that does not exist', async ({ page }) => {
    await page.goto('/login');

    // Enter non-existent user
    await page.getByPlaceholder(/email/i).fill('nonexistent@example.com');
    await page.getByPlaceholder(/password/i).fill('Password123!');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error (Cognito returns same error for security)
    await expect(page.getByText(/incorrect username or password/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe.skip('User Management - Real Cognito', () => {

  test('create test user via AWS CLI', async () => {
    // This test documents the user creation process
    // Actual creation should be done manually via CLI

    const commands = `
# Create user
aws cognito-idp admin-create-user \\
  --user-pool-id ap-southeast-2_WCrUlLwIE \\
  --username test.playwright@embarkearth.com.au \\
  --user-attributes Name=email,Value=test.playwright@embarkearth.com.au \\
                     Name=email_verified,Value=true \\
                     Name=custom:role,Value=field_worker \\
  --temporary-password "TestTemp123!" \\
  --message-action SUPPRESS \\
  --region ap-southeast-2

# Add to group
aws cognito-idp admin-add-user-to-group \\
  --user-pool-id ap-southeast-2_WCrUlLwIE \\
  --username test.playwright@embarkearth.com.au \\
  --group-name field_workers \\
  --region ap-southeast-2
    `;

    console.log('To create test user, run:', commands);
  });

  test('cleanup test user after tests', async () => {
    // This test documents the cleanup process
    // Actual cleanup should be done manually or in CI teardown

    const commands = `
# Delete user
aws cognito-idp admin-delete-user \\
  --user-pool-id ap-southeast-2_WCrUlLwIE \\
  --username test.playwright@embarkearth.com.au \\
  --region ap-southeast-2
    `;

    console.log('To cleanup test user, run:', commands);
  });
});

/**
 * Environment Variable Setup
 *
 * Create a .env.test file (DO NOT commit to git):
 *
 * TEST_USER_EMAIL=test.playwright@embarkearth.com.au
 * TEST_TEMP_PASSWORD=TestTemp123!
 * TEST_NEW_PASSWORD=YourStrongPassword123!
 *
 * Load before running tests:
 * export $(cat .env.test | xargs) && npx playwright test auth-integration --headed
 */
