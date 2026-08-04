// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const testDir = resolve(import.meta.dirname, 'specs');
const projectRoot = resolve(import.meta.dirname, '../..');

export default defineConfig({
  testDir,
  testMatch: 'extension-runtime.spec.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  outputDir: resolve(projectRoot, 'test-results/extension'),
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: resolve(projectRoot, 'playwright-report/extension'), open: 'never' },
    ],
  ],
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-installed-extension',
      grep: /loads the Chrome extension/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-artifact-runtime',
      grep: /Firefox/,
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
