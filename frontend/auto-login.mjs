/**
 * Automated Login Script for Local Development
 *
 * This script uses Playwright to automatically log in to the local development
 * environment. It launches a persistent browser session that stays open after
 * login, allowing you to immediately start testing.
 *
 * Environment Variables:
 * - DEV_URL: The local development URL (default: http://localhost:3000)
 * - DEV_EMAIL: The test user email
 * - DEV_PASSWORD: The test user password (retrieved from AWS Secrets Manager)
 *
 * Usage:
 *   DEV_URL="http://localhost:3000" \
 *   DEV_EMAIL="test@example.com" \
 *   DEV_PASSWORD="password123" \
 *   node scripts/auto-login.mjs
 */

import { chromium } from '@playwright/test';

// Configuration from environment variables
const config = {
  url: process.env.DEV_URL || 'http://localhost:3000',
  email: process.env.DEV_EMAIL || 'e2e-test@embark-quoting.local',
  password: process.env.DEV_PASSWORD,
  timeout: 60000, // 60 seconds
};

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

/**
 * Main auto-login function
 */
async function autoLogin() {
  // Validate configuration
  if (!config.password) {
    logError('DEV_PASSWORD environment variable not set');
    logInfo('This should be set by the dev-start.sh script');
    process.exit(1);
  }

  logInfo('Starting automated login process...');
  logInfo(`Target URL: ${config.url}`);
  logInfo(`Email: ${config.email}`);

  let browser;
  let context;
  let page;

  try {
    // Launch browser in headed mode (visible to user)
    logInfo('Launching browser...');
    browser = await chromium.launch({
      headless: false, // Show the browser window
      slowMo: 500, // Slow down actions for visibility (500ms between actions)
    });

    // Create a new browser context with a larger viewport
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Create a new page
    page = await context.newPage();

    // Set longer timeout for navigation
    page.setDefaultTimeout(config.timeout);

    // Navigate to the application
    logInfo('Navigating to application...');
    await page.goto(config.url, {
      waitUntil: 'load',
      timeout: config.timeout,
    });

    logSuccess('Page loaded successfully');

    // Wait for the login page to be ready
    logInfo('Waiting for login form...');
    await page.waitForSelector('input[placeholder*="email" i], input[type="email"]', {
      state: 'visible',
      timeout: 10000,
    });

    logSuccess('Login form detected');

    // Fill in email
    logInfo('Entering email...');
    const emailField = page.getByPlaceholder(/email/i);
    await emailField.fill(config.email);
    logSuccess('Email entered');

    // Fill in password
    logInfo('Entering password...');
    const passwordField = page.getByPlaceholder(/password/i);
    await passwordField.fill(config.password);
    logSuccess('Password entered');

    // Wait a moment before clicking (for visual feedback)
    await page.waitForTimeout(500);

    // Click sign in button
    logInfo('Clicking sign in button...');
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await signInButton.click();
    logSuccess('Sign in button clicked');

    // Wait for navigation after login
    logInfo('Waiting for authentication...');

    // We'll wait for one of these conditions:
    // 1. Redirected away from /login (successful login)
    // 2. Error message appears (failed login)
    // 3. Timeout (something went wrong)

    try {
      // Wait for URL to change from /login or for dashboard to appear
      await Promise.race([
        page.waitForURL(/\/(dashboard|quotes|jobs)/, { timeout: 30000 }),
        page.waitForSelector('[data-testid="dashboard"]', { timeout: 30000 }),
        page.waitForFunction(
          () => !window.location.pathname.includes('/login'),
          { timeout: 30000 }
        ),
      ]);

      logSuccess('Login successful! 🎉');
      logInfo('Browser is now authenticated and ready for testing');
      logInfo(`Current URL: ${page.url()}`);

      // Take a screenshot for verification
      await page.screenshot({
        path: '/tmp/embark-auto-login-success.png',
        fullPage: false,
      });
      logSuccess('Screenshot saved: /tmp/embark-auto-login-success.png');

    } catch (navigationError) {
      // Check if there's an error message on the page
      const errorMessage = await page
        .locator('text=/error|invalid|incorrect/i')
        .first()
        .textContent()
        .catch(() => null);

      if (errorMessage) {
        logError(`Login failed: ${errorMessage}`);
        await page.screenshot({
          path: '/tmp/embark-auto-login-error.png',
          fullPage: false,
        });
        logInfo('Screenshot saved: /tmp/embark-auto-login-error.png');
        throw new Error(`Login failed: ${errorMessage}`);
      } else {
        // Navigation timeout, but no error message - might still be loading
        logWarning('Navigation timeout, but no error detected');
        logInfo('Page might still be loading... Waiting a bit longer...');

        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          logError('Still on login page after authentication attempt');
          await page.screenshot({
            path: '/tmp/embark-auto-login-stuck.png',
            fullPage: false,
          });
          logInfo('Screenshot saved: /tmp/embark-auto-login-stuck.png');
          throw new Error('Login appears to have failed - still on login page');
        } else {
          logSuccess('Login appears successful (URL changed)');
          logInfo(`Current URL: ${currentUrl}`);
        }
      }
    }

    // Keep the browser open
    logInfo('');
    logInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logSuccess('Browser is now open and authenticated!');
    logInfo('You can start testing immediately.');
    logInfo('The browser will remain open for your testing session.');
    logInfo('Close the browser window when you\'re done.');
    logInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logInfo('');

    // Wait for the browser to be closed manually
    await new Promise(() => {}); // Never resolves - keeps process running

  } catch (error) {
    logError(`Auto-login failed: ${error.message}`);

    // Take a screenshot for debugging
    if (page) {
      try {
        await page.screenshot({
          path: '/tmp/embark-auto-login-failure.png',
          fullPage: true,
        });
        logInfo('Debug screenshot saved: /tmp/embark-auto-login-failure.png');
      } catch (screenshotError) {
        // Ignore screenshot errors
      }
    }

    // Close browser on error
    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logInfo('\nReceived interrupt signal, exiting...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logInfo('\nReceived termination signal, exiting...');
  process.exit(0);
});

// Run the auto-login function
autoLogin().catch((error) => {
  logError(`Unhandled error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
