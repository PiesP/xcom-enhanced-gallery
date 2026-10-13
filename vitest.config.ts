// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

// These suites temporarily mutate files observed by repository-wide tools.
const repositoryProbeFiles = [
  'test/unit/tooling/biome-coverage.test.ts',
  'test/unit/tooling/biome-policy.test.ts',
  'test/unit/tooling/biome-braces.test.ts',
  'test/unit/tooling/node-ambient-types.test.ts',
  'test/unit/tooling/knip-boundaries.test.ts',
];

export default defineConfig({
  define: { __DEV__: true },
  plugins: [solid()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    exclude: ['node_modules', 'dist'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.{ts,tsx}'],
          exclude: ['node_modules', 'dist', ...repositoryProbeFiles],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'repository-probes',
          include: repositoryProbeFiles,
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
