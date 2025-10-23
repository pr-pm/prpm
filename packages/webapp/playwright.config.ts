import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for PRPM Webapp E2E tests
 *
 * Supports two modes:
 * 1. Mock mode (default): Uses route interception to mock API responses
 * 2. Real API mode: Tests against real registry backend (set USE_REAL_API=true)
 *
 * For real API testing:
 *   USE_REAL_API=true npm run test:e2e
 *
 * For Docker-based testing:
 *   docker-compose -f docker-compose.test.yml up
 */

const useRealAPI = process.env.USE_REAL_API === 'true';
const registryURL = process.env.REGISTRY_API_URL || 'http://localhost:3001';
const webappURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined, // Increased from 1 to 4 for parallel execution
  reporter: process.env.CI ? [['html'], ['list']] : 'html',

  use: {
    baseURL: webappURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Pass environment variables to tests
        contextOptions: {
          extraHTTPHeaders: useRealAPI ? {} : {},
        },
      },
    },

    // Additional browsers disabled for CI performance
    // Uncomment for comprehensive cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: webappURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

// Export test metadata
export const testConfig = {
  useRealAPI,
  registryURL,
  webappURL,
};
