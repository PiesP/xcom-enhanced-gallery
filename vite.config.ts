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
 *   pnpm quality:fix - Quality with auto-fix
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { buildSummaryPlugin } from './vite.config/build-summary';
import { cssInlinePlugin } from './vite.config/css-inline';
import { headerPlugin } from './vite.config/header';
import { metaOnlyPlugin } from './vite.config/meta-only';
import type { UserscriptBaseConfig } from './vite.config/userscript/types';

// ── Build constants ─────────────────────────────────────────────────────────

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

function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[mode === 'development' ? 'development' : 'production'];
}

const BROWSER_COMPATIBILITY = {
  chrome: '117',
  firefox: '119',
  edge: '117',
  safari: '17',
} as const;

const USERSCRIPT_BASE_CONFIG: UserscriptBaseConfig = {
  name: 'X.com Enhanced Gallery',
  namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
  description: 'Media viewer and download functionality for X.com',
  author: 'PiesP',
  license: 'MIT',
  match: ['https://x.com/*', 'https://*.x.com/*'],
  grant: [
    'GM_setValue',
    'GM_getValue',
    'GM_deleteValue',
    'GM_listValues',
    'GM_download',
    'GM_notification',
    'GM_xmlhttpRequest',
    'GM_cookie',
  ],
  connect: ['pbs.twimg.com', 'video.twimg.com', 'api.twitter.com'],
  runAt: 'document-idle',
  supportURL: 'https://github.com/PiesP/xcom-enhanced-gallery/issues',
  homepageURL: 'https://github.com/PiesP/xcom-enhanced-gallery',
  icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
  noframes: true,
  compatible: BROWSER_COMPATIBILITY,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(__dirname);

/** Returns true for modules that must be preserved during tree-shaking. */
function hasRequiredSideEffects(id: string): boolean {
  return id.replace(/\\/g, '/').endsWith('.css');
}

// ── Version resolution ─────────────────────────────────────────────────────

function getVersionFromPackageJson(): string | null {
  try {
    const pkgPath = resolve(REPO_ROOT, 'package.json');
    const raw = readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    const version = parsed.version;
    return typeof version === 'string' && version.trim() ? version.trim() : null;
  } catch {
    return null;
  }
}

function getGitCommitShort(): string | null {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function resolveVersion(isDev: boolean): string {
  const envVersion = process.env.BUILD_VERSION;
  if (envVersion) return envVersion;

  const pkgVersion = getVersionFromPackageJson();
  const baseVersion = pkgVersion ?? (isDev ? '0.0.0' : '1.0.0');

  if (isDev) {
    const commit = getGitCommitShort() ?? 'unknown';
    return `${baseVersion}-dev.${commit}`;
  }

  return baseVersion;
}

// ── Vite Configuration ──────────────────────────────────────────────────────

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === 'development';
  const config = getBuildModeConfig(mode);
  const version = resolveVersion(isDev);
  const root = REPO_ROOT;
  const entryFile = resolve(root, './src/main.ts');

  // Feature flags: parse environment variable for media extraction feature
  const featureMediaExtractionRaw = process.env.XEG_FEATURE_MEDIA_EXTRACTION;
  const featureMediaExtraction =
    featureMediaExtractionRaw === undefined
      ? true
      : !['0', 'false'].includes(featureMediaExtractionRaw.toLowerCase());

  // Build output configuration
  const outputFileName = isDev
    ? 'xcom-enhanced-gallery.dev.user.js'
    : 'xcom-enhanced-gallery.user.js';

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

  return {
    plugins: [
      solidPlugin({
        solid: {
          omitNestedClosingTags: !isDev,
        },
      }),
      cssInlinePlugin(),
      headerPlugin(version, USERSCRIPT_BASE_CONFIG),
      metaOnlyPlugin(version),
      buildSummaryPlugin({ isDev, version, config }),
    ],
    root,
    resolve: {
      tsconfigPaths: true,
      alias: mediaExtractionAliases,
    },

    build: {
      target: ['chrome117', 'firefox119', 'safari17'],
      minify: false,
      sourcemap: config.sourceMap,
      outDir: 'dist',
      emptyOutDir: true,
      write: true,
      cssCodeSplit: false,
      cssMinify: !isDev ? 'lightningcss' : false,

      lib: {
        entry: entryFile,
        name: 'XcomEnhancedGallery',
        formats: ['iife'],
        fileName: () => outputFileName.replace('.user.js', ''),
        cssFileName: 'style',
      },

      rollupOptions: {
        output: {
          entryFileNames: outputFileName,
          exports: 'none',
        },
        treeshake: isDev
          ? false
          : {
              moduleSideEffects: (id) => hasRequiredSideEffects(id),
              propertyReadSideEffects: false,
              unknownGlobalSideEffects: false,
            },
      },
    },

    css: {
      modules: {
        generateScopedName: config.cssClassNamePattern,
        localsConvention: 'camelCaseOnly',
        scopeBehaviour: 'local',
      },
      devSourcemap: isDev,
    },

    define: {
      __DEV__: JSON.stringify(isDev),
      __FEATURE_MEDIA_EXTRACTION__: JSON.stringify(featureMediaExtraction),
      __VERSION__: JSON.stringify(version),
    },

    logLevel: 'warn',
  };
});
