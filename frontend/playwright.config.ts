import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

// Debug: Log environment variables during config evaluation
console.log('🔍 Playwright Config Debug:');
console.log(`  E2E_BASE_URL: ${process.env.E2E_BASE_URL || '(not set)'}`);
console.log(`  E2E_API_URL: ${process.env.E2E_API_URL || '(not set)'}`);
console.log(`  CI: ${process.env.CI || '(not set)'}`);

const config: Partial<PlaywrightTestConfig> = {
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    // Use E2E_BASE_URL from environment if set (for CI/CD against deployed environments)
    // Otherwise use localhost for local development
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
};

// Only start local dev server if testing against localhost (local development)
// Skip webServer when E2E_BASE_URL is set (CI/CD against deployed environment)
if (!process.env.E2E_BASE_URL) {
  console.log('⚠️  E2E_BASE_URL not set - starting local dev server');
  config.webServer = {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  };
} else {
  console.log(`✅ E2E_BASE_URL set to: ${process.env.E2E_BASE_URL} - skipping dev server`);
}

export default defineConfig(config);
