import { test } from '@playwright/test';

test('Screenshot full app with CAT Gold colors', async ({ page, baseURL }) => {
  await page.goto(baseURL || '/');
  await page.waitForTimeout(3000);

  // Take screenshot of login page
  await page.screenshot({ path: '/tmp/app-with-cat-gold.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/app-with-cat-gold.png');
});
