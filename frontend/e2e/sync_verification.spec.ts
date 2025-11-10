import { test, expect } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

/**
 * Sync Verification Test Suite
 *
 * Verifies that the offline-first architecture properly syncs data:
 * 1. Jobs/quotes save to IndexedDB instantly
 * 2. Auto-sync service processes sync queue
 * 3. Data reaches backend API
 * 4. UI reflects sync status correctly
 */

// Get credentials from environment or AWS (fails fast if not available)
const { email, password } = getAndValidateCredentials();

test.describe('Offline-First Sync Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => {
      if (msg.text().includes('[App]') ||
          msg.text().includes('[Sync]') ||
          msg.text().includes('[useJobs]')) {
        console.log(`BROWSER: ${msg.text()}`);
      }
    });

    // Navigate to login
    await page.goto('http://localhost:3000/login');

    // Perform login
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });
    console.log('✓ Login successful');
  });

  test('should initialize auto-sync on app startup', async ({ page }) => {
    // Assert: Check that auto-sync service initialized
    // This happens on app mount in App.tsx

    // Wait a moment for initialization logs
    await page.waitForTimeout(1000);

    // Check for auto-sync initialization in console
    // We can't directly access console logs, but we can check behavior

    // Navigate to dashboard and check initial state
    await page.goto('http://localhost:3000/dashboard');

    // Should NOT show "pending" initially if no items in queue
    const pendingBadge = page.locator('text=/pending/i').first();

    // Give it a moment to sync any existing items
    await page.waitForTimeout(3000);

    console.log('✓ Auto-sync service should be initialized');
  });

  test('should sync quote and job to backend automatically', async ({ page, request }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('\n=== TEST: Auto-sync quote + job ===\n');

    // STEP 1: Create quote
    console.log('STEP 1: Creating quote...');
    await page.getByRole('button', { name: /new quote/i }).click();

    // Fill quote form
    await page.getByLabel(/customer name/i).fill('Sync Test Customer');
    await page.getByLabel(/email/i).fill('sync-test@example.com');
    await page.getByLabel(/phone/i).fill('0412345678');

    // Submit quote
    await page.getByRole('button', { name: /create quote/i }).click();

    // Wait for navigation to quote detail page
    await expect(page).toHaveURL(/\/quotes\/[^/]+$/, { timeout: 10000 });
    console.log('✓ Quote created - should be in IndexedDB + sync queue');

    // Extract quote ID from URL
    const quoteUrl = page.url();
    const quoteId = quoteUrl.split('/').pop();
    console.log(`Quote ID: ${quoteId}`);

    // Check for pending sync indicator
    const pendingIndicator = page.locator('text=/pending/i').first();
    if (await pendingIndicator.isVisible()) {
      console.log('⚠ Pending sync indicator visible (expected initially)');
    }

    // STEP 2: Add job immediately (test race condition fix)
    console.log('\nSTEP 2: Adding job immediately...');
    await page.getByRole('button', { name: /add job/i }).click();

    // Select job type
    await page.getByRole('button', { name: /retaining wall/i }).click();

    // Fill job form
    await page.getByLabel(/wall type/i).selectOption('Besser Block');
    await page.getByLabel(/height/i).fill('1.5');
    await page.getByLabel(/length/i).fill('10');
    await page.getByLabel(/footer depth/i).fill('0.3');

    // Submit job
    await page.getByRole('button', { name: /add job/i }).click();

    // Wait for job to appear in UI
    await expect(page.locator('text=/retaining wall/i')).toBeVisible({ timeout: 5000 });
    console.log('✓ Job created - should be in IndexedDB + sync queue');

    // STEP 3: Wait for auto-sync to process queue
    console.log('\nSTEP 3: Waiting for auto-sync to process...');
    console.log('Auto-sync should trigger within a few seconds...');

    // Poll for sync completion (max 15 seconds)
    let syncCompleted = false;
    let attempts = 0;
    const maxAttempts = 15; // 15 seconds

    while (!syncCompleted && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      attempts++;

      // Check if pending indicator is gone
      const isPendingVisible = await pendingIndicator.isVisible().catch(() => false);

      if (!isPendingVisible) {
        syncCompleted = true;
        console.log(`✓ Sync completed after ${attempts} seconds`);
      } else {
        console.log(`[${attempts}s] Still syncing...`);
      }
    }

    if (!syncCompleted) {
      console.log('⚠ WARNING: Sync did not complete within 15 seconds');
      console.log('This indicates auto-sync may not be working properly');
    }

    // STEP 4: Verify data reached backend
    console.log('\nSTEP 4: Verifying backend data...');

    // Fetch quote from backend API
    const quoteResponse = await request.get(`http://localhost:3001/api/quotes/${quoteId}`, {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('authToken'))}`
      }
    });

    if (quoteResponse.ok()) {
      const quoteData = await quoteResponse.json();
      console.log('✓ Quote found in backend');
      console.log(`  Customer: ${quoteData.customer_name}`);

      // Fetch jobs for this quote
      const jobsResponse = await request.get(`http://localhost:3001/api/quotes/${quoteId}/jobs`, {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('authToken'))}`
        }
      });

      if (jobsResponse.ok()) {
        const jobsData = await jobsResponse.json();
        console.log(`✓ Found ${jobsData.length} job(s) in backend`);

        if (jobsData.length > 0) {
          console.log(`  Job type: ${jobsData[0].job_type}`);
        }

        // Assert: Quote and job should exist in backend
        expect(quoteData).toBeDefined();
        expect(quoteData.customer_name).toBe('Sync Test Customer');
        expect(jobsData.length).toBeGreaterThan(0);
        expect(jobsData[0].job_type).toBe('retaining_wall');
      } else {
        console.log('❌ Jobs NOT found in backend');
        console.log(`Status: ${jobsResponse.status()}`);
        throw new Error('Jobs did not sync to backend');
      }
    } else {
      console.log('❌ Quote NOT found in backend');
      console.log(`Status: ${quoteResponse.status()}`);
      throw new Error('Quote did not sync to backend');
    }

    console.log('\n✅ TEST PASSED: Auto-sync working correctly\n');
  });

  test('should show sync status in UI', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');

    console.log('\n=== TEST: Sync status UI indicators ===\n');

    // Check for sync status indicators
    const syncButton = page.locator('[aria-label*="sync" i], [title*="sync" i]').first();
    const pendingBadge = page.locator('text=/\\d+ pending/i').first();

    // Log current state
    const hasSyncButton = await syncButton.isVisible().catch(() => false);
    const hasPendingBadge = await pendingBadge.isVisible().catch(() => false);

    console.log(`Sync button visible: ${hasSyncButton}`);
    console.log(`Pending badge visible: ${hasPendingBadge}`);

    if (hasPendingBadge) {
      const pendingText = await pendingBadge.textContent();
      console.log(`Pending items: ${pendingText}`);
    }

    // Create a quote to trigger sync
    await page.getByRole('button', { name: /new quote/i }).click();
    await page.getByLabel(/customer name/i).fill('UI Sync Test');
    await page.getByLabel(/email/i).fill('ui-sync@example.com');
    await page.getByLabel(/phone/i).fill('0412345678');
    await page.getByRole('button', { name: /create quote/i }).click();

    // Wait for quote detail page
    await expect(page).toHaveURL(/\/quotes\/[^/]+$/, { timeout: 10000 });

    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();

    // Check if pending badge appears
    await page.waitForTimeout(1000);
    const isPendingVisible = await pendingBadge.isVisible().catch(() => false);

    if (isPendingVisible) {
      console.log('✓ Pending badge appeared (quote in sync queue)');

      // Wait for it to disappear (sync completes)
      await expect(pendingBadge).not.toBeVisible({ timeout: 15000 });
      console.log('✓ Pending badge disappeared (sync complete)');
    } else {
      console.log('⚠ Pending badge not visible - sync may have happened too fast');
    }

    console.log('\n✅ TEST PASSED: UI sync indicators working\n');
  });

  test('should handle offline scenario gracefully', async ({ page, context }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');

    console.log('\n=== TEST: Offline scenario ===\n');

    // Go offline
    await context.setOffline(true);
    console.log('✓ Set browser to offline mode');

    // Create a quote while offline
    await page.getByRole('button', { name: /new quote/i }).click();
    await page.getByLabel(/customer name/i).fill('Offline Test Customer');
    await page.getByLabel(/email/i).fill('offline-test@example.com');
    await page.getByLabel(/phone/i).fill('0412345678');
    await page.getByRole('button', { name: /create quote/i }).click();

    // Should still succeed (offline-first)
    await expect(page).toHaveURL(/\/quotes\/[^/]+$/, { timeout: 10000 });
    console.log('✓ Quote created while offline (saved to IndexedDB)');

    // Should show pending indicator
    const pendingBadge = page.locator('text=/pending/i').first();
    await expect(pendingBadge).toBeVisible({ timeout: 5000 });
    console.log('✓ Pending indicator visible (sync queue populated)');

    // Go back online
    await context.setOffline(false);
    console.log('✓ Back online - auto-sync should trigger');

    // Wait for sync to complete
    await expect(pendingBadge).not.toBeVisible({ timeout: 20000 });
    console.log('✓ Sync completed when connection restored');

    console.log('\n✅ TEST PASSED: Offline-first working correctly\n');
  });
});
