/**
 * Vite Configuration for X.com Enhanced Gallery Userscript
 *
 * This configuration handles the complete build pipeline:
 * - Vite bundling with Solid.js
 * - CSS processing and inlining
 * - Userscript metadata generation
 * - Third-party license aggregation
 * - Quality checks (type checking, linting)
 *
 * Build modes:
 *   pnpm build      - Production build (runs `pnpm quality` via prebuild)
 *   pnpm build:dev  - Development build (no implicit quality checks)
 *   pnpm build:fast - Production build (no implicit quality checks)
 *
 * Quality checks:
 *   pnpm quality     - Typecheck + Biome check
 *   pnpm quality:fix - Typecheck + Biome check (write)
 */

import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { resolveViteAliasesFromTsconfig } from './tooling/node/tsconfig-aliases';
import { getBuildModeConfig } from './tooling/vite/build-mode';
import { OUTPUT_FILE_NAMES } from './tooling/vite/constants';
import { REPO_ROOT } from './tooling/vite/paths';
import { cssInlinePlugin } from './tooling/vite/plugins/css-inline';
import { distCleanupPlugin } from './tooling/vite/plugins/dist-cleanup';
import { licenseAssetsPlugin } from './tooling/vite/plugins/license-assets';
import { metaOnlyPlugin } from './tooling/vite/plugins/meta-only';
import { productionCleanupPlugin } from './tooling/vite/plugins/production-cleanup';
import { singleFileBundleGuardPlugin } from './tooling/vite/plugins/single-file-guard';
import { userscriptHeaderPlugin } from './tooling/vite/plugins/userscript-header';
import { resolveVersion } from './tooling/vite/version';

// ─────────────────────────────────────────────────────────────────────────────
// Path Aliases
// ─────────────────────────────────────────────────────────────────────────────

function buildPathAliases(root: string) {
  return resolveViteAliasesFromTsconfig({
    rootDir: root,
    tsconfigPath: resolve(root, 'tsconfig.json'),
  });
}

function normalizeModuleId(id: string): string {
  return id.replace(/\\/g, '/');
}

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
  const buildTime = new Date().toISOString();
  const featureMediaExtractionRaw = process.env.XEG_FEATURE_MEDIA_EXTRACTION;
  const featureMediaExtraction =
    featureMediaExtractionRaw === undefined
      ? true
      : !(featureMediaExtractionRaw === '0' || featureMediaExtractionRaw.toLowerCase() === 'false');
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const root = REPO_ROOT;
  const entryFile = resolve(root, isProd ? './src/main.slim.ts' : './src/main.ts');
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
      distCleanupPlugin(),
      solidPlugin({
        solid: {
          // Userscript bundles are not SSR-hydrated. Enable smaller template output in production.
          omitNestedClosingTags: isProd,
        },
      }),
      cssInlinePlugin(mode),
      metaOnlyPlugin(mode),
      ...(!isDev ? [productionCleanupPlugin()] : []),
      userscriptHeaderPlugin(mode),
      licenseAssetsPlugin(),
      singleFileBundleGuardPlugin(mode),
    ],
    root,

    resolve: {
      alias: [
        ...mediaExtractionAliases,
        // Bundle-size optimization: In production we swap the full AppErrorReporter
        // implementation for a slimmer one. This avoids shipping large docstrings
        // and verbose payload keys in a non-minified build.
        ...(isProd
          ? [
              {
                find: '@shared/logging',
                replacement: resolve(root, 'src/shared/logging/index.slim.ts'),
              },
              {
                find: '@shared/error/app-error-reporter',
                replacement: resolve(root, 'src/shared/error/app-error-reporter.slim.ts'),
              },
              {
                find: /[\\/]twitter-response-parser\.ts$/,
                replacement: resolve(
                  root,
                  'src/shared/services/media/twitter-parser/twitter-response-parser.slim.ts'
                ),
              },
            ]
          : []),
        ...buildPathAliases(root),
      ],
    },

    build: {
      target: 'esnext',
      // Greasy Fork rule: scripts must not be minified/obfuscated.
      minify: false,
      sourcemap: config.sourceMap,
      outDir: 'dist',
      emptyOutDir: false,
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
          inlineDynamicImports: true,
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
      __BUILD_TIME__: JSON.stringify(buildTime),
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.DEV': JSON.stringify(isDev),
      'import.meta.env.PROD': JSON.stringify(!isDev),
    },

    logLevel: 'warn',
  };
});
