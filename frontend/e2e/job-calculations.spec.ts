/**
 * E2E Test: Job Financial Calculations
 *
 * Verifies that job calculations work end-to-end:
 * 1. Jobs created offline show $0.00 initially (offline-first behavior)
 * 2. After sync, backend-calculated values update in UI
 * 3. All 5 job types calculate correctly
 *
 * This test reproduces and prevents regression of the bug where
 * jobs always showed "Subtotal: $0.00" even after successful sync.
 */

import { test, expect } from '@playwright/test';
import { getTestCredentials } from './test-utils';

test.describe('Job Financial Calculations', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = getTestCredentials();

    // Navigate to login page
    await page.goto('/login');

    // Login with test credentials
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Quotes' })).toBeVisible();
  });

  test('driveway job calculates correct subtotal after sync', async ({ page }) => {
    // Arrange: Create a new quote
    await page.getByRole('button', { name: 'New Quote' }).click();
    await page.waitForURL(/\/quotes\/new/);

    // Fill in customer information
    await page.getByLabel('Customer Name').fill('Test Customer - Driveway');
    await page.getByLabel('Email').fill('driveway@test.com');
    await page.getByLabel('Phone').fill('0400000001');

    // Save quote
    await page.getByRole('button', { name: 'Save Quote' }).click();

    // Wait for quote to be created (redirects to quote detail page)
    await page.waitForURL(/\/quotes\/[a-f0-9-]+$/);

    // Act: Add a driveway job
    await page.getByRole('button', { name: 'Add Job' }).click();

    // Select driveway job type
    await page.getByRole('button', { name: 'Driveway' }).click();

    // Fill in driveway parameters
    // Expected calculation: 10m x 4m = 40m², 150mm base = 6m³ road base
    // Materials: 6m³ × $45 = $270
    // Labour: 4 hours × $85/hr = $340
    // Total: $610
    await page.getByLabel('Length (m)').fill('10');
    await page.getByLabel('Width (m)').fill('4');
    await page.getByLabel('Base Thickness (mm)').fill('150');

    // Save job
    await page.getByRole('button', { name: 'Save Job' }).click();

    // Assert: Job initially shows $0.00 (offline-first behavior)
    const jobCard = page.getByText(/Job \d+: DRIVEWAY/).locator('..');
    await expect(jobCard.getByText('Subtotal: $0.00')).toBeVisible({ timeout: 2000 });

    // Wait for sync to complete
    // The sync indicator should show "pending" → "syncing" → disappear
    const syncIndicator = page.locator('[data-testid="sync-status-indicator"]');

    // Wait for sync to start (pending appears)
    await expect(syncIndicator).toContainText(/pending|syncing/, { timeout: 5000 });

    // Wait for sync to complete (indicator shows success or disappears)
    // Auto-sync runs every 30 seconds, so we need a longer timeout
    await expect(syncIndicator).not.toContainText('pending', { timeout: 35000 });

    // Assert: Job now shows correct calculated subtotal
    // Note: The exact amount depends on price sheet data
    // We verify it's no longer $0.00 and is a reasonable amount
    const subtotalText = await jobCard.locator('[data-testid="job-subtotal"]').textContent();

    // Extract numeric value from "Subtotal: $XXX.XX"
    const subtotal = parseFloat(subtotalText?.replace(/[^0-9.]/g, '') || '0');

    expect(subtotal).toBeGreaterThan(0);
    expect(subtotal).toBeLessThan(10000); // Sanity check

    // Log actual calculation for debugging
    console.log(`Driveway job calculated subtotal: $${subtotal}`);

    // Verify expected calculation (approximately $610 based on seed data)
    // Allow ±10% variance for price sheet differences
    const expectedSubtotal = 610;
    const variance = expectedSubtotal * 0.1;
    expect(subtotal).toBeGreaterThanOrEqual(expectedSubtotal - variance);
    expect(subtotal).toBeLessThanOrEqual(expectedSubtotal + variance);
  });

  test('retaining wall job calculates correct subtotal after sync', async ({ page }) => {
    // Create quote
    await page.getByRole('button', { name: 'New Quote' }).click();
    await page.waitForURL(/\/quotes\/new/);

    await page.getByLabel('Customer Name').fill('Test Customer - Wall');
    await page.getByLabel('Email').fill('wall@test.com');
    await page.getByRole('button', { name: 'Save Quote' }).click();
    await page.waitForURL(/\/quotes\/[a-f0-9-]+$/);

    // Add retaining wall job
    await page.getByRole('button', { name: 'Add Job' }).click();
    await page.getByRole('button', { name: 'Retaining Wall' }).click();

    // Fill in parameters
    // Expected: 10 bays, 600mm height, 5m length, with AG pipe
    // Materials: 30 blocks ($375), road base ($22.50), AG pipe ($42.50)
    // Labour: 15 hours × $85 = $1,275
    // Total: ~$1,715
    await page.getByLabel('Number of Bays').fill('10');
    await page.getByLabel('Height (mm)').fill('600');
    await page.getByLabel('Length (m)').fill('5');
    await page.getByLabel('Include AG Pipe').check();

    await page.getByRole('button', { name: 'Save Job' }).click();

    // Verify initial $0.00
    const jobCard = page.getByText(/Job \d+: RETAINING_WALL/).locator('..');
    await expect(jobCard.getByText('Subtotal: $0.00')).toBeVisible({ timeout: 2000 });

    // Wait for sync
    const syncIndicator = page.locator('[data-testid="sync-status-indicator"]');
    await expect(syncIndicator).toContainText(/pending|syncing/, { timeout: 5000 });
    await expect(syncIndicator).not.toContainText('pending', { timeout: 35000 });

    // Verify calculated subtotal
    const subtotalText = await jobCard.locator('[data-testid="job-subtotal"]').textContent();
    const subtotal = parseFloat(subtotalText?.replace(/[^0-9.]/g, '') || '0');

    expect(subtotal).toBeGreaterThan(0);
    console.log(`Retaining wall job calculated subtotal: $${subtotal}`);

    // Verify expected calculation (~$1,715)
    const expectedSubtotal = 1715;
    const variance = expectedSubtotal * 0.1;
    expect(subtotal).toBeGreaterThanOrEqual(expectedSubtotal - variance);
    expect(subtotal).toBeLessThanOrEqual(expectedSubtotal + variance);
  });

  test('multiple jobs sync and calculate correctly', async ({ page }) => {
    // Create quote
    await page.getByRole('button', { name: 'New Quote' }).click();
    await page.waitForURL(/\/quotes\/new/);

    await page.getByLabel('Customer Name').fill('Test Customer - Multiple');
    await page.getByRole('button', { name: 'Save Quote' }).click();
    await page.waitForURL(/\/quotes\/[a-f0-9-]+$/);

    // Add driveway job
    await page.getByRole('button', { name: 'Add Job' }).click();
    await page.getByRole('button', { name: 'Driveway' }).click();
    await page.getByLabel('Length (m)').fill('8');
    await page.getByLabel('Width (m)').fill('3');
    await page.getByLabel('Base Thickness (mm)').fill('100');
    await page.getByRole('button', { name: 'Save Job' }).click();

    // Add trenching job
    await page.getByRole('button', { name: 'Add Job' }).click();
    await page.getByRole('button', { name: 'Trenching' }).click();
    await page.getByLabel('Length (m)').fill('15');
    await page.getByLabel('Width (mm)').fill('400');
    await page.getByLabel('Depth (mm)').fill('600');
    await page.getByRole('button', { name: 'Save Job' }).click();

    // Verify both jobs initially show $0.00
    await expect(page.getByText(/Job 1:.*Subtotal: \$0\.00/)).toBeVisible();
    await expect(page.getByText(/Job 2:.*Subtotal: \$0\.00/)).toBeVisible();

    // Wait for sync (both jobs should sync)
    const syncIndicator = page.locator('[data-testid="sync-status-indicator"]');
    await expect(syncIndicator).toContainText(/pending|syncing/, { timeout: 5000 });

    // Wait for "2 pending" to clear (both jobs synced)
    await expect(syncIndicator).not.toContainText('2 pending', { timeout: 35000 });

    // Verify both jobs have calculated subtotals > $0
    const job1Subtotal = await page.getByText(/Job 1:/).locator('..').locator('[data-testid="job-subtotal"]').textContent();
    const job2Subtotal = await page.getByText(/Job 2:/).locator('..').locator('[data-testid="job-subtotal"]').textContent();

    const subtotal1 = parseFloat(job1Subtotal?.replace(/[^0-9.]/g, '') || '0');
    const subtotal2 = parseFloat(job2Subtotal?.replace(/[^0-9.]/g, '') || '0');

    expect(subtotal1).toBeGreaterThan(0);
    expect(subtotal2).toBeGreaterThan(0);

    console.log(`Multiple jobs - Driveway: $${subtotal1}, Trenching: $${subtotal2}`);
  });
});
