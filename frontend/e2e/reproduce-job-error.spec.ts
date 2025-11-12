import { test } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

test('Reproduce job creation error', async ({ page, browserName, baseURL }) => {
  const baseUrl = baseURL || 'http://localhost:3000';
  
  const { email, password } = getAndValidateCredentials();

  console.log(`\n=== Test Starting (${browserName}) ===`);

  // Login
  console.log('1. Login...');
  await page.goto(baseUrl);
  await page.waitForSelector('input[type="email"], input[placeholder*="email" i]');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });
  console.log('✓ Logged in');

  // Create quote
  console.log('2. Creating quote...');
  await page.goto(`${baseUrl}/quotes/new`);
  await page.getByLabel(/customer name/i).fill('Test Customer');
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/phone/i).fill('0412345678');
  await page.getByLabel(/address/i).fill('123 Main Street');
  await page.getByRole('button', { name: /save|create/i }).click();
  await page.waitForURL(/\/quotes\/[a-f0-9-]+/);
  const quoteId = page.url().split('/').pop();
  console.log(`✓ Quote created: ${quoteId}`);

  // Monitor network
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log(`→ ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      const status = res.status();
      console.log(`← ${status} ${res.url()}`);
      if (status >= 400) {
        try {
          const body = await res.text();
          console.log(`  Error body: ${body}`);
        } catch {
          // Ignore response read errors
        }
      }
    }
  });

  // Add job
  console.log('3. Adding job...');
  await page.getByRole('button', { name: /add job/i }).click();
  await page.waitForSelector('text=Retaining Wall');
  await page.locator('text=Retaining Wall').click();

  // Fill form
  console.log('4. Filling form...');
  await page.waitForSelector('input', { timeout: 3000 });
  const inputs = await page.locator('input[type="number"], input[type="text"]').all();
  console.log(`Found ${inputs.length} inputs`);

  // Fill first 3 inputs with dummy data
  if (inputs[0]) await inputs[0].fill('2');
  if (inputs[1]) await inputs[1].fill('600mm (3 blocks)');
  if (inputs[2]) await inputs[2].fill('10');

  // Save
  console.log('5. Saving job...');
  await page.getByRole('button', { name: /add job|save/i }).last().click();

  // Wait for result
  console.log('6. Waiting for result...');
  const result = await Promise.race([
    page.locator('text=/failed to save job/i').waitFor({ timeout: 10000 }).then(() => 'error'),
    page.locator('text=/success|added/i').waitFor({ timeout: 10000 }).then(() => 'success'),
  ]).catch(() => 'timeout');

  await page.screenshot({ path: '/tmp/job-test-result.png', fullPage: true });

  if (result === 'error') {
    console.log('✗ ERROR REPRODUCED: Failed to save job');
    throw new Error('Job creation failed - error reproduced successfully');
  } else if (result === 'success') {
    console.log('✓ Job saved successfully');
  } else {
    console.log('⚠ Timeout - no clear result');
    throw new Error('Timeout waiting for result');
  }
});
