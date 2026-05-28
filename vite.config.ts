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
  icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
  noframes: true,
  compatible: BROWSER_COMPATIBILITY,
} as const satisfies UserscriptBaseConfig;

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

const CURRENT_PROJECT_YEAR = new Date().getUTCFullYear();
const PROJECT_COPYRIGHT_RANGE =
  CURRENT_PROJECT_YEAR <= 2024 ? '2024' : `2024-${CURRENT_PROJECT_YEAR}`;

function formatMetaLine(key: string, value: string): string {
  return `// @${key} ${value}`;
}

function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((v) => formatMetaLine(key, v));
}

function buildMetadataBlock(config: UserscriptMeta): string {
  const lines = [
    '// ==UserScript==',
    formatMetaLine('name', config.name),
    formatMetaLine('namespace', config.namespace),
    formatMetaLine('version', config.version),
    formatMetaLine('description', config.description),
    formatMetaLine('author', config.author),
    formatMetaLine('license', config.license),
    `// Copyright (c) ${PROJECT_COPYRIGHT_RANGE} PiesP`,
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

function generateUserscriptHeader(args: { version: string; isDev: boolean }): string {
  const fileName = args.isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;
  const nameSuffix = args.isDev ? ' (Dev)' : '';

  const config: UserscriptMeta = {
    ...USERSCRIPT_CONFIG,
    name: `${USERSCRIPT_CONFIG.name}${nameSuffix}`,
    version: args.version,
    grant: USERSCRIPT_CONFIG.grant,
    connect: USERSCRIPT_CONFIG.connect,
    downloadURL: `${CDN_BASE_URL}/${fileName}`,
    updateURL: `${CDN_BASE_URL}/${metaFileName}`,
  };

  return buildMetadataBlock(config);
}

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
      target: 'esnext',
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
