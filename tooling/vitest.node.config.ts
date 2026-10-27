// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { defineConfig } from 'vite-plus';

// Kept outside the unit config so Node policy and installed-browser harnesses
// cannot inherit its GM boundary setup or browser project.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    passWithNoTests: false,
    projects: [
      {
        test: {
          name: 'policy-node',
          environment: 'node',
          include: [
            'scripts/ci/repository-authority.test.ts',
            'scripts/release/verify-source.test.ts',
          ],
          fileParallelism: false,
        },
      },
      {
        test: {
          name: 'firefox-installed',
          environment: 'node',
          include: ['test/e2e/firefox-extension-runtime.test.ts'],
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
      {
        test: {
          name: 'windows-native',
          environment: 'node',
          include: ['validation/windows/**/*.test.ts'],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
