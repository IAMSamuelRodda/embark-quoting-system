import { defineConfig, devices } from '@playwright/test';

const config: any = {
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
  config.webServer = {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  };
}

export default defineConfig(config);
