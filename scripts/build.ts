/// <reference lib="deno.ns" />
/**
 * Deno Build Script for X.com Enhanced Gallery Userscript
 *
 * Uses Vite with vite-plugin-solid for bundling SolidJS code.
 * Based on: https://deno.com/blog/build-solidjs-with-deno
 *
 * Quality checks are enforced before bundling:
 * - Type checking (deno check)
 * - Linting (deno lint)
 * - Format checking (deno fmt --check)
 *
 * Usage:
 *   deno task build              # Production build with quality checks
 *   deno task build:dev          # Development build with quality checks
 *   deno task build:fast         # Production build without quality checks
 *   deno task build:dev:fast     # Development build without quality checks
 */

import { resolve } from 'node:path';
import solidPlugin from 'npm:vite-plugin-solid@^2.11.0';
import { build as viteBuild, type InlineConfig, type Plugin } from 'npm:vite@^6.0.0';
import { aggregateLicenses } from './license-aggregator.ts';
import { generateUserscriptMeta, type UserscriptConfig } from './userscript-meta.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DIST_DIR = './dist' as const;
const ENTRY_POINT = './src/main.ts' as const;
const LICENSES_DIR = './LICENSES' as const;
const STYLE_ID = 'xeg-injected-styles' as const;

const OUTPUT_FILE_NAMES = {
  dev: 'xcom-enhanced-gallery.dev.user.js',
  prod: 'xcom-enhanced-gallery.user.js',
} as const;

// Path aliases configuration (shared between Vite and TypeScript)
const PATH_ALIASES = {
  '@': 'src',
  '@bootstrap': 'src/bootstrap',
  '@constants': 'src/constants',
  '@features': 'src/features',
  '@shared': 'src/shared',
  '@styles': 'src/styles',
  '@types': 'src/types',
} as const;

// Userscript configuration (static parts)
const USERSCRIPT_BASE_CONFIG = {
  name: 'X.com Enhanced Gallery',
  namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
  description: 'Media viewer and download functionality for X.com',
  author: 'PiesP',
  license: 'MIT',
  match: ['https://*.x.com/*'],
  grant: [
    'GM_setValue',
    'GM_getValue',
    'GM_download',
    'GM_notification',
    'GM_xmlhttpRequest',
  ],
  connect: ['pbs.twimg.com', 'video.twimg.com', 'api.twitter.com'],
  runAt: 'document-idle',
  supportURL: 'https://github.com/PiesP/xcom-enhanced-gallery/issues',
  noframes: true,
} as const satisfies Partial<UserscriptConfig>;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BuildOptions {
  readonly dev: boolean;
  readonly version?: string;
  readonly skipChecks: boolean;
}

interface BundleResult {
  readonly code: string;
  readonly sourceMap?: string;
}

interface CommandResult {
  readonly success: boolean;
  readonly description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Processing Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove CSS comments for production builds
 * Preserves layer declarations and CSS structure
 */
function removeCssComments(css: string): string {
  // Remove block comments /* ... */ but preserve @layer declarations
  // Use a state machine approach to handle edge cases
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';

  while (i < css.length) {
    // Handle string literals (to avoid removing "/*" inside strings)
    if (!inString && (css[i] === '"' || css[i] === "'")) {
      inString = true;
      stringChar = css[i];
      result += css[i];
      i++;
      continue;
    }

    if (inString) {
      if (css[i] === stringChar && css[i - 1] !== '\\') {
        inString = false;
      }
      result += css[i];
      i++;
      continue;
    }

    // Check for block comment start
    if (css[i] === '/' && css[i + 1] === '*') {
      // Find comment end
      const commentEnd = css.indexOf('*/', i + 2);
      if (commentEnd === -1) {
        // Malformed CSS, keep rest as is
        break;
      }
      // Skip the entire comment
      i = commentEnd + 2;
      // Add a space to prevent selector merging issues
      if (
        result.length > 0 && result[result.length - 1] !== ' ' && result[result.length - 1] !== '\n'
      ) {
        result += ' ';
      }
      continue;
    }

    result += css[i];
    i++;
  }

  // Clean up excessive whitespace while preserving structure
  return result
    // Multiple spaces to single space
    .replace(/  +/g, ' ')
    // Multiple newlines to single newline
    .replace(/\n\s*\n/g, '\n')
    // Remove leading/trailing whitespace on lines
    .replace(/^\s+/gm, '')
    .replace(/\s+$/gm, '')
    // Trim
    .trim();
}

/**
 * CSS variable shortening map for production builds
 * Maps verbose --xeg-* variable names to short 3-4 character names
 * Organized by category for maintainability
 */
const CSS_VAR_SHORTENING_MAP: Record<string, string> = {
  // Easing/Animation (--xeg-e*)
  '--xeg-ease-standard': '--xe-s',
  '--xeg-ease-decelerate': '--xe-d',
  '--xeg-ease-accelerate': '--xe-a',
  '--xeg-ease-entrance': '--xe-e',
  '--xeg-easing-ease-out': '--xeo',
  '--xeg-easing-ease-in': '--xei',
  '--xeg-easing-linear': '--xel',

  // Duration (--xeg-d*)
  '--xeg-duration': '--xd',
  '--xeg-duration-fast': '--xdf',
  '--xeg-duration-normal': '--xdn',
  '--xeg-duration-slow': '--xds',
  '--xeg-duration-toolbar': '--xdt',

  // Transitions (--xeg-t*)
  '--xeg-transition-interaction-fast': '--xti',
  '--xeg-transition-surface-fast': '--xts',
  '--xeg-transition-surface-normal': '--xtsn',
  '--xeg-transition-elevation-fast': '--xtef',
  '--xeg-transition-elevation-normal': '--xten',
  '--xeg-transition-width-normal': '--xtwn',
  '--xeg-transition-opacity': '--xto',
  '--xeg-transition-toolbar': '--xtt',

  // Colors - Text (--xeg-color-text-*)
  '--xeg-color-text-primary': '--xct-p',
  '--xeg-color-text-secondary': '--xct-s',
  '--xeg-color-text-tertiary': '--xct-t',
  '--xeg-color-text-inverse': '--xct-i',

  // Colors - Border (--xeg-color-border-*)
  '--xeg-color-border-primary': '--xcb-p',
  '--xeg-color-border-hover': '--xcb-h',
  '--xeg-color-border-strong': '--xcb-s',

  // Colors - Background (--xeg-color-bg-*)
  '--xeg-color-bg-primary': '--xcbg-p',
  '--xeg-color-bg-secondary': '--xcbg-s',

  // Colors - Semantic (--xeg-color-*)
  '--xeg-color-primary': '--xc-p',
  '--xeg-color-primary-hover': '--xc-ph',
  '--xeg-color-success': '--xc-s',
  '--xeg-color-success-hover': '--xc-sh',
  '--xeg-color-error': '--xc-e',
  '--xeg-color-error-hover': '--xc-eh',
  '--xeg-color-overlay-medium': '--xc-om',
  '--xeg-color-surface-elevated': '--xc-se',
  '--xeg-color-background': '--xc-bg',

  // Colors - Neutral (--xeg-color-neutral-*)
  '--xeg-color-neutral-100': '--xcn1',
  '--xeg-color-neutral-200': '--xcn2',
  '--xeg-color-neutral-300': '--xcn3',
  '--xeg-color-neutral-400': '--xcn4',
  '--xeg-color-neutral-500': '--xcn5',

  // Spacing (--xeg-spacing-*)
  '--xeg-spacing-xs': '--xs-xs',
  '--xeg-spacing-sm': '--xs-s',
  '--xeg-spacing-md': '--xs-m',
  '--xeg-spacing-lg': '--xs-l',
  '--xeg-spacing-xl': '--xs-xl',
  '--xeg-spacing-2xl': '--xs-2',
  '--xeg-spacing-3xl': '--xs-3',
  '--xeg-spacing-5xl': '--xs-5',

  // Radius (--xeg-radius-*)
  '--xeg-radius-xs': '--xr-xs',
  '--xeg-radius-sm': '--xr-s',
  '--xeg-radius-md': '--xr-m',
  '--xeg-radius-lg': '--xr-l',
  '--xeg-radius-xl': '--xr-xl',
  '--xeg-radius-2xl': '--xr-2',
  '--xeg-radius-full': '--xr-f',

  // Font (--xeg-font-*)
  '--xeg-font-size-sm': '--xfs-s',
  '--xeg-font-size-base': '--xfs-b',
  '--xeg-font-size-md': '--xfs-m',
  '--xeg-font-size-lg': '--xfs-l',
  '--xeg-font-size-2xl': '--xfs-2',
  '--xeg-font-weight-medium': '--xfw-m',
  '--xeg-font-weight-semibold': '--xfw-s',
  '--xeg-font-family-ui': '--xff-u',
  '--xeg-line-height-normal': '--xlh',

  // Z-index (--xeg-z-*)
  '--xeg-z-gallery': '--xz-g',
  '--xeg-z-gallery-overlay': '--xz-go',
  '--xeg-z-gallery-toolbar': '--xz-gt',
  '--xeg-z-toolbar': '--xz-t',
  '--xeg-z-toolbar-hover-zone': '--xz-th',
  '--xeg-z-toolbar-panel': '--xz-tp',
  '--xeg-z-toolbar-panel-active': '--xz-ta',
  '--xeg-z-overlay': '--xz-o',
  '--xeg-z-modal': '--xz-m',
  '--xeg-z-modal-backdrop': '--xz-mb',
  '--xeg-z-modal-foreground': '--xz-mf',
  '--xeg-z-tooltip': '--xz-tt',
  '--xeg-z-stack-base': '--xz-sb',
  '--xeg-layer-root': '--xlr',

  // Toolbar (--xeg-toolbar-*)
  '--xeg-toolbar-surface': '--xt-s',
  '--xeg-toolbar-border': '--xt-b',
  '--xeg-toolbar-bg': '--xt-bg',
  '--xeg-toolbar-panel-surface': '--xtp-s',
  '--xeg-toolbar-panel-transition': '--xtp-t',
  '--xeg-toolbar-panel-height': '--xtp-h',
  '--xeg-toolbar-panel-max-height': '--xtp-mh',
  '--xeg-toolbar-panel-shadow': '--xtp-sh',
  '--xeg-toolbar-text-color': '--xtt-c',
  '--xeg-toolbar-text-muted': '--xtt-m',
  '--xeg-toolbar-element-bg': '--xte-b',
  '--xeg-toolbar-element-bg-strong': '--xte-bs',
  '--xeg-toolbar-element-border': '--xte-br',
  '--xeg-toolbar-progress-track': '--xtp-pt',
  '--xeg-toolbar-scrollbar-track': '--xts-t',
  '--xeg-toolbar-scrollbar-thumb': '--xts-th',
  '--xeg-toolbar-shadow': '--xt-sh',
  '--xeg-toolbar-hover-zone-bg': '--xth-bg',
  '--xeg-toolbar-hidden-opacity': '--xth-o',
  '--xeg-toolbar-hidden-visibility': '--xth-v',
  '--xeg-toolbar-hidden-pointer-events': '--xth-pe',

  // Button (--xeg-button-*)
  '--xeg-button-lift': '--xb-l',
  '--xeg-button-bg': '--xb-bg',
  '--xeg-button-border': '--xb-b',
  '--xeg-button-text': '--xb-t',
  '--xeg-button-bg-hover': '--xb-bgh',
  '--xeg-button-border-hover': '--xb-bh',
  '--xeg-button-disabled-opacity': '--xb-do',
  '--xeg-button-square-size': '--xb-ss',
  '--xeg-button-square-padding': '--xb-sp',

  // Size (--xeg-size-*)
  '--xeg-size-button-sm': '--xsb-s',
  '--xeg-size-button-md': '--xsb-m',
  '--xeg-size-button-lg': '--xsb-l',

  // Surface (--xeg-surface-*)
  '--xeg-surface-bg': '--xsu-b',
  '--xeg-surface-border': '--xsu-br',
  '--xeg-surface-bg-hover': '--xsu-bh',

  // Gallery (--xeg-gallery-*)
  '--xeg-gallery-bg': '--xg-b',
  '--xeg-gallery-bg-light': '--xg-bl',
  '--xeg-gallery-bg-dark': '--xg-bd',

  // Modal (--xeg-modal-*)
  '--xeg-modal-bg': '--xm-b',
  '--xeg-modal-border': '--xm-br',
  '--xeg-modal-bg-light': '--xm-bl',
  '--xeg-modal-bg-dark': '--xm-bd',
  '--xeg-modal-border-light': '--xm-brl',
  '--xeg-modal-border-dark': '--xm-brd',

  // Spinner (--xeg-spinner-*)
  '--xeg-spinner-size': '--xsp-s',
  '--xeg-spinner-size-default': '--xsp-sd',
  '--xeg-spinner-border-width': '--xsp-bw',
  '--xeg-spinner-track-color': '--xsp-tc',
  '--xeg-spinner-indicator-color': '--xsp-ic',
  '--xeg-spinner-duration': '--xsp-d',
  '--xeg-spinner-easing': '--xsp-e',

  // Misc
  '--xeg-opacity-disabled': '--xo-d',
  '--xeg-hover-lift': '--xhl',
  '--xeg-focus-indicator-color': '--xfic',
  '--xeg-border-emphasis': '--xbe',
  '--xeg-border-button': '--xbb',
  '--xeg-skeleton-bg': '--xsk-b',
  '--xeg-scrollbar-width': '--xsw',
  '--xeg-scrollbar-border-radius': '--xsbr',
  '--xeg-hover-zone-height': '--xhzh',
  '--xeg-icon-size': '--xis',
  '--xeg-icon-stroke-width': '--xisw',
  '--xeg-icon-only-size': '--xios',
  '--xeg-gpu-hack': '--xgh',
  '--xeg-backface-visibility': '--xbv',
  '--xeg-bg-toolbar': '--xbgt',
  '--xeg-glass-border-strong': '--xgbs',
  '--xeg-viewport-height-constrained': '--xvhc',
  '--xeg-aspect-default': '--xad',

  // Settings
  '--xeg-settings-gap': '--xse-g',
  '--xeg-settings-padding': '--xse-p',
  '--xeg-settings-control-gap': '--xse-cg',
  '--xeg-settings-label-font-size': '--xse-lf',
  '--xeg-settings-label-font-weight': '--xse-lw',
  '--xeg-settings-select-font-size': '--xse-sf',
  '--xeg-settings-select-padding': '--xse-sp',

  // Gallery item intrinsic
  '--xeg-gallery-item-intrinsic-width': '--xgi-w',
  '--xeg-gallery-item-intrinsic-height': '--xgi-h',
  '--xeg-gallery-item-intrinsic-ratio': '--xgi-r',
  '--xeg-gallery-fit-height-target': '--xgf-ht',
};

/**
 * Shorten CSS variable names for production builds
 * Replaces verbose --xeg-* variable names with short 3-4 character alternatives
 * @param css - CSS content to process
 * @returns CSS with shortened variable names
 */
function shortenCssVariables(css: string): string {
  let result = css;

  // Sort by length (longest first) to prevent partial replacements
  const sortedEntries = Object.entries(CSS_VAR_SHORTENING_MAP)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [longName, shortName] of sortedEntries) {
    // Replace both var(--name) references and --name: declarations
    // Use global replace with word boundaries
    const escapedLong = longName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedLong, 'g');
    result = result.replace(regex, shortName);
  }

  return result;
}

/**
 * Compress CSS values for production builds (non-destructive minification)
 * - 0.0625rem → .0625rem (leading zero removal)
 * - 0px, 0rem, 0em → 0 (unit removal for zero values)
 * - Remove redundant semicolons before closing braces
 * - Collapse whitespace around : and ;
 */
function compressCssValues(css: string): string {
  return css
    // Remove leading zeros from decimal values (0.5 → .5)
    .replace(/\b0+\.(\d)/g, '.$1')
    // Remove units from zero values (0px → 0, 0rem → 0, 0em → 0)
    // But preserve 0% as it's sometimes needed
    .replace(/\b0(px|rem|em|vh|vw|vmin|vmax|ch|ex)\b/g, '0')
    // Remove space around colons (except in selectors)
    .replace(/\s*:\s*/g, ':')
    // Remove space around semicolons
    .replace(/\s*;\s*/g, ';')
    // Remove semicolon before closing brace
    .replace(/;}/g, '}')
    // Remove space before opening brace
    .replace(/\s*\{/g, '{')
    // Remove space after opening brace
    .replace(/\{\s*/g, '{')
    // Remove space before closing brace
    .replace(/\s*\}/g, '}')
    // Collapse multiple spaces to one
    .replace(/\s+/g, ' ')
    // Remove newlines entirely for maximum compression
    .replace(/\n/g, '')
    // Trim
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Inline Plugin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract CSS content from bundle assets
 * @param bundle - Vite bundle object
 * @param compress - Whether to compress CSS (production builds)
 */
function extractCssFromBundle(
  bundle: Record<string, { type: string; source?: string | Uint8Array }>,
  compress = false,
): string {
  const cssChunks: string[] = [];

  for (const [fileName, asset] of Object.entries(bundle)) {
    if (!fileName.endsWith('.css') || asset.type !== 'asset') continue;

    const { source } = asset;
    let cssContent = '';
    if (typeof source === 'string') {
      cssContent = source;
    } else if (source instanceof Uint8Array) {
      cssContent = new TextDecoder().decode(source);
    }

    // Process CSS in production mode
    if (compress && cssContent) {
      // First remove comments
      cssContent = removeCssComments(cssContent);
      // Then shorten variable names
      cssContent = shortenCssVariables(cssContent);
      // Finally compress values
      cssContent = compressCssValues(cssContent);
    }

    cssChunks.push(cssContent);

    // Remove CSS file from bundle
    delete bundle[fileName];
  }

  return cssChunks.join(compress ? '' : '\n');
}

/**
 * Generate CSS injection code for userscript
 * Uses single CSS variable to avoid duplication in if/else branches (~70KB savings)
 */
function generateCssInjectionCode(css: string, isDev: boolean): string {
  return `
(function() {
  'use strict';
  if (typeof document === 'undefined') return;

  var css = ${JSON.stringify(css)};

  // Prevent duplicate injection (userscript may reload)
  var existingStyle = document.getElementById('${STYLE_ID}');
  if (existingStyle) {
    existingStyle.textContent = css;
    return;
  }

  // Create style element with ID for tracking
  var style = document.createElement('style');
  style.id = '${STYLE_ID}';
  style.setAttribute('data-xeg-version', '${isDev ? 'dev' : 'prod'}');
  style.textContent = css;

  // Insert at the end of head for proper cascade order
  (document.head || document.documentElement).appendChild(style);
})();
`;
}

/**
 * Vite plugin to inline CSS into JavaScript bundle
 * Optimized for Tampermonkey/userscript environments:
 * - Prevents duplicate style injection
 * - CSP-safe style injection (no inline styles)
 * - Layer order preservation for CSS cascade
 * - CSS compression for production builds (comment stripping, value minification)
 */
function cssInlinePlugin(isDev = false): Plugin {
  return {
    name: 'css-inline',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      // Compress CSS in production mode only
      const compress = !isDev;
      const cssContent = extractCssFromBundle(
        bundle as Record<string, { type: string; source?: string | Uint8Array }>,
        compress,
      );

      if (!cssContent.trim()) return;

      // Find JS entry and inject CSS
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = generateCssInjectionCode(cssContent, isDev) + chunk.code;
          break;
        }
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Arguments
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): BuildOptions {
  const args = new Set(Deno.args);
  const versionArg = Deno.args.find((arg) => arg.startsWith('--version='));

  return {
    dev: args.has('--dev'),
    version: versionArg?.split('=')[1],
    skipChecks: args.has('--skip-checks') || args.has('--fast'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Version Resolution
// ─────────────────────────────────────────────────────────────────────────────

async function getVersionFromGit(): Promise<string | null> {
  try {
    const command = new Deno.Command('git', {
      args: ['describe', '--tags', '--abbrev=0'],
      stdout: 'piped',
      stderr: 'null',
    });
    const { stdout, success } = await command.output();

    if (!success) return null;

    const version = new TextDecoder().decode(stdout).trim();
    return version.startsWith('v') ? version.slice(1) : version;
  } catch {
    return null;
  }
}

async function getVersion(options: BuildOptions): Promise<string> {
  if (options.version) return options.version;

  const gitVersion = await getVersionFromGit();
  if (gitVersion) return gitVersion;

  return options.dev ? '0.0.0-dev' : '1.0.0';
}

// ─────────────────────────────────────────────────────────────────────────────
// File System Utilities
// ─────────────────────────────────────────────────────────────────────────────

async function ensureDistDir(): Promise<void> {
  await Deno.mkdir(DIST_DIR, { recursive: true }).catch((error) => {
    if (!(error instanceof Deno.errors.AlreadyExists)) throw error;
  });
}

async function cleanupCssFiles(): Promise<void> {
  try {
    for await (const entry of Deno.readDir(DIST_DIR)) {
      if (entry.name.endsWith('.css')) {
        await Deno.remove(`${DIST_DIR}/${entry.name}`);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quality Checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a command and return the result
 */
async function runCommand(
  command: string,
  args: readonly string[],
  description: string,
): Promise<CommandResult> {
  console.log(`🔍 ${description}...`);

  const cmd = new Deno.Command(command, {
    args: [...args],
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const { success } = await cmd.output();

  if (success) {
    console.log(`✅ ${description} passed`);
  } else {
    console.error(`❌ ${description} failed`);
  }

  return { success, description };
}

// Quality check definitions for parallel execution
const QUALITY_CHECKS = [
  {
    args: ['run', '-A', 'npm:typescript/tsc', '--noEmit', '--project', 'tsconfig.build.json'],
    description: 'Type checking',
  },
  {
    args: ['lint'],
    description: 'Linting',
  },
  {
    args: ['fmt', '--check'],
    description: 'Format checking',
  },
] as const;

/**
 * Run all quality checks in parallel
 */
async function runQualityChecks(): Promise<boolean> {
  console.log('📋 Running quality checks...\n');

  const results = await Promise.all(
    QUALITY_CHECKS.map(({ args, description }) => runCommand('deno', args, description)),
  );

  const allPassed = results.every((r) => r.success);

  if (allPassed) {
    console.log('\n✅ All quality checks passed!\n');
  } else {
    const failed = results.filter((r) => !r.success).map((r) => r.description);
    console.error(`\n❌ Failed checks: ${failed.join(', ')}`);

    if (failed.includes('Format checking')) {
      console.log('\n💡 Tip: Run "deno task fmt" to auto-fix formatting issues.\n');
    }
  }

  return allPassed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vite Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build path aliases for Vite resolve configuration
 */
function buildPathAliases(cwd: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(PATH_ALIASES).map(([alias, path]) => [alias, resolve(cwd, path)]),
  );
}

/**
 * Create Vite configuration for building
 * Optimized for Deno + Tampermonkey userscript environment
 */
function createViteConfig(isDev: boolean): InlineConfig {
  const cwd = Deno.cwd();
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;

  return {
    plugins: [solidPlugin(), cssInlinePlugin(isDev)],
    configFile: false,
    root: cwd,

    resolve: {
      alias: buildPathAliases(cwd),
    },

    build: {
      target: 'esnext',
      minify: false,
      sourcemap: isDev ? 'inline' : false,
      outDir: 'dist',
      emptyOutDir: false,
      write: true,
      cssCodeSplit: false,
      cssMinify: false,

      lib: {
        entry: resolve(cwd, ENTRY_POINT),
        name: 'XcomEnhancedGallery',
        formats: ['iife'],
        fileName: () => outputFileName.replace('.user.js', ''),
        cssFileName: 'style',
      },

      rollupOptions: {
        output: {
          entryFileNames: outputFileName,
          inlineDynamicImports: true,
          exports: 'named',
        },
      },
    },

    css: {
      modules: {
        generateScopedName: isDev ? '[name]__[local]__[hash:base64:5]' : 'xeg_[hash:base64:6]',
        localsConvention: 'camelCaseOnly',
        scopeBehaviour: 'local',
      },
      devSourcemap: isDev,
    },

    define: {
      __DEV__: JSON.stringify(isDev),
      'import.meta.env.MODE': JSON.stringify(isDev ? 'development' : 'production'),
      'import.meta.env.DEV': JSON.stringify(isDev),
      'import.meta.env.PROD': JSON.stringify(!isDev),
    },

    logLevel: 'warn',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bundling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bundle source code using Vite
 */
async function bundleWithVite(isDev: boolean): Promise<BundleResult> {
  const mode = isDev ? 'development' : 'production';
  console.log(`📦 Bundling with Vite (${mode})...`);

  const config = createViteConfig(isDev);
  await viteBuild(config);

  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const outputPath = `${DIST_DIR}/${outputFileName}`;

  // Read generated output and cleanup CSS
  const [code] = await Promise.all([
    Deno.readTextFile(outputPath),
    cleanupCssFiles(),
  ]);

  // Read sourcemap if in dev mode
  let sourceMap: string | undefined;
  if (isDev) {
    sourceMap = await Deno.readTextFile(`${outputPath}.map`).catch(() => undefined);
  }

  // Remove auto-generated sourceMappingURL (we'll manage it ourselves)
  return {
    code: code.replace(/\n?\/\/# sourceMappingURL=.*$/m, ''),
    sourceMap,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Userscript Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create userscript configuration with master branch URLs
 */
function createUserscriptConfig(version: string): UserscriptConfig {
  const baseUrl =
    `https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@master/dist/xcom-enhanced-gallery.user.js`;

  return {
    ...USERSCRIPT_BASE_CONFIG,
    version,
    downloadURL: baseUrl,
    updateURL: baseUrl,
  } as UserscriptConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Process
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Write final userscript output
 */
async function writeOutput(
  options: BuildOptions,
  bundleResult: BundleResult,
  metadata: string,
): Promise<{ path: string; sizeKB: string }> {
  const outputFileName = options.dev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const outputPath = `${DIST_DIR}/${outputFileName}`;

  // Add sourceMappingURL if source map exists
  let finalCode = bundleResult.code;
  if (options.dev && bundleResult.sourceMap) {
    finalCode += `\n//# sourceMappingURL=${outputFileName}.map\n`;
  }

  // Combine metadata and bundled code
  const userscript = `${metadata}\n${finalCode}`;

  // Write files in parallel
  const writePromises: Promise<void>[] = [Deno.writeTextFile(outputPath, userscript)];

  if (options.dev && bundleResult.sourceMap) {
    const sourceMapPath = `${outputPath}.map`;
    writePromises.push(Deno.writeTextFile(sourceMapPath, bundleResult.sourceMap));
    console.log(`🗺️  Source map: ${sourceMapPath}`);
  }

  await Promise.all(writePromises);

  const stat = await Deno.stat(outputPath);
  return {
    path: outputPath,
    sizeKB: (stat.size / 1024).toFixed(2),
  };
}

async function build(): Promise<void> {
  const startTime = performance.now();
  const options = parseArgs();

  console.log('🚀 Starting X.com Enhanced Gallery build...\n');

  // Get version
  const version = await getVersion(options);
  console.log(`📌 Version: ${version}`);
  console.log(`🔧 Mode: ${options.dev ? 'Development' : 'Production'}`);
  console.log(`🔒 Quality checks: ${options.skipChecks ? 'Skipped' : 'Enabled'}\n`);

  // Run quality checks unless skipped
  if (!options.skipChecks) {
    const checksPass = await runQualityChecks();
    if (!checksPass) {
      console.error('❌ Build aborted due to quality check failures.');
      console.log('\n💡 Tips:');
      console.log('   • Run "deno task check" to see type errors');
      console.log('   • Run "deno task lint" to see lint errors');
      console.log('   • Run "deno task fmt" to auto-fix formatting');
      console.log('   • Use "--skip-checks" or "--fast" to bypass checks\n');
      Deno.exit(1);
    }
  }

  // Run parallel tasks: ensure dist dir, bundle, aggregate licenses
  await ensureDistDir();

  const [bundleResult, licenses] = await Promise.all([
    bundleWithVite(options.dev),
    aggregateLicenses(LICENSES_DIR),
  ]);

  // Generate userscript
  const config = createUserscriptConfig(version);
  const metadata = generateUserscriptMeta(config, licenses);

  // Write output
  const { path, sizeKB } = await writeOutput(options, bundleResult, metadata);

  const duration = ((performance.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✅ Build complete!`);
  console.log(`📄 Output: ${path}`);
  console.log(`📊 Size: ${sizeKB} KB`);
  console.log(`⏱️  Duration: ${duration}s\n`);
}

// Run build
if (import.meta.main) {
  try {
    await build();
  } catch (error) {
    console.error('❌ Build failed:', error);
    Deno.exit(1);
  }
}
