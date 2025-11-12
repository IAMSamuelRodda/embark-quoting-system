import { test, expect } from '@playwright/test';

test.describe('CAT Gold Color Verification', () => {
  test('should check computed CSS variables', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      
      return {
        'primary-500': styles.getPropertyValue('--color-primary-500').trim(),
        'primary-600': styles.getPropertyValue('--color-primary-600').trim(),
        'primary-900': styles.getPropertyValue('--color-primary-900').trim(),
      };
    });

    console.log('=== CSS Variables ===');
    console.log('Primary-500 (CAT Gold base):', cssVariables['primary-500']);
    console.log('Primary-600 (hover):', cssVariables['primary-600']);
    console.log('Primary-900 (text):', cssVariables['primary-900']);
    
    // Verify CAT Gold values
    expect(cssVariables['primary-500']).toBe('#ffb400');
    expect(cssVariables['primary-600']).toBe('#e6a200');
    expect(cssVariables['primary-900']).toBe('#996600');
  });

  test('should display CAT Gold on UI elements', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: '/tmp/login-page-full.png', fullPage: true });
    console.log('Screenshot saved to /tmp/login-page-full.png');

    // Check link color
    const forgotPasswordLink = page.locator('a').filter({ hasText: /forgot/i }).first();
    if (await forgotPasswordLink.count() > 0) {
      const linkColor = await forgotPasswordLink.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      console.log('=== Link Color ===');
      console.log('Forgot Password link color:', linkColor);
    }

    // Check checkbox accent color
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.count() > 0) {
      await checkbox.check();
      await page.screenshot({ path: '/tmp/checkbox-checked.png' });
      
      const checkboxColor = await checkbox.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          accentColor: styles.accentColor,
          color: styles.color,
        };
      });
      console.log('=== Checkbox Color ===');
      console.log('Checkbox styles:', checkboxColor);
    }
  });
});
