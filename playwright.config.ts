import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'playwright',
  timeout: 15_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    // We stub all network, so no external calls will be made.
  },
});
