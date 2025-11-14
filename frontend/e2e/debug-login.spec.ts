import { test } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

test('Debug login password fill', async ({ page, baseURL }) => {
  const { email, password } = getAndValidateCredentials();

  console.log('\n=== DEBUG LOGIN TEST ===');
  console.log('Password length:', password.length);
  console.log('Password value:', password ? '[REDACTED]' : 'EMPTY');

  await page.goto(baseURL || '/');
  
  // Fill email
  const emailInput = page.locator('input#email');
  await emailInput.waitFor({ timeout: 5000 });
  await emailInput.fill(email);
  console.log('Email filled');

  // Try to fill password multiple ways
  console.log('\nAttempt 1: getByPlaceholder');
  const passwordInput1 = page.getByPlaceholder(/password/i);
  await passwordInput1.fill(password);
  const value1 = await passwordInput1.inputValue();
  console.log('Password input value after fill:', value1.length > 0 ? `${value1.length} chars` : 'EMPTY');

  await page.screenshot({ path: '/tmp/debug-login-1.png', fullPage: true });

  // Clear and try again with ID selector
  console.log('\nAttempt 2: locator#password');
  const passwordInput2 = page.locator('input#password');
  await passwordInput2.clear();
  await passwordInput2.fill(password);
  const value2 = await passwordInput2.inputValue();
  console.log('Password input value after fill:', value2.length > 0 ? `${value2.length} chars` : 'EMPTY');

  await page.screenshot({ path: '/tmp/debug-login-2.png', fullPage: true });

  // Try typing instead of filling
  console.log('\nAttempt 3: type instead of fill');
  const passwordInput3 = page.locator('input#password');
  await passwordInput3.clear();
  await passwordInput3.type(password);
  const value3 = await passwordInput3.inputValue();
  console.log('Password input value after type:', value3.length > 0 ? `${value3.length} chars` : 'EMPTY');

  await page.screenshot({ path: '/tmp/debug-login-3.png', fullPage: true });

  console.log('\n=== END DEBUG TEST ===\n');
});
