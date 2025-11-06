import { test } from '@playwright/test';

/**
 * Debug Authentication Test
 * Captures console logs and network activity to diagnose login failure
 */

test('debug login with console logs', async ({ page }) => {
  // Capture console messages
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    console.log(`NETWORK FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Navigate to login
  await page.goto('/login');

  // Fill credentials (using yesterday's working password)
  await page.getByPlaceholder(/email/i).fill('test.worker@embarkearth.com.au');
  await page.getByPlaceholder(/password/i).fill('qBmi_@*Zvs.s6.3xbdCt7F4c-bjfbqZ');

  console.log('=== CLICKING SIGN IN BUTTON ===');

  // Click and wait for navigation or error
  const [response] = await Promise.all([
    page.waitForResponse(response => {
      console.log(`RESPONSE: ${response.url()} - ${response.status()}`);
      return response.url().includes('cognito');
    }, { timeout: 10000 }).catch(() => null),
    page.getByRole('button', { name: /sign in/i }).click()
  ]);

  if (response) {
    console.log(`=== COGNITO RESPONSE: ${response.status()} ===`);
    const body = await response.text().catch(() => '');
    console.log(`BODY: ${body.substring(0, 500)}`);
  }

  // Wait a moment to see what happens
  await page.waitForTimeout(3000);

  // Check current URL
  console.log(`=== FINAL URL: ${page.url()} ===`);

  // Take screenshot
  await page.screenshot({ path: 'debug-login.png', fullPage: true });
});
