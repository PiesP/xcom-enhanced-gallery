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
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// Internal modules
import { getBuildModeConfig, OUTPUT_FILE_NAMES } from './tooling/vite/constants';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline';
import { singleFileBundleGuardPlugin } from './tooling/vite/plugins/single-file-guard';
import { generateUserscriptHeader } from './tooling/vite/userscript/metadata';
import { metaOnlyPlugin } from './tooling/vite/userscript/vite-plugin-meta-only';
import { resolveVersion } from './tooling/vite/version';

// ── Helpers ─────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(__dirname);

function normalizeModuleId(id: string): string {
  return id.replace(/\\/g, '/');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Determine if a module has required side effects for tree-shaking.
 * CSS files and globals always have side effects and should be preserved.
 */
function hasRequiredSideEffects(id: string): boolean {
  const normalized = normalizeModuleId(id);
  if (normalized.endsWith('.css')) return true;
  return normalized.endsWith('/src/styles/globals.ts');
}

// ─────────────────────────────────────────────────────────────────────────────
// Vite Configuration
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === 'development';
  const isProd = mode === 'production';
  const config = getBuildModeConfig(mode);
  const version = resolveVersion(isDev);
  const root = REPO_ROOT;
  const entryFile = resolve(root, './src/main.ts');

  // Feature flags: parse environment variable for media extraction feature
  const featureMediaExtractionRaw = process.env.XEG_FEATURE_MEDIA_EXTRACTION;
  const featureMediaExtraction =
    featureMediaExtractionRaw === undefined
      ? true
      : !(featureMediaExtractionRaw === '0' || featureMediaExtractionRaw.toLowerCase() === 'false');

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

  return {
    plugins: [
      solidPlugin({
        solid: {
          // Userscript bundles are not SSR-hydrated. Enable smaller template output in production.
          omitNestedClosingTags: isProd,
        },
      }),
      cssInlinePlugin(mode),
      metaOnlyPlugin(version),
      buildSummaryPlugin({ isDev, version, config }),
      singleFileBundleGuardPlugin(mode),
    ],
    root,

    resolve: {
      tsconfigPaths: true,
      alias: mediaExtractionAliases,
    },

    build: {
      target: 'esnext',
      // Greasy Fork rule: scripts must not be minified/obfuscated.
      minify: false,
      sourcemap: config.sourceMap,
      outDir: 'dist',
      emptyOutDir: true,
      write: true,
      cssCodeSplit: false,
      // Keep CSS non-minified at the bundler level (the CSS inline plugin applies its own
      // mode-dependent size optimizations).
      cssMinify: false,

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
          // This userscript bundle is consumed as a single IIFE, not as a module.
          // Do not generate any exports wrapper; it breaks userscript runtimes where
          // `exports` is not defined.
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

// ─────────────────────────────────────────────────────────────────────────────
// Build Summary Plugin (inlined from tooling/vite/plugins/userscript-header.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Vite plugin that prints a build summary after bundling.
 *
 * Shows build mode, optimization settings, version, and gzipped bundle size.
 *
 * @param opts - Build context values
 * @returns Vite plugin instance for build summary output
 */
function buildSummaryPlugin(opts: {
  isDev: boolean;
  version: string;
  config: ReturnType<typeof getBuildModeConfig>;
}): Plugin {
  const { isDev, version, config } = opts;
  const header = generateUserscriptHeader({ version, isDev });

  return {
    name: 'post-build',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle): void {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = `${header}\n${chunk.code}`;
          break;
        }
      }
    },

    closeBundle(): void {
      const modeLabel = isDev ? 'Development' : 'Production';
      const sourceMapLabel =
        config.sourceMap === 'inline' ? 'Inline' : config.sourceMap ? 'External' : 'Disabled';
      const info = isDev
        ? [
            '📖 Optimized for: Debugging & Analysis',
            '├─ CSS class names: Readable (Component__class__hash)',
            '├─ CSS formatting: Preserved',
            '├─ CSS variables: Full names',
            '├─ CSS comments: Preserved',
            `└─ Source maps: ${sourceMapLabel}`,
          ]
        : [
            '📦 Optimized for: Distribution Size',
            '├─ CSS class names: Hashed (xg-*)',
            '├─ CSS formatting: Compressed',
            '├─ CSS variables: Full names',
            '├─ CSS custom properties: Pruned',
            '├─ CSS comments: Removed',
            `└─ Source maps: ${sourceMapLabel}`,
          ];

      console.log(`\n📋 Build Mode: ${modeLabel}`);
      console.log('─'.repeat(50));
      info.forEach((line) => console.log(`   ${line}`));
      console.log('─'.repeat(50));
      console.log(`📌 Version: ${version}`);

      const bundleName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
      const bundlePath = `dist/${bundleName}`;
      try {
        const stats = statSync(bundlePath);
        const gzipped = gzipSync(readFileSync(bundlePath)).length;
        console.log(
          `📦 Bundle: ${bundleName} — ${formatBytes(stats.size)} (gzip ${formatBytes(gzipped)})`
        );
      } catch {
        // Bundle size reporting is best-effort; ignore read errors.
      }
    },
  };
}
