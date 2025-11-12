import { test } from '@playwright/test';

test('Debug page load and CSS', async ({ page, baseURL }) => {
  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Listen for page errors
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto(baseURL || '/');
  await page.waitForTimeout(3000);
  
  // Check if React app loaded
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      hasContent: root?.innerHTML.length || 0,
      innerHTML: root?.innerHTML.substring(0, 200)
    };
  });
  
  console.log('\n=== Root Element ===');
  console.log('Content length:', rootContent.hasContent);
  console.log('First 200 chars:', rootContent.innerHTML);
  
  // Check loaded stylesheets
  const stylesheets = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    return sheets.map(sheet => ({
      href: sheet.href,
      rulesCount: sheet.cssRules?.length || 0
    }));
  });
  
  console.log('\n=== Loaded Stylesheets ===');
  console.log(JSON.stringify(stylesheets, null, 2));
  
  // Check if Tailwind classes are working
  const tailwindTest = await page.evaluate(() => {
    const testDiv = document.createElement('div');
    testDiv.className = 'bg-primary-500';
    document.body.appendChild(testDiv);
    const computed = window.getComputedStyle(testDiv);
    const bgColor = computed.backgroundColor;
    document.body.removeChild(testDiv);
    return bgColor;
  });
  
  console.log('\n=== Tailwind Test ===');
  console.log('bg-primary-500 renders as:', tailwindTest);
  
  await page.screenshot({ path: '/tmp/debug-screenshot.png', fullPage: true });
});
