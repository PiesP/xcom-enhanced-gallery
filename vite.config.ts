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
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// ── Build constants ─────────────────────────────────────────────────────────

/** Configuration options for build mode optimization (development vs production). */
interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | 'inline';
}

/** Complete userscript metadata for header generation. */
interface UserscriptMeta {
  readonly name: string;
  readonly namespace: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly license: string;
  readonly match: readonly string[];
  readonly grant: readonly string[];
  readonly connect: readonly string[];
  readonly runAt: 'document-start' | 'document-end' | 'document-idle';
  readonly supportURL: string;
  readonly homepageURL?: string;
  readonly downloadURL: string;
  readonly updateURL: string;
  readonly noframes: boolean;
  readonly icon?: string;
  readonly require?: readonly string[];
  readonly compatible?: Record<string, string>;
}

/** Base userscript configuration excluding runtime-generated fields. */
type UserscriptBaseConfig = Omit<UserscriptMeta, 'version' | 'downloadURL' | 'updateURL'>;

/** ID for injected style element in DOM. */
const STYLE_ID = 'xeg-injected-styles' as const;

/** Output file names for production and development builds. */
const OUTPUT_FILE_NAMES = {
  dev: 'xcom-enhanced-gallery.dev.user.js',
  prod: 'xcom-enhanced-gallery.user.js',
  meta: 'xcom-enhanced-gallery.meta.js',
} as const;

/** Base URL for CDN-hosted userscript and update files. */
const CDN_BASE_URL =
  'https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist' as const;

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

/** Minimum browser version requirements for the userscript. */
const BROWSER_COMPATIBILITY = {
  chrome: '117',
  firefox: '119',
  edge: '117',
  safari: '17',
} as const;

/** Complete userscript metadata configuration. */
const USERSCRIPT_CONFIG = {
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
  runAt: 'document-idle' as const,
  supportURL: 'https://github.com/PiesP/xcom-enhanced-gallery/issues',
  homepageURL: 'https://github.com/PiesP/xcom-enhanced-gallery',
  icon: 'data:image/png;base64,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',
  noframes: true,
  compatible: BROWSER_COMPATIBILITY,
} as const satisfies UserscriptBaseConfig;

// ── Helpers ─────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(__dirname);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Returns true for modules that must be preserved during tree-shaking. */
function hasRequiredSideEffects(id: string): boolean {
  return id.replace(/\\/g, '/').endsWith('.css');
}

// ─────────────────────────────────────────────────────────────────────────────
// Version resolution (inlined from tooling/vite/version.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get version from package.json version field.
 * @returns Version string or null if missing/invalid
 */
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

/**
 * Get short git commit hash (7 chars).
 * @returns Commit hash or null if not in a git repo
 */
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

/**
 * Resolve application version for build output.
 *
 * Priority:
 * 1. BUILD_VERSION environment variable
 * 2. package.json version field
 * 3. Fallback: "0.0.0" (dev) or "1.0.0" (production)
 *
 * In dev mode, appends git commit hash: "{version}-dev.{commit}"
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Userscript metadata generation (inlined from tooling/vite/userscript/metadata.ts)
// ─────────────────────────────────────────────────────────────────────────────

function formatMetaLine(key: string, value: string): string {
  return `// @${key} ${value}`;
}

function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((v) => formatMetaLine(key, v));
}

/**
 * Build the complete `==UserScript==` metadata block as a string.
 * @param config - Complete userscript metadata
 * @returns Formatted userscript header block
 */
function buildMetadataBlock(config: UserscriptMeta): string {
  const currentYear = new Date().getUTCFullYear();
  const copyrightRange = currentYear <= 2024 ? '2024' : `2024-${currentYear}`;
  const lines = [
    '// ==UserScript==',
    formatMetaLine('name', config.name),
    formatMetaLine('namespace', config.namespace),
    formatMetaLine('version', config.version),
    formatMetaLine('description', config.description),
    formatMetaLine('author', config.author),
    formatMetaLine('license', config.license),
    `// Copyright (c) ${copyrightRange} PiesP`,
    ...(config.homepageURL ? [formatMetaLine('homepageURL', config.homepageURL)] : []),
    ...formatMetaLines('match', config.match),
    ...formatMetaLines('grant', config.grant),
    ...formatMetaLines('connect', config.connect),
    formatMetaLine('run-at', config.runAt),
    formatMetaLine('supportURL', config.supportURL),
    formatMetaLine('downloadURL', config.downloadURL),
    formatMetaLine('updateURL', config.updateURL),
    ...(config.icon ? [formatMetaLine('icon', config.icon)] : []),
    ...(config.compatible
      ? Object.entries(config.compatible).map(([browser, version]) =>
          formatMetaLine('compatible', `${browser} ${version}+`)
        )
      : []),
    ...(config.require?.length ? formatMetaLines('require', config.require) : []),
    ...(config.noframes ? ['// @noframes'] : []),
    '// ==/UserScript==',
  ];
  return lines.join('\n');
}

/**
 * Generate the full userscript header including metadata block.
 * @param args.version - Resolved version string
 * @param args.isDev - Whether this is a development build
 * @returns Formatted userscript header with `==UserScript==` block
 */
function generateUserscriptHeader(args: { version: string; isDev: boolean }): string {
  const fileName = args.isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;
  const nameSuffix = args.isDev ? ' (Dev)' : '';

  const config: UserscriptMeta = {
    ...USERSCRIPT_CONFIG,
    name: `${USERSCRIPT_CONFIG.name}${nameSuffix}`,
    version: args.version,
    downloadURL: `${CDN_BASE_URL}/${fileName}`,
    updateURL: `${CDN_BASE_URL}/${metaFileName}`,
  };

  return buildMetadataBlock(config);
}

/**
 * Generate a minimal metadata-only header (no full bundle code) for update checking.
 * @param version - Resolved version string
 * @returns Minimal `==UserScript==` block with download/update URLs
 */
function generateMetaOnlyHeader(version: string): string {
  const fileName = OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;

  const lines = [
    '// ==UserScript==',
    formatMetaLine('name', USERSCRIPT_CONFIG.name),
    formatMetaLine('namespace', USERSCRIPT_CONFIG.namespace),
    formatMetaLine('version', version),
    formatMetaLine('downloadURL', `${CDN_BASE_URL}/${fileName}`),
    formatMetaLine('updateURL', `${CDN_BASE_URL}/${metaFileName}`),
    '// ==/UserScript==',
  ];

  return lines.join('\n');
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

  return {
    plugins: [
      solidPlugin({
        solid: {
          omitNestedClosingTags: isProd,
        },
      }),
      cssInlinePlugin(),
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
      cssMinify: isProd ? 'lightningcss' : false,

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

// ─────────────────────────────────────────────────────────────────────────────
// CSS Inline Plugin (inlined from tooling/vite/plugins/css-inline.ts)
// ─────────────────────────────────────────────────────────────────────────────

function cssInlinePlugin(): Plugin {
  return {
    name: 'css-inline',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      const cssChunks: string[] = [];

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (!fileName.endsWith('.css') || asset.type !== 'asset') continue;
        const source = (asset as { source?: string | Uint8Array }).source;
        if (typeof source === 'string') {
          cssChunks.push(source);
        } else if (source instanceof Uint8Array) {
          cssChunks.push(new TextDecoder().decode(source));
        }
        delete bundle[fileName];
      }

      const css = cssChunks.join('');
      if (!css.trim()) return;

      const id = JSON.stringify(STYLE_ID);
      const code = JSON.stringify(css);
      const injectionCode = `(function(){if(typeof document==='undefined')return;var e=document.getElementById(${id});if(!e){e=document.createElement('style');e.id=${id};document.head.appendChild(e);}e.textContent=${code};})();\n`;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = injectionCode + chunk.code;
          break;
        }
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Summary Plugin (inlined from tooling/vite/userscript-header.ts)
// ─────────────────────────────────────────────────────────────────────────────

function buildSummaryPlugin(opts: {
  isDev: boolean;
  version: string;
  config: BuildModeConfig;
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
      info.forEach((line) => {
        console.log(`   ${line}`);
      });
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

      // Single-file bundle guard: fail if unexpected files appear in dist/
      const expectedFiles = new Set([
        bundleName,
        ...(config.sourceMap && config.sourceMap !== 'inline' ? [`${bundleName}.map`] : []),
        OUTPUT_FILE_NAMES.meta,
      ]);
      const actualDist = readdirSync('dist');
      const unexpected = actualDist.filter((f) => !expectedFiles.has(f));
      if (unexpected.length > 0) {
        throw new Error(
          `Unexpected files in dist/: ${unexpected.join(', ')}. ` +
            `Expected only: ${[...expectedFiles].join(', ')}. ` +
            `Check for url() references, ?url imports, or new URL() patterns.`
        );
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Meta-Only Plugin (inlined from tooling/vite/plugins/meta-only.ts)
// ─────────────────────────────────────────────────────────────────────────────

function metaOnlyPlugin(version: string): Plugin {
  return {
    name: 'meta-only-file',
    apply: 'build',
    enforce: 'post',
    writeBundle(options): void {
      const outDir = (options as { dir?: string }).dir ?? 'dist';
      const metaContent = generateMetaOnlyHeader(version);
      const metaPath = resolve(outDir, OUTPUT_FILE_NAMES.meta);
      writeFileSync(metaPath, metaContent, 'utf8');
      console.log(`\ud83d\udcc4 Meta-only file generated: ${OUTPUT_FILE_NAMES.meta}`);
    },
  };
}
