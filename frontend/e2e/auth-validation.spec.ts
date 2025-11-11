import { test, expect } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

/**
 * Authentication Validation Test
 *
 * Quick validation of authentication flow with real Cognito.
 * Credentials retrieved from AWS Secrets Manager.
 */

const TEST_CREDENTIALS = getAndValidateCredentials();

test.describe('Authentication Validation', () => {

  test.skip('should complete full authentication flow', async ({ page }) => {
    // Step 1: Navigate to app root
    console.log('🌐 Step 1: Navigating to app root...');
    await page.goto('/');

    // Should redirect to /login
    await expect(page).toHaveURL('/login');
    console.log('✅ Redirected to /login');

    // Step 2: Verify login page renders
    console.log('🔍 Step 2: Verifying login page elements...');
    await expect(page.getByRole('heading', { name: /embark quoting/i })).toBeVisible();
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();
    console.log('✅ Login page rendered correctly');

    // Step 3: Fill in credentials
    console.log(`📝 Step 3: Filling in credentials for ${TEST_CREDENTIALS.email}...`);
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    console.log('✅ Credentials filled');

    // Step 4: Submit login form
    console.log('🔐 Step 4: Clicking sign in button...');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Step 5: Wait for redirect to dashboard (Cognito auth should be instant)
    console.log('⏳ Step 5: Waiting for Cognito authentication (max 5s)...');
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
    console.log('✅ Authenticated! Redirected to /dashboard');

    // Step 6: Verify dashboard content
    console.log('✅ Verifying dashboard...');
    await expect(page.getByRole('heading', { name: /embark quoting system/i })).toBeVisible();
    await expect(page.getByText(TEST_CREDENTIALS.email)).toBeVisible();
    await expect(page.getByText(/field_worker/i)).toBeVisible();

    console.log('✅ Login successful!');
  });

  test.skip('should persist authentication after refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    console.log('🔄 Refreshing page...');

    // Refresh the page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /embark quoting system/i })).toBeVisible();

    console.log('✅ Authentication persisted!');
  });

  test.skip('should redirect authenticated users away from login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    console.log('🔀 Trying to access login while authenticated...');

    // Try to go to login
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    console.log('✅ Redirect working correctly!');
  });

  test.skip('should sign out and clear authentication', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    console.log('🚪 Signing out...');

    // Click sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    console.log('🔒 Verifying protected route access...');

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    console.log('✅ Sign out successful!');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    console.log('🌐 Navigating to login page...');
    await page.goto('/login');

    console.log('❌ Testing invalid credentials: wrong@example.com / WrongPassword123!...');

    // Enter wrong credentials
    await page.getByPlaceholder(/email/i).fill('wrong@example.com');
    await page.getByPlaceholder(/password/i).fill('WrongPassword123!');
    console.log('📝 Filled invalid credentials');

    await page.getByRole('button', { name: /sign in/i }).click();
    console.log('🔐 Clicked sign in button');

    // Should show error message (Cognito errors are instant)
    console.log('⏳ Waiting for error message (max 5s)...');
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });
    console.log('✅ Error message displayed');

    // Should stay on login page
    await expect(page).toHaveURL('/login');
    console.log('✅ Correctly stayed on /login page');

    console.log('✅ Error handling working correctly!');
  });

  test.skip('should display PWA and offline indicators', async ({ page }) => {
    // TODO: Implement PWA indicators in dashboard
    // This test is skipped until PWA status indicators are added to the UI

    // Login first
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    console.log('🔍 Checking PWA indicators...');

    // Should show online status
    await expect(page.getByText(/online/i)).toBeVisible();

    // Should show service worker status
    await expect(page.getByText(/service worker/i)).toBeVisible();

    console.log('✅ PWA features visible!');
  });
});
