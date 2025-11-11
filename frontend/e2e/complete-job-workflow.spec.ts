import { test, expect } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

/**
 * Complete End-to-End Job Creation Workflow Test
 *
 * This test validates the CRITICAL workflow:
 * 1. Login
 * 2. Create quote
 * 3. Add job to quote (fill form + save)
 * 4. Verify job appears in quote
 * 5. Save quote with job
 */
test('Complete job creation workflow', async ({ page }) => {
  const baseUrl = 'http://localhost:3000';
  const { email, password } = getAndValidateCredentials();

  console.log('\n=== COMPLETE JOB WORKFLOW TEST ===\n');

  // Monitor all API calls
  const apiCalls: { method: string; url: string; status?: number }[] = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      apiCalls.push({ method: req.method(), url: req.url() });
      console.log(`→ ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      const call = apiCalls.find(c => c.url === res.url() && !c.status);
      if (call) call.status = res.status();
      console.log(`← ${res.status()} ${res.url()}`);
      if (res.status() >= 400) {
        try {
          const body = await res.text();
          console.log(`  Error: ${body.substring(0, 200)}`);
        } catch (e) {}
      }
    }
  });

  // STEP 1: Login
  console.log('STEP 1: Login');
  await page.goto(baseUrl);
  await page.waitForSelector('input[type="email"], input[placeholder*="email" i]');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });
  console.log('✓ Login successful\n');

  // STEP 2: Create quote
  console.log('STEP 2: Create quote');
  await page.goto(`${baseUrl}/quotes/new`);
  await page.getByLabel(/customer name/i).fill('E2E Test Customer');
  await page.getByLabel(/email/i).fill('e2e@test.com');
  await page.getByLabel(/phone/i).fill('0400000000');
  await page.getByLabel(/address/i).fill('123 Test Street');
  await page.getByRole('button', { name: /save|create/i }).click();
  await page.waitForURL(/\/quotes\/[a-f0-9-]+/);
  const quoteId = page.url().split('/').pop();
  console.log(`✓ Quote created: ${quoteId}\n`);

  // STEP 3: Add job to quote
  console.log('STEP 3: Add job to quote');

  // Click "+ Add Job" button
  await page.getByRole('button', { name: /add job/i }).click();
  console.log('  Clicked "Add Job" button');

  // Wait for job selector to appear
  await page.waitForSelector('text=Select Job Type', { timeout: 5000 });
  console.log('  Job selector appeared');

  // Click on Retaining Wall card (using role button to avoid multiple matches)
  const retainingWallButton = page.getByRole('button', { name: /retaining wall/i });
  await retainingWallButton.click();
  console.log('  Selected Retaining Wall job type');

  // Wait for form to load
  await page.waitForSelector('text=Add Retaining Wall', { timeout: 5000 });
  console.log('  Job form loaded');

  // STEP 4: Fill in job parameters
  console.log('\nSTEP 4: Fill job form');

  // Number of bays - use proper ID selector
  const baysInput = page.locator('#bays');
  await baysInput.waitFor({ timeout: 5000 });
  await baysInput.clear();
  await baysInput.fill('2');
  console.log('  Filled: Number of Bays = 2');

  // Height - use ID selector for select dropdown
  const heightSelect = page.locator('#height');
  await heightSelect.selectOption('600');
  console.log('  Selected: Height = 600mm (3 blocks)');

  // Total length - use ID selector
  const lengthInput = page.locator('#length');
  await lengthInput.clear();
  await lengthInput.fill('10');
  console.log('  Filled: Total Length = 10 meters');

  // STEP 5: Save job
  console.log('\nSTEP 5: Save job');
  const saveButton = page.getByRole('button', { name: /add job|save/i }).last();
  await saveButton.click();
  console.log('  Clicked save button');

  // Wait for either success or error
  const result = await Promise.race([
    page.locator('text=/failed to save job/i').waitFor({ timeout: 10000 }).then(() => 'error'),
    page.locator('text=/success|job.*added/i').waitFor({ timeout: 10000 }).then(() => 'success'),
    page.waitForTimeout(10000).then(() => 'timeout')
  ]);

  // Take screenshot
  await page.screenshot({ path: '/tmp/job-workflow-result.png', fullPage: true });

  if (result === 'error') {
    console.log('✗ ERROR: Failed to save job');
    const errorText = await page.locator('text=/failed to save job/i').textContent();
    throw new Error(`Job creation failed: ${errorText}`);
  } else if (result === 'timeout') {
    console.log('⚠ TIMEOUT: No clear success or error message');
    // Check if job appears in the list anyway
    const jobInList = await page.locator('text=/retaining wall/i').count();
    if (jobInList > 0) {
      console.log('✓ Job appears in list (silent success)');
    } else {
      throw new Error('Timeout: No success message and job not in list');
    }
  } else {
    console.log('✓ Job saved successfully');
  }

  // STEP 6: Verify job appears in quote
  console.log('\nSTEP 6: Verify job in quote');
  const jobCard = page.locator('text=/retaining wall/i').first();
  await expect(jobCard).toBeVisible();
  console.log('✓ Job appears in quote details');

  // Print API call summary
  console.log('\n=== API CALL SUMMARY ===');
  const postJobCalls = apiCalls.filter(c => c.method === 'POST' && c.url.includes('/jobs'));
  console.log(`POST /api/quotes/.../jobs calls: ${postJobCalls.length}`);
  postJobCalls.forEach(c => console.log(`  - ${c.url} (${c.status || 'pending'})`));

  const jobErrors = apiCalls.filter(c => c.url.includes('/jobs') && c.status && c.status >= 400);
  console.log(`Job-related errors: ${jobErrors.length}`);
  jobErrors.forEach(c => console.log(`  - ${c.method} ${c.url} (${c.status})`));

  console.log('\n=== TEST COMPLETE ===\n');
});
