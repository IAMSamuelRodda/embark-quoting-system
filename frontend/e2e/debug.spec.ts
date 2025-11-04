import { test, expect } from '@playwright/test';

test('debug - capture page HTML and console', async ({ page }) => {
  // Listen for console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Listen for page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Navigate to the home page
  await page.goto('/');

  // Wait a bit for React to mount
  await page.waitForTimeout(2000);

  // Get the page HTML
  const html = await page.content();

  console.log('=== PAGE HTML ===');
  console.log(html);
  console.log('\n=== CONSOLE MESSAGES ===');
  console.log(consoleMessages.join('\n'));
  console.log('\n=== PAGE ERRORS ===');
  console.log(pageErrors.join('\n'));

  // Check if root element exists
  const rootElement = await page.locator('#root').count();
  console.log(`\n=== ROOT ELEMENT COUNT: ${rootElement} ===`);

  // Get root innerHTML
  if (rootElement > 0) {
    const rootHTML = await page.locator('#root').innerHTML();
    console.log('\n=== ROOT INNER HTML ===');
    console.log(rootHTML);
  }

  // This test is just for debugging, so we'll pass it
  expect(true).toBeTruthy();
});
