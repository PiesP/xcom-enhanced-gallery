// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Userscript Vite preset — single-file IIFE build configuration.
 *
 * Provides:
 * - IIFE library target with fixed entry/output
 * - Browser compatibility targets
 * - Development/production tree-shaking
 * - Source-map and CSS minification flags
 */

import type { UserConfig } from 'vite';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserscriptPresetOptions {
  /** Absolute path to the application entry point. */
  readonly entryFile: string;
  /** Output file-name (e.g. `xcom-enhanced-gallery.user.js`). */
  readonly outputFileName: string;
  readonly isDev: boolean;
  readonly cssCompress: boolean;
  readonly sourceMap: boolean | 'inline';
}

// ── Preset ───────────────────────────────────────────────────────────────────

/**
 * Create a Vite configuration fragment for userscript (single-file IIFE) builds.
 *
 * @param options - Entry, output, and build-mode settings
 * @returns Partial `UserConfig` suitable for `mergeConfig`
 */
export function userscriptPreset(options: UserscriptPresetOptions): UserConfig {
  const { entryFile, outputFileName, isDev, cssCompress, sourceMap } = options;

  return {
    build: {
      target: ['chrome117', 'firefox128', 'safari17'],
      minify: false,
      sourcemap: sourceMap,
      outDir: 'dist',
      // Development and production bundles use different filenames and are
      // consumed together by the E2E suite. Keep both outputs when the two
      // build modes run back-to-back; `pnpm clean` remains the explicit reset.
      emptyOutDir: false,
      write: true,
      cssCodeSplit: false,
      cssMinify: cssCompress ? 'lightningcss' : false,

      lib: {
        entry: entryFile,
        name: 'XcomEnhancedGallery',
        formats: ['iife'],
        fileName: () => outputFileName.replace('.user.js', ''),
        cssFileName: 'style',
      },

      rolldownOptions: {
        output: {
          entryFileNames: outputFileName,
          exports: 'auto',
        },
        treeshake: isDev
          ? false
          : {
              // Preserve CSS imports as side-effects — required for module styles
              moduleSideEffects: (id: string) =>
                id.replace(/\\/g, '/').endsWith('.css'),
              propertyReadSideEffects: false,
              unknownGlobalSideEffects: false,
            },
      },
    },
  };
}
