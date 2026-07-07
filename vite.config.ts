// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite Configuration for X.com Enhanced Gallery Userscript
 *
 * This configuration handles the complete build pipeline:
 * - Vite bundling with Solid.js
 * - CSS processing and inlining
 * - Userscript metadata generation
 * - Quality checks (type checking, linting, TSDoc validation, unused-code checks)
 *
 * Build modes:
 *   pnpm build      - Production build (runs quality checks inline)
 *   pnpm build:dev  - Development build (no quality checks)
 *
 * Quality checks:
 *   pnpm quality     - Typecheck + Biome + TSDoc + Knip
 *   pnpm quality:fix - Typecheck + Biome (write) + TSDoc + Knip
 */

// External dependencies
import { resolve } from 'node:path';
import { defineConfig, mergeConfig, type UserConfig } from 'vite';
import { buildSummaryPlugin } from './tooling/vite/plugins/build-summary';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline';
import { metaOnlyPlugin } from './tooling/vite/plugins/meta-only';
import { basePreset } from './tooling/vite/presets/base';
import { solidPreset } from './tooling/vite/presets/solid';
import { userscriptPreset } from './tooling/vite/presets/userscript';
import { OUTPUT_FILE_NAMES, USERSCRIPT_CONFIG } from './tooling/vite/utils/userscript';
// Tooling utilities
import { resolveVersion } from './tooling/vite/utils/version';

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
  const root = resolve(__dirname);
  const entryFile = resolve(root, './src/main.ts');

  // Feature flags: parse environment variable for media extraction feature
  const featureMediaExtractionRaw = process.env.XEG_FEATURE_MEDIA_EXTRACTION;
  const featureMediaExtraction =
    featureMediaExtractionRaw === undefined
      ? true
      : !['0', 'false'].includes(featureMediaExtractionRaw.toLowerCase());

  // Build output configuration
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;

  // Aliases for disabled features in build
  const mediaExtractionAliases = featureMediaExtraction
    ? []
    : [
        {
          find: '@shared/services/media-extraction/media-extraction-service',
          replacement: resolve(
            root,
            'src/shared/services/media-extraction/media-extraction-service.disabled.ts'
          ),
        },
      ];

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
        alias: mediaExtractionAliases,
      },

      plugins: [
        cssInlinePlugin(),
        metaOnlyPlugin(version, {
          name: USERSCRIPT_CONFIG.name,
          namespace: USERSCRIPT_CONFIG.namespace,
        }),
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
