// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite Configuration for MV3 Extension Build (Content Script)
 *
 * Builds the content script as IIFE (classic script).
 * Chrome content scripts do NOT support ES module format — they must be
 * classic scripts. IIFE format wraps everything in a self-executing function
 * with no imports/exports in the output.
 *
 * Usage:
 *   pnpm build:extension:cs — Build content script only
 */

import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { readFileSync } from 'node:fs';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline';

const root = resolve(__dirname);
const outDir = resolve(root, 'dist-extension');

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
      cssInlinePlugin(),
    ],
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: false,
      target: ['chrome117'],
      lib: {
        name: 'XEG',
        entry: [resolve(root, 'src/extension/content.ts')],
        formats: ['iife'],
        fileName: (_format, entryName) => {
          return `${entryName}.js`;
        },
      },
      rolldownOptions: {
        output: {
          entryFileNames: 'content.js',
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
