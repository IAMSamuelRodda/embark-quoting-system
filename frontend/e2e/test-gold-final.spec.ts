import { test } from '@playwright/test';

test('Final CAT Gold verification with app running', async ({ page, baseURL }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERROR:', msg.text());
  });

  await page.goto(baseURL || '/');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/tmp/final-app-loaded.png', fullPage: true });
  
  // Check CSS variables
  const cssVars = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      primary500: styles.getPropertyValue('--color-primary-500'),
      primary600: styles.getPropertyValue('--color-primary-600'),
      primary900: styles.getPropertyValue('--color-primary-900'),
    };
  });
  
  console.log('\n=== CSS Variables ===');
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
  
  console.log('\n=== Tailwind Class Test ===');
  console.log('bg-primary-500 renders as:', bgTest);
  
  // Check if we expect gold (rgb(255, 180, 0) or similar)
  const isGold = bgTest.includes('255, 180, 0') || bgTest.includes('230, 162, 0');
  console.log('Is CAT Gold?', isGold);
  
  if (!isGold && bgTest !== 'rgba(0, 0, 0, 0)') {
    console.log('WARNING: Unexpected color!');
  }
});
