// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite Configuration for Firefox MV3 Extension Build
 *
 * Same as Chrome extension config but outputs to dist-extension-firefox/
 * and copies the Firefox-specific manifest.
 *
 * Firefox MV3 differences:
 * - browser_specific_settings.gecko.id required
 * - background.scripts (not service_worker)
 * - "menus" permission (not "contextMenus")
 *
 * Usage:
 *   pnpm build:extension:firefox — Build Firefox extension files
 */

import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { copyFileSync, readFileSync, existsSync, mkdirSync, cpSync } from 'node:fs';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline';

const root = resolve(__dirname);
const extensionDir = resolve(root, 'extension');
const outDir = resolve(root, 'dist-extension-firefox');

/**
 * Vite plugin to copy Firefox manifest.json and icons to the output directory.
 */
function copyFirefoxManifestPlugin() {
  return {
    name: 'copy-firefox-manifest',
    writeBundle() {
      // Copy Firefox manifest as manifest.json
      const manifestSrc = resolve(extensionDir, 'manifest.firefox.json');
      const manifestDest = resolve(outDir, 'manifest.json');
      copyFileSync(manifestSrc, manifestDest);

      // Copy extension icons from assets/icons/ to dist root
      const iconsSrc = resolve(root, 'assets/icons');
      const iconsDest = resolve(outDir, 'icons');
      if (existsSync(iconsSrc)) {
        if (!existsSync(iconsDest)) {
          mkdirSync(iconsDest, { recursive: true });
        }
        cpSync(iconsSrc, iconsDest, { recursive: true });
      }
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
      copyFirefoxManifestPlugin(),
      cssInlinePlugin(),
    ],
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      target: ['firefox128'],
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
