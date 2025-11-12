import { test } from '@playwright/test';

test('Visual color verification', async ({ page, baseURL }) => {
  await page.goto(baseURL || '/');
  await page.waitForTimeout(2000);

  // Create a test page with visible colored elements
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div style="padding: 40px; background: white;">
        <h1 style="font-size: 32px; margin-bottom: 20px;">CAT Gold Color Scheme Test</h1>

        <div style="margin: 20px 0;">
          <h2 style="font-size: 24px; margin-bottom: 10px;">Primary Colors</h2>
          <div class="bg-primary-500" style="padding: 20px; margin: 10px 0;">
            <span style="font-weight: bold; font-size: 18px;">Primary 500 (#FFB400) - Main Brand Color</span>
          </div>
          <div class="bg-primary-600" style="padding: 20px; margin: 10px 0;">
            <span style="font-weight: bold; font-size: 18px;">Primary 600 (#E6A200) - Hover State</span>
          </div>
          <div class="bg-primary-50" style="padding: 20px; margin: 10px 0;">
            <span class="text-primary-900" style="font-weight: bold; font-size: 18px;">Primary 50 Background with Primary 900 Text</span>
          </div>
        </div>

        <div style="margin: 20px 0;">
          <h2 style="font-size: 24px; margin-bottom: 10px;">Buttons</h2>
          <button class="btn-primary" style="margin-right: 10px;">Primary Button</button>
          <button class="btn-secondary">Secondary Button</button>
        </div>

        <div style="margin: 20px 0;">
          <h2 style="font-size: 24px; margin-bottom: 10px;">Borders & Text</h2>
          <div class="border-2 border-primary-500" style="padding: 15px; margin: 10px 0;">
            <span class="text-primary-600" style="font-size: 16px;">Text in Primary 600 with Primary 500 border</span>
          </div>
        </div>
      </div>
    `;
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/cat-gold-colors-visual.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/cat-gold-colors-visual.png');
});
