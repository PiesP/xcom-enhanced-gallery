import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.resolve(__dirname, 'playwright');

export default defineConfig({
  testDir,
  testMatch: /smoke\/.*\.spec\.ts$/,
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'about:blank',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    video: process.env.CI ? 'retain-on-failure' : 'retry-with-video',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  globalSetup: path.resolve(__dirname, 'playwright', 'global-setup.ts'),
});
