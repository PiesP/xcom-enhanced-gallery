// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite Configuration for Firefox MV3 Extension Build (Content Script)
 *
 * Builds the content script as IIFE (classic script).
 * Firefox content scripts with ES module format require "type": "module"
 * in the manifest, but IIFE is simpler and more compatible.
 *
 * Usage:
 *   pnpm build:extension:firefox:cs — Build Firefox content script only
 */

import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { readFileSync } from 'node:fs';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline';

/**
 * ⚠️ CRITICAL: This config MUST always use formats: ['iife'].
 * Firefox content scripts can be classic scripts (IIFE) and do NOT
 * need a module declaration in the manifest when built as IIFE.
 * Changing to 'es' would require adding "type": "module" to the
 * content_scripts section in manifest.firefox.json.
 */
function enforceIIFEFormat() {
  return {
    name: 'enforce-iife-format',
    enforce: 'post' as const,
    generateBundle(options: { format: string }) {
      if (options.format !== 'iife') {
        throw new Error(
          `FATAL: Firefox content script build must use IIFE format, got "${options.format}". ` +
          `Firefox content scripts as ES module require manifest changes. ` +
          `Do NOT change formats to 'es' in vite.extension.firefox.cs.config.ts.`
        );
      }
    },
  };
}

const root = resolve(__dirname);
const outDir = resolve(root, 'dist-extension-firefox');

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
      enforceIIFEFormat(),
    ],
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: false,
      target: ['firefox128'],
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
