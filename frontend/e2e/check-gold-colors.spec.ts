import { test } from '@playwright/test';

test('Visual verification of CAT Gold colors', async ({ page, baseURL }) => {
  // Go to root, which should redirect to login
  await page.goto(baseURL || '/');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Take screenshot of whatever loaded
  await page.screenshot({ path: '/tmp/app-loaded.png', fullPage: true });
  console.log('Screenshot saved to /tmp/app-loaded.png');
  
  // Check CSS variables in the browser
  const colors = await page.evaluate(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      primary500: computedStyle.getPropertyValue('--color-primary-500'),
      primary600: computedStyle.getPropertyValue('--color-primary-600'),
      primary900: computedStyle.getPropertyValue('--color-primary-900'),
    };
  });
  
  console.log('\n=== Computed CSS Variables ===');
  console.log('--color-primary-500:', colors.primary500);
  console.log('--color-primary-600:', colors.primary600);
  console.log('--color-primary-900:', colors.primary900);
  
  // Get all computed colors for elements with primary classes
  const elementColors = await page.evaluate(() => {
    const results: Array<Record<string, string>> = [];

    // Find all elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      const bg = computed.backgroundColor;
      const color = computed.color;

      // Check if any color contains RGB values that might be gold
      if (bg.includes('230, 162') || bg.includes('255, 180')) {
        results.push({
          tag: el.tagName,
          class: el.className,
          backgroundColor: bg
        });
      }
      if (color.includes('230, 162') || color.includes('255, 180')) {
        results.push({
          tag: el.tagName,
          class: el.className,
          textColor: color
        });
      }
    });

    return results.slice(0, 10); // First 10 matches
  });
  
  console.log('\n=== Elements Using Gold Colors ===');
  console.log(JSON.stringify(elementColors, null, 2));
});
