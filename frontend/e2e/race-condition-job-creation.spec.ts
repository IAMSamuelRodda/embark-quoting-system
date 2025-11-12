import { test, expect } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

/**
 * Race Condition Test: Job Creation Immediately After Quote Creation
 *
 * This test reproduces the bug where users cannot add jobs to quotes when
 * they act quickly after creating a quote.
 *
 * ROOT CAUSE:
 * - Quotes are offline-first (saved to IndexedDB with sync_status: PENDING)
 * - Jobs are backend-dependent (require quote to exist in PostgreSQL)
 * - When users create a quote and immediately add a job, the job creation
 *   attempts to verify the quote exists in the backend, but the quote sync
 *   hasn't completed yet, causing "Quote not found" errors.
 *
 * This test uses network throttling to exacerbate the race condition and
 * make it reliably reproducible.
 */

test.describe('Job Creation Race Condition Bug', () => {
  test('should reproduce race condition with slow network', async ({ page, context, baseURL }) => {
    // Simulate slow network to make race condition more likely
    // Add 2-second delay to all quote API calls to simulate slow sync
    await context.route('**/api/quotes**', async (route) => {
      const method = route.request().method();
      console.log(`[Network Intercept] ${method} ${route.request().url()}`);

      if (method === 'POST' || method === 'PUT') {
        console.log('[Network Intercept] Delaying quote sync by 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      await route.continue();
    });

    
    const { email, password } = getAndValidateCredentials();

    console.log('\n=== RACE CONDITION TEST ===\n');

    // Step 1: Login
    console.log('Step 1: Login');
    await page.goto(baseURL || '/');
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]');
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });
    console.log('✓ Logged in successfully\n');

    // Step 2: Create quote (saved to IndexedDB, sync queued)
    console.log('Step 2: Create quote');
    await page.goto((baseURL || '') + '/quotes/new');
    await page.getByLabel(/customer name/i).fill('Race Condition Test Customer');
    await page.getByLabel(/email/i).fill('race-test@example.com');
    await page.getByLabel(/phone/i).fill('0400000000');
    await page.getByLabel(/address/i).fill('123 Race Condition Street');

    console.log('  Saving quote...');
    await page.getByRole('button', { name: /save|create/i }).click();
    await page.waitForURL(/\/quotes\/[a-f0-9-]+/);
    const quoteId = page.url().split('/').pop();
    console.log(`✓ Quote created: ${quoteId}`);
    console.log('  NOTE: Quote is in IndexedDB with sync_status: PENDING\n');

    // Step 3: IMMEDIATELY try to add job (trigger race condition)
    console.log('Step 3: Add job IMMEDIATELY (race condition)');
    console.log('  Expected: Job creation should fail because quote sync is in progress');

    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  Browser Error: ${msg.text()}`);
        consoleErrors.push(msg.text());
      }
    });

    // Monitor API calls
    page.on('response', async (response) => {
      if (response.url().includes('/api/jobs') && response.status() >= 400) {
        console.log(`  API Error: ${response.status()} ${response.url()}`);
        try {
          const body = await response.text();
          console.log(`  Response Body: ${body.substring(0, 200)}`);
        } catch {
          // Ignore response read errors
        }
      }
    });

    console.log('  Clicking "Add Job"...');
    await page.getByRole('button', { name: /add job/i }).click();

    console.log('  Selecting Retaining Wall job type...');
    await page.waitForSelector('text=Retaining Wall', { timeout: 5000 });
    await page.locator('text=Retaining Wall').click();

    console.log('  Filling form (minimal data)...');
    await page.waitForSelector('input[type="number"]', { timeout: 3000 });
    const baysInput = await page.locator('#bays').first();
    await baysInput.fill('2');

    console.log('  Saving job...');
    await page.getByRole('button', { name: /add job|save/i }).last().click();

    // Step 4: Wait for either success or error
    console.log('\nStep 4: Waiting for result...');

    const result = await Promise.race([
      page.locator('text=/quote.*not.*found|quote.*does.*not.*exist|failed.*to.*save/i')
        .waitFor({ timeout: 10000 })
        .then(() => 'error'),
      page.locator('text=/success|job.*added/i')
        .waitFor({ timeout: 10000 })
        .then(() => 'success'),
      page.waitForTimeout(10000).then(() => 'timeout')
    ]);

    // Take screenshot for debugging
    await page.screenshot({
      path: '/tmp/race-condition-test-result.png',
      fullPage: true
    });

    // Step 5: Assert the bug is reproduced
    console.log('\n=== TEST RESULT ===');

    if (result === 'error') {
      const errorText = await page.locator('text=/quote.*not.*found|quote.*does.*not.*exist|failed.*to.*save/i').textContent();
      console.log('✓ BUG REPRODUCED: Job creation failed');
      console.log(`  Error message: ${errorText}`);
      console.log(`  Console errors: ${consoleErrors.length > 0 ? consoleErrors.join(', ') : 'none'}`);
      console.log('\nExpected error patterns:');
      console.log('  - "Quote does not exist in backend"');
      console.log('  - "Quote not found"');
      console.log('  - "Failed to save job"');

      // This is the expected behavior (bug reproduced)
      expect(errorText).toBeTruthy();
      expect(errorText?.toLowerCase()).toMatch(/quote|failed/);

      console.log('\n✓ Race condition successfully reproduced');
    } else if (result === 'success') {
      console.log('✗ UNEXPECTED: Job creation succeeded');
      console.log('  This means either:');
      console.log('  1. The network delay wasn\'t long enough to trigger race condition');
      console.log('  2. The bug has been fixed');
      console.log('  3. There\'s retry logic that eventually succeeded');

      throw new Error('Expected job creation to fail due to race condition, but it succeeded');
    } else {
      console.log('⚠ TIMEOUT: No clear success or error message');
      console.log('  Taking screenshot for debugging...');
      throw new Error('Timeout waiting for job creation result');
    }

    console.log('\n=== ANALYSIS ===');
    console.log('Root Cause: Architectural mismatch');
    console.log('  - Quotes: Offline-first (IndexedDB → Sync Queue → Backend)');
    console.log('  - Jobs: Backend-dependent (require backend quote to exist first)');
    console.log('');
    console.log('Timeline of Failure:');
    console.log('  1. User creates quote → Saved to IndexedDB (sync_status: PENDING)');
    console.log('  2. Sync queued but not completed (2-second network delay)');
    console.log('  3. User clicks "Add Job" immediately');
    console.log('  4. Job creation calls pushChanges() to sync quote');
    console.log('  5. Job creation verifies quote exists in backend → FAILS');
    console.log('  6. Error: "Quote does not exist in backend"');
    console.log('');
    console.log('Recommended Fix: Make jobs offline-first too');
    console.log('  See: frontend/src/features/jobs/jobsDb.ts (to be created)');
    console.log('=================\n');
  });

  test('should work after implementing offline-first jobs (verification test)', async ({ page, baseURL }) => {
    /**
     * This test will PASS after implementing the fix (Option A: Make Jobs Offline-First)
     *
     * Expected behavior after fix:
     * 1. Quote created → IndexedDB (sync_status: PENDING)
     * 2. Job added → IndexedDB (sync_status: PENDING)
     * 3. Both sync to backend asynchronously
     * 4. User sees immediate feedback, no errors
     */

    
    const { email, password } = getAndValidateCredentials();

    console.log('\n=== VERIFICATION TEST (After Fix) ===\n');

    // Login
    console.log('Step 1: Login');
    await page.goto(baseURL || '/');
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]');
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });
    console.log('✓ Logged in\n');

    // Create quote
    console.log('Step 2: Create quote');
    await page.goto((baseURL || '') + '/quotes/new');
    await page.getByLabel(/customer name/i).fill('Verification Test Customer');
    await page.getByLabel(/email/i).fill('verify@example.com');
    await page.getByLabel(/phone/i).fill('0400111111');
    await page.getByLabel(/address/i).fill('123 Verify Street');
    await page.getByRole('button', { name: /save|create/i }).click();
    await page.waitForURL(/\/quotes\/[a-f0-9-]+/);
    console.log('✓ Quote created\n');

    // IMMEDIATELY add job (should work with offline-first implementation)
    console.log('Step 3: Add job immediately (should succeed with fix)');
    await page.getByRole('button', { name: /add job/i }).click();
    await page.waitForSelector('text=Retaining Wall', { timeout: 5000 });
    await page.locator('text=Retaining Wall').click();

    const baysInput = await page.locator('#bays').first();
    await baysInput.fill('3');

    const saveButton = await page.getByRole('button', { name: /add job|save/i }).last();
    await saveButton.click();

    // Should succeed immediately (job saved to IndexedDB)
    console.log('  Waiting for job to appear in list...');
    await expect(page.locator('text=/retaining wall/i')).toBeVisible({ timeout: 3000 });

    console.log('✓ Job added successfully');
    console.log('  Job is in IndexedDB with sync_status: PENDING');
    console.log('  Sync will happen asynchronously');
    console.log('\n=== VERIFICATION PASSED ===');
    console.log('Offline-first job creation is working correctly!\n');
  });
});
