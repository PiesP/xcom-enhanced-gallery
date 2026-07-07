// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Solid.js Vite preset — Solid plugin integration and CSS modules configuration.
 *
 * Provides:
 * - `vite-plugin-solid` with mode-aware JSX options
 * - CSS modules scoped names and conventions
 * - Development-sourcemap for CSS
 */

import solidPlugin from 'vite-plugin-solid';
import type { UserConfig } from 'vite';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SolidPresetOptions {
  readonly isDev: boolean;
  /** CSS modules class-name pattern (e.g. `[name]__[local]__[hash:base64:5]`). */
  readonly cssClassNamePattern: string;
}

// ── Preset ───────────────────────────────────────────────────────────────────

/**
 * Create a Vite configuration fragment for Solid.js support.
 *
 * @param options - Build mode and CSS modules pattern
 * @returns Partial `UserConfig` suitable for `mergeConfig`
 */
export function solidPreset(options: SolidPresetOptions): UserConfig {
  const { isDev, cssClassNamePattern } = options;

  return {
    plugins: [
      solidPlugin({
        solid: {
          omitNestedClosingTags: !isDev,
        },
      }),
    ],

    css: {
      modules: {
        generateScopedName: cssClassNamePattern,
        localsConvention: 'camelCaseOnly',
        scopeBehaviour: 'local',
      },
      devSourcemap: isDev,
    },
  };
}
