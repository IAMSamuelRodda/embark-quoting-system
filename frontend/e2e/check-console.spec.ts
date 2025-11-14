import { test } from '@playwright/test';

test('Check console errors', async ({ page, baseURL }) => {
  const errors: string[] = [];

  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    errors.push(error.message);
  });

  await page.goto(baseURL || '/');
  await page.waitForTimeout(3000);

  console.log('\n=== All Console Errors ===');
  errors.forEach(err => console.log('ERROR:', err));

  console.log('\n=== Page Content ===');
  const content = await page.content();
  console.log('HTML length:', content.length);
  console.log('Root div:', await page.locator('#root').innerHTML().catch(() => 'empty'));
});
