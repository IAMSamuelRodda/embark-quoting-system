import { test, expect } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

test.describe('Job Creation Test', () => {
  test('should create a quote and add a retaining wall job', async ({ page, baseURL }) => {
    
    const { email, password } = getAndValidateCredentials();

    // Step 1: Login
    console.log('Step 1: Navigating to login page...');
    await page.goto(baseURL || '/');
    await page.waitForLoadState('networkidle');

    // Wait for login form
    console.log('Step 2: Waiting for login form...');
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 10000 });

    // Fill in credentials
    console.log('Step 3: Filling in login credentials...');
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);

    // Click sign in
    console.log('Step 4: Clicking sign in button...');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to dashboard/quotes
    console.log('Step 5: Waiting for authentication...');
    await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });
    console.log('✓ Logged in successfully');

    // Step 2: Create a new quote
    console.log('Step 6: Creating new quote...');
    await page.goto((baseURL || '') + '/quotes/new');
    await page.waitForLoadState('networkidle');

    // Fill in quote details
    console.log('Step 7: Filling in quote details...');
    await page.getByLabel(/customer name/i).fill('Test Customer');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/phone/i).fill('0412345678');
    await page.getByLabel(/address/i).fill('123 Main Street');

    // Save quote
    console.log('Step 8: Saving quote...');
    await page.getByRole('button', { name: /save|create/i }).click();

    // Wait for redirect to quote detail page
    console.log('Step 9: Waiting for quote to be created...');
    await page.waitForURL(/\/quotes\/[a-f0-9-]+/, { timeout: 10000 });
    const quoteUrl = page.url();
    const quoteId = quoteUrl.split('/').pop();
    console.log(`✓ Quote created with ID: ${quoteId}`);

    // Step 3: Add a retaining wall job
    console.log('Step 10: Adding retaining wall job...');

    // The page should already show "Select Job Type" section
    console.log('Step 11: Selecting retaining wall job type...');
    await page.waitForSelector('text=Retaining Wall', { timeout: 5000 });

    // Click on the Retaining Wall card
    await page.locator('text=Retaining Wall').locator('..').click();

    // Fill in retaining wall parameters
    console.log('Step 12: Filling in job parameters...');
    await page.waitForSelector('input[name="numberOfBays"], input[id*="bay" i]', { timeout: 5000 });

    // Number of bays
    const baysInput = page.locator('input').filter({ hasText: /bay/i }).or(page.locator('input[name*="bay" i]')).first();
    await baysInput.fill('2');

    // Height
    const heightInput = page.locator('input').filter({ hasText: /height/i }).or(page.locator('input[name*="height" i]')).first();
    await heightInput.fill('600mm (3 blocks)');

    // Total length
    const lengthInput = page.locator('input').filter({ hasText: /length/i }).or(page.locator('input[name*="length" i]')).first();
    await lengthInput.fill('10');

    // Listen for network requests and responses
    console.log('Step 13: Monitoring network requests...');
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('→ REQUEST:', request.method(), request.url());
        console.log('  Headers:', request.headers());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('← RESPONSE:', response.status(), response.url());
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });

    // Click save/add button
    console.log('Step 14: Clicking save job button...');
    const saveButton = page.getByRole('button', { name: /add job|save/i }).last();
    await saveButton.click();

    // Wait for either success or error
    console.log('Step 15: Waiting for result...');

    // Check for error dialog
    const errorDialog = page.locator('text=/failed to save job/i');
    const successIndicator = page.locator('text=/job.*added/i, text=/success/i');

    const result = await Promise.race([
      errorDialog.waitFor({ timeout: 5000 }).then(() => 'error'),
      successIndicator.waitFor({ timeout: 5000 }).then(() => 'success'),
      page.waitForTimeout(5000).then(() => 'timeout')
    ]);

    if (result === 'error') {
      console.log('✗ ERROR: Failed to save job');
      const errorText = await errorDialog.textContent();
      console.log('  Error message:', errorText);

      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/job-creation-error.png', fullPage: true });
      console.log('  Screenshot saved: /tmp/job-creation-error.png');

      throw new Error('Job creation failed: ' + errorText);
    } else if (result === 'success') {
      console.log('✓ Job added successfully');
    } else {
      console.log('⚠ Timeout waiting for result');
      await page.screenshot({ path: '/tmp/job-creation-timeout.png', fullPage: true });
      throw new Error('Timeout waiting for job creation result');
    }

    // Verify job appears in the list
    await expect(page.getByText(/retaining wall/i)).toBeVisible();
    console.log('✓ Test completed successfully');
  });
});
