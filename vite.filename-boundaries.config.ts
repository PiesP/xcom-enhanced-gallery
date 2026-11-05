// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';
import { resolveVersion } from './tooling/vite/utils/version.ts';

/** Node-only source bundle for the prepared-Windows native filename fixture. */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@platform/index',
        replacement: resolve('validation/windows/filename-boundary-adapter.ts'),
      },
      { find: /^@platform\//, replacement: `${resolve('src/platform')}/` },
      { find: /^@shared\//, replacement: `${resolve('src/shared')}/` },
      { find: /^@constants\//, replacement: `${resolve('src/constants')}/` },
    ],
  },
  define: { __DEV__: 'false', __VERSION__: JSON.stringify(resolveVersion(false)) },
  build: {
    target: 'node26',
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    lib: {
      entry: resolve('validation/windows/filename-boundary-fixture.ts'),
      formats: ['es'],
      fileName: () => 'validation/filename-boundary-fixture.mjs',
    },
    rolldownOptions: { external: (id) => id.startsWith('node:') },
  },
});
