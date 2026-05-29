import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/audit',
  outputDir: './tests/results',
  timeout: 30_000,
  retries: 0,
  reporter: [
    ['html', { outputFolder: 'tests/report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    screenshot: 'on',
    video: 'off',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 60_000,
    env: { PLAYWRIGHT_TEST: '1', PORT: '3001' },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
