/**
 * Minimal test to debug job sync issue
 * This test captures ALL console output to see what's happening
 */

import { test, expect } from '@playwright/test';
import { getTestCredentials } from './test-utils';

test('minimal job sync test', async ({ page }) => {
  // Capture ALL browser console logs
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`[BROWSER] ${text}`);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  const { email, password } = getTestCredentials();

  // Login
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');

  // Create quote
  await page.getByRole('button', { name: 'New Quote' }).click();
  await page.waitForURL(/\/quotes\/new/);
  await page.getByLabel('Customer Name').fill('Test Customer');
  await page.getByLabel('Email').fill('test@test.com');
  await page.getByRole('button', { name: 'Create Quote' }).click();
  await page.waitForURL(/\/quotes\/[a-f0-9-]+$/);

  console.log('\n=== CREATING JOB ===\n');

  // Add driveway job
  await page.getByRole('button', { name: 'Add Job' }).click();
  await page.getByRole('button', { name: 'Driveway' }).click();
  await page.getByLabel('Length (meters)').fill('10');
  await page.getByLabel('Width (meters)').fill('4');
  await page.getByLabel('Base Thickness (mm)').fill('150');

  console.log('\n=== SUBMITTING JOB FORM ===\n');
  await page.locator('form').getByRole('button', { name: 'Add Job' }).click();

  // Wait a bit to see console output
  await page.waitForTimeout(15000);

  console.log('\n=== FINAL CONSOLE MESSAGES ===');
  console.log(consoleMessages.filter(m => m.includes('[jobsDb]') || m.includes('[Sync]') || m.includes('Error')).join('\n'));
});
