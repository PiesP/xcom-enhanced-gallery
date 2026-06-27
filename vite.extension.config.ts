// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite Configuration for MV3 Extension Build
 *
 * Builds the extension service worker and content script as ES modules.
 * Output goes to dist-extension/ for loading in Chrome as an unpacked extension.
 *
 * Usage:
 *   pnpm build:extension — Build extension files
 */

import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { copyFileSync, readFileSync } from 'node:fs';

const root = resolve(__dirname);
const extensionDir = resolve(root, 'extension');
const outDir = resolve(root, 'dist-extension');

/**
 * Vite plugin to copy manifest.json to the output directory.
 */
function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      const manifestSrc = resolve(extensionDir, 'manifest.json');
      const manifestDest = resolve(outDir, 'manifest.json');
      copyFileSync(manifestSrc, manifestDest);
    },
  };
}

export default defineConfig((): UserConfig => {
  return {
    root,
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      solidPlugin({
        solid: {
          omitNestedClosingTags: true,
        },
      }),
      copyManifestPlugin(),
    ],
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      target: ['chrome117'],
      lib: {
        entry: [resolve(root, 'src/extension/background.ts'), resolve(root, 'src/extension/content.ts')],
        formats: ['es'],
        fileName: (_format, entryName) => {
          return `${entryName}.js`;
        },
      },
      rollupOptions: {
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background') return 'background.js';
            if (chunkInfo.name === 'content') return 'content.js';
            return `${chunkInfo.name}.js`;
          },
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    define: {
      __DEV__: JSON.stringify(false),
      __FEATURE_MEDIA_EXTRACTION__: JSON.stringify(true),
      __VERSION__: JSON.stringify(JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8')).version),
    },
    logLevel: 'warn',
  };
});
