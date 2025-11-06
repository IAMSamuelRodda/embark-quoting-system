/**
 * Automated Accessibility Tests - All Components
 *
 * Uses axe-core via Playwright to automatically test all components
 * for WCAG AA compliance violations.
 *
 * Run: npm run test:a11y
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Base URL for Storybook (must be running)
const STORYBOOK_URL = 'http://localhost:6006';

/**
 * Helper function to test a story for accessibility violations
 */
async function testStoryAccessibility(page: any, storyId: string, storyName: string) {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=${storyId}`);
  await page.waitForLoadState('networkidle');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations, `${storyName} should have no accessibility violations`).toEqual([]);
}

test.describe('Button Component Accessibility', () => {
  test('Primary button', async ({ page }) => {
    await testStoryAccessibility(page, 'components-button--primary', 'Primary Button');
  });

  test('Secondary button', async ({ page }) => {
    await testStoryAccessibility(page, 'components-button--secondary', 'Secondary Button');
  });

  test('Tertiary button', async ({ page }) => {
    await testStoryAccessibility(page, 'components-button--tertiary', 'Tertiary Button');
  });

  test('Disabled button', async ({ page }) => {
    await testStoryAccessibility(page, 'components-button--primary-disabled', 'Disabled Button');
  });

  test('Loading button', async ({ page }) => {
    await testStoryAccessibility(page, 'components-button--primary-loading', 'Loading Button');
  });
});

test.describe('Input Component Accessibility', () => {
  test('Default input', async ({ page }) => {
    await testStoryAccessibility(page, 'components-input--default', 'Default Input');
  });

  test('Input with error', async ({ page }) => {
    await testStoryAccessibility(page, 'components-input--with-error', 'Input with Error');
  });

  test('Input with success', async ({ page }) => {
    await testStoryAccessibility(page, 'components-input--with-success', 'Input with Success');
  });

  test('Required input', async ({ page }) => {
    await testStoryAccessibility(page, 'components-input--required', 'Required Input');
  });

  test('Disabled input', async ({ page }) => {
    await testStoryAccessibility(page, 'components-input--disabled', 'Disabled Input');
  });
});

test.describe('Select Component Accessibility', () => {
  test('Default select', async ({ page }) => {
    await testStoryAccessibility(page, 'components-select--default', 'Default Select');
  });

  test('Select with error', async ({ page }) => {
    await testStoryAccessibility(page, 'components-select--with-error', 'Select with Error');
  });

  test('Required select', async ({ page }) => {
    await testStoryAccessibility(page, 'components-select--required', 'Required Select');
  });

  test('Disabled select', async ({ page }) => {
    await testStoryAccessibility(page, 'components-select--disabled', 'Disabled Select');
  });
});

test.describe('Checkbox Component Accessibility', () => {
  test('Unchecked checkbox', async ({ page }) => {
    await testStoryAccessibility(page, 'components-checkbox--unchecked', 'Unchecked Checkbox');
  });

  test('Checked checkbox', async ({ page }) => {
    await testStoryAccessibility(page, 'components-checkbox--checked', 'Checked Checkbox');
  });

  test('Checkbox with error', async ({ page }) => {
    await testStoryAccessibility(page, 'components-checkbox--with-error', 'Checkbox with Error');
  });

  test('Disabled checkbox', async ({ page }) => {
    await testStoryAccessibility(page, 'components-checkbox--disabled-unchecked', 'Disabled Checkbox');
  });
});

test.describe('Radio Component Accessibility', () => {
  test('Unchecked radio', async ({ page }) => {
    await testStoryAccessibility(page, 'components-radio--unchecked', 'Unchecked Radio');
  });

  test('Checked radio', async ({ page }) => {
    await testStoryAccessibility(page, 'components-radio--checked', 'Checked Radio');
  });

  test('Radio with error', async ({ page }) => {
    await testStoryAccessibility(page, 'components-radio--with-error', 'Radio with Error');
  });

  test('Radio group', async ({ page }) => {
    await testStoryAccessibility(page, 'components-radio--radio-group', 'Radio Group');
  });
});

test.describe('Card Component Accessibility', () => {
  test('Elevated card', async ({ page }) => {
    await testStoryAccessibility(page, 'components-card--elevated', 'Elevated Card');
  });

  test('Interactive card', async ({ page }) => {
    await testStoryAccessibility(page, 'components-card--interactive', 'Interactive Card');
  });

  test('Card with header/body/footer', async ({ page }) => {
    await testStoryAccessibility(page, 'components-card--with-header-body-footer', 'Card with Composition');
  });
});

test.describe('Modal Component Accessibility', () => {
  test('Default modal', async ({ page }) => {
    // Open modal first
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=components-modal--default`);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Open Modal")');
    await page.waitForSelector('[role="dialog"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations, 'Modal should have no accessibility violations').toEqual([]);
  });
});

test.describe('Toast Component Accessibility', () => {
  test('Success toast', async ({ page }) => {
    await testStoryAccessibility(page, 'components-toast--success', 'Success Toast');
  });

  test('Error toast', async ({ page }) => {
    await testStoryAccessibility(page, 'components-toast--error', 'Error Toast');
  });

  test('Warning toast', async ({ page }) => {
    await testStoryAccessibility(page, 'components-toast--warning', 'Warning Toast');
  });

  test('Info toast', async ({ page }) => {
    await testStoryAccessibility(page, 'components-toast--info', 'Info Toast');
  });
});

test.describe('Logo Component Accessibility', () => {
  test('Colored logo', async ({ page }) => {
    await testStoryAccessibility(page, 'components-logo--colored-medium', 'Colored Logo');
  });

  test('Black & white logo', async ({ page }) => {
    await testStoryAccessibility(page, 'components-logo--black-white-medium', 'Black & White Logo');
  });

  test('Icon logo', async ({ page }) => {
    await testStoryAccessibility(page, 'components-logo--icon-variant', 'Icon Logo');
  });
});
