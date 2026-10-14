// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Userscript build: Solid bundling, inline CSS, and userscript metadata.
 *
 * Ordinary `pnpm build` runs version/quality checks through its prebuild hook.
 * `build:ci`, `build:dev`, and `build:fast` invoke the bundler without that gate.
 * CONTRIBUTING.md owns the current command and validation contracts.
 */

// External dependencies
import { resolve } from 'node:path';
import { defineConfig, mergeConfig, type UserConfig } from 'vite';
import { buildSummaryPlugin } from './tooling/vite/plugins/build-summary.ts';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline.ts';
import { metaOnlyPlugin } from './tooling/vite/plugins/meta-only.ts';
import { basePreset } from './tooling/vite/presets/base.ts';
import { solidPreset } from './tooling/vite/presets/solid.ts';
import { userscriptPreset } from './tooling/vite/presets/userscript.ts';
import { OUTPUT_FILE_NAMES, USERSCRIPT_CONFIG } from './tooling/vite/utils/userscript.ts';
// Tooling utilities
import { resolveVersion } from './tooling/vite/utils/version.ts';

// ── Build constants ─────────────────────────────────────────────────────────

/** Configuration options for build mode optimization (development vs production). */
interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | 'inline';
}

const BUILD_MODE_CONFIGS: Record<'development' | 'production', BuildModeConfig> = {
  development: {
    cssCompress: false,
    cssClassNamePattern: '[name]__[local]__[hash:base64:5]',
    sourceMap: true as const,
  },
  production: {
    cssCompress: true,
    cssClassNamePattern: 'xg-[hash:base64:4]',
    sourceMap: false as const,
  },
};

/** Resolve build mode configuration from Vite mode string. */
function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[mode === 'development' ? 'development' : 'production'];
}

// ── Vite Configuration ──────────────────────────────────────────────────────

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === 'development';
  const config = getBuildModeConfig(mode);
  const version = resolveVersion(isDev);

  if (version === '0.0.0' || version === '1.0.0') {
    throw new Error(
      `[vite.config] Version resolved to fallback "${version}". ` +
        'Check tooling/vite/utils/version.ts REPO_ROOT path and package.json presence.'
    );
  }
  const root = resolve(import.meta.dirname);
  const entryFile = resolve(root, './src/main.ts');

  // Feature flags: media extraction is always enabled (the disabled variant was deleted)
  const featureMediaExtraction = true;

  // Build output configuration
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;

  // Compose config from presets using deep merge
  return mergeConfig(
    mergeConfig(
      mergeConfig(
        basePreset({ root, isDev, version, featureMediaExtraction }),
        solidPreset({ isDev, cssClassNamePattern: config.cssClassNamePattern })
      ),
      userscriptPreset({
        entryFile,
        outputFileName,
        isDev,
        cssCompress: config.cssCompress,
        sourceMap: config.sourceMap,
      })
    ),
    {
      resolve: {
        alias: [],
      },

      plugins: [
        cssInlinePlugin(),
        ...(isDev
          ? []
          : [
              metaOnlyPlugin(version, {
                name: USERSCRIPT_CONFIG.name,
                namespace: USERSCRIPT_CONFIG.namespace,
              }),
            ]),
        buildSummaryPlugin({
          isDev,
          version,
          config,
          baseConfig: USERSCRIPT_CONFIG,
        }),
      ],
    }
  );
});
