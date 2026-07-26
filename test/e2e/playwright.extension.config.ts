// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const testDir = resolve(import.meta.dirname, 'specs');

export default defineConfig({
  testDir,
  testMatch: 'extension-runtime.spec.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
});
