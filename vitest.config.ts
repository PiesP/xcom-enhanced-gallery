// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import solid from 'vite-plugin-solid';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

// These suites temporarily mutate files observed by repository-wide tools.
const repositoryProbeFiles = [
  'test/unit/tooling/toolchain-policy.test.ts',
  'test/unit/tooling/node-ambient-types.test.ts',
];

export function createVitestConfig(excludeBoundaryProbe = false) {
  return defineConfig({
    define: { __DEV__: true },
    plugins: [solid()],
    test: {
      // Preserve mock history and per-project plugin lifecycles.
      clearMocks: false,
      sharedViteServer: false,
      fakeTimers: { toNotFake: ['Temporal'] },
      globals: true,
      environment: 'node',
      setupFiles: ['./test/setup.ts'],
      exclude: ['node_modules', 'dist'],
      projects: [
        {
          extends: true,
          test: {
            name: 'node',
            include: ['test/unit/**/*.test.{ts,tsx}'],
            exclude: [
              'node_modules',
              'dist',
              'test/browser/**/*.browser.test.{ts,tsx}',
              ...repositoryProbeFiles,
            ],
            sequence: { groupOrder: 0 },
          },
        },
        {
          extends: true,
          test: {
            name: 'browser',
            include: ['test/browser/**/*.browser.test.{ts,tsx}'],
            browser: {
              enabled: true,
              provider: playwright(),
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
            sequence: { groupOrder: 0 },
          },
        },
        {
          extends: true,
          test: {
            name: 'repository-probes',
            include: repositoryProbeFiles.filter(
              (file) =>
                !excludeBoundaryProbe || file !== 'test/unit/tooling/node-ambient-types.test.ts'
            ),
            fileParallelism: false,
            sequence: { groupOrder: 1 },
          },
        },
      ],
      passWithNoTests: false,
      slowTestThreshold: 500,
      testTimeout: 10000,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          // Bootstrap entry points are exercised by Playwright rather than unit tests.
          'src/main.ts',
          'src/extension/content.ts',
          // Type-only modules have no runtime behavior to cover.
          'src/extension/extension-message-types.ts',
          'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.types.ts',
          'src/platform/types.ts',
          'src/shared/components/**/*.types.ts',
          'src/shared/hooks/**/*.types.ts',
          'src/shared/i18n/types.ts',
          'src/shared/services/media/types.ts',
          'src/shared/types/core/cookie.types.ts',
          'src/shared/types/lifecycle.types.ts',
          'src/shared/types/settings.types.ts',
          'src/shared/types/toolbar.types.ts',
        ],
        thresholds: {
          statements: 42,
          branches: 37,
          functions: 40,
          lines: 44,
        },
      },
    },
    resolve: { tsconfigPaths: true },
  });
}

export default createVitestConfig();
