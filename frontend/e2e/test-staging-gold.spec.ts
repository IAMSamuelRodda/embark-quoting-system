import { test, expect } from '@playwright/test';

test('Verify CAT Gold colors on staging environment', async ({ page, baseURL }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERROR:', msg.text());
  });

  // Use cache-busting query parameter to bypass CloudFront cache
  const cacheBuster = Date.now();
  await page.goto(`${baseURL || '/'}?v=${cacheBuster}`, {
    waitUntil: 'networkidle'
  });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/staging-colors.png', fullPage: true });

  // Check CSS variables
  const cssVars = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      primary500: styles.getPropertyValue('--color-primary-500'),
      primary600: styles.getPropertyValue('--color-primary-600'),
      primary900: styles.getPropertyValue('--color-primary-900'),
    };
  });

  console.log('\n=== Staging CSS Variables ===');
  console.log('primary-500:', cssVars.primary500);
  console.log('primary-600:', cssVars.primary600);
  console.log('primary-900:', cssVars.primary900);

  // Test Tailwind class rendering
  const bgTest = await page.evaluate(() => {
    const div = document.createElement('div');
    div.className = 'bg-primary-500';
    document.body.appendChild(div);
    const bg = window.getComputedStyle(div).backgroundColor;
    document.body.removeChild(div);
    return bg;
  });

  console.log('\n=== Staging Tailwind Class Test ===');
  console.log('bg-primary-500 renders as:', bgTest);

  // Check if we have CAT Gold (rgb(255, 180, 0))
  const isGold = bgTest.includes('255, 180, 0') || bgTest.includes('230, 162, 0');
  console.log('Is CAT Gold?', isGold);

  expect(isGold).toBe(true);
});
