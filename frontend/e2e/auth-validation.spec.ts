import { test, expect } from '@playwright/test';

/**
 * Authentication Validation Test
 *
 * Quick validation of authentication flow with real Cognito.
 * Uses test.worker@embarkearth.com.au with known password.
 */

const TEST_CREDENTIALS = {
  email: 'test.automation@embarkearth.com.au',
  password: 'AutoTest123!',
};

test.describe('Authentication Validation', () => {

  test('should complete full authentication flow', async ({ page }) => {
    // Step 1: Navigate to app root
    await page.goto('http://localhost:3000');

    // Should redirect to /login
    await expect(page).toHaveURL('http://localhost:3000/login');

    // Step 2: Verify login page renders
    await expect(page.getByRole('heading', { name: /embark quoting/i })).toBeVisible();
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();

    // Step 3: Fill in credentials
    console.log('📝 Filling in credentials...');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);

    // Step 4: Submit login form
    console.log('🔐 Submitting login...');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Step 5: Wait for redirect to dashboard (allow time for Cognito)
    console.log('⏳ Waiting for Cognito response...');
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 15000 });

    // Step 6: Verify dashboard content
    console.log('✅ Verifying dashboard...');
    await expect(page.getByRole('heading', { name: /embark quoting system/i })).toBeVisible();
    await expect(page.getByText(TEST_CREDENTIALS.email)).toBeVisible();
    await expect(page.getByText(/field_worker/i)).toBeVisible();

    console.log('✅ Login successful!');
  });

  test('should persist authentication after refresh', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 15000 });

    console.log('🔄 Refreshing page...');

    // Refresh the page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    await expect(page.getByRole('heading', { name: /embark quoting system/i })).toBeVisible();

    console.log('✅ Authentication persisted!');
  });

  test('should redirect authenticated users away from login', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 15000 });

    console.log('🔀 Trying to access login while authenticated...');

    // Try to go to login
    await page.goto('http://localhost:3000/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');

    console.log('✅ Redirect working correctly!');
  });

  test('should sign out and clear authentication', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 15000 });

    console.log('🚪 Signing out...');

    // Click sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login', { timeout: 5000 });

    console.log('🔒 Verifying protected route access...');

    // Try to access dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login');

    console.log('✅ Sign out successful!');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    console.log('❌ Testing invalid credentials...');

    // Enter wrong credentials
    await page.getByPlaceholder(/email/i).fill('wrong@example.com');
    await page.getByPlaceholder(/password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message (wait for Cognito)
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });

    // Should stay on login page
    await expect(page).toHaveURL('http://localhost:3000/login');

    console.log('✅ Error handling working correctly!');
  });

  test('should display PWA and offline indicators', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByPlaceholder(/password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 15000 });

    console.log('🔍 Checking PWA indicators...');

    // Should show online status
    await expect(page.getByText(/online/i)).toBeVisible();

    // Should show service worker status
    await expect(page.getByText(/service worker/i)).toBeVisible();

    console.log('✅ PWA features visible!');
  });
});
