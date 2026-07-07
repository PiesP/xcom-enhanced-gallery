// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Base Vite preset — shared minimal configuration for all build targets.
 *
 * Provides:
 * - Root directory
 * - TypeScript path resolution
 * - Global define constants
 * - Log level
 */

import { resolve } from 'node:path';
import type { UserConfig } from 'vite';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BasePresetOptions {
  /** Project root directory (defaults to CWD). */
  readonly root?: string;
  readonly isDev: boolean;
  readonly version: string;
  readonly featureMediaExtraction: boolean;
}

// ── Preset ───────────────────────────────────────────────────────────────────

/**
 * Create a minimal shared Vite configuration.
 *
 * @param options - Build mode flags and global values
 * @returns Partial `UserConfig` suitable for `mergeConfig`
 */
export function basePreset(options: BasePresetOptions): UserConfig {
  const { isDev, version, featureMediaExtraction } = options;
  const root = options.root ?? resolve(process.cwd());

  return {
    root,

    resolve: {
      tsconfigPaths: true,
    },

    define: {
      __DEV__: JSON.stringify(isDev),
      __VERSION__: JSON.stringify(version),
      __FEATURE_MEDIA_EXTRACTION__: JSON.stringify(featureMediaExtraction),
    },

    logLevel: 'warn',
  };
}
