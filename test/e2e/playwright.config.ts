// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const __dirname = resolve(import.meta.dirname, '.');
const distDir = resolve(__dirname, '../../dist');

export default defineConfig({
  testDir: resolve(__dirname, 'specs'),
  testIgnore: 'extension-runtime.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  outputDir: resolve(__dirname, '../../test-results/userscript'),
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: resolve(__dirname, '../../playwright-report/userscript'), open: 'never' },
    ],
  ],
  use: {
    baseURL: 'https://x.com',
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      slowMo: process.env.CI ? 0 : 200,
      args: ['--disable-blink-features=AutomationControlled'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  metadata: {
    distDir,
    userscriptPath: resolve(distDir, 'xcom-enhanced-gallery.user.js'),
  },
});
