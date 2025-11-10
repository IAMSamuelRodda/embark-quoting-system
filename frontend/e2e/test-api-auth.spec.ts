import { test, expect } from '@playwright/test';

test('Verify API authentication uses access token', async ({ page }) => {
  const baseUrl = 'http://localhost:3000';
  const email = 'e2e-test@embark-quoting.local';
  const password = process.env.E2E_TEST_PASSWORD || '';

  // Login
  await page.goto(baseUrl);
  await page.waitForSelector('input[type="email"], input[placeholder*="email" i]');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });

  // Monitor network for API calls
  let apiCallsMade = 0;
  let authErrors = 0;

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      apiCallsMade++;
      console.log(`API Response: ${res.status()} ${res.url()}`);

      if (res.status() === 401) {
        authErrors++;
        const body = await res.text().catch(() => '');
        console.log(`AUTH ERROR: ${body}`);
      }
    }
  });

  // Trigger API requests by navigating to quotes page
  await page.goto(`${baseUrl}/quotes`);
  await page.waitForTimeout(3000);

  // Verify no auth errors
  console.log(`API calls made: ${apiCallsMade}, Auth errors: ${authErrors}`);
  expect(authErrors).toBe(0);
  console.log('✓ No authentication errors - access token is working!');
});
