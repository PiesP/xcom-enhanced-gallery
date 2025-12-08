/**
 * Shared constants and types for build scripts
 */

// ─────────────────────────────────────────────────────────────────────────────
// Build Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const BUILD_CONFIG = {
  /** Output directory for built files */
  distDir: './dist',
  /** Directory containing third-party license files */
  licensesDir: './LICENSES',
  /** Vite configuration file path */
  viteConfig: './vite.config.ts',
} as const;

export const OUTPUT_FILES = {
  dev: 'xcom-enhanced-gallery.dev.user.js',
  prod: 'xcom-enhanced-gallery.user.js',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Userscript Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const USERSCRIPT_CONFIG = {
  name: 'X.com Enhanced Gallery',
  namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
  description: 'Media viewer and download functionality for X.com',
  author: 'PiesP',
  license: 'MIT',
  match: ['https://*.x.com/*'],
  grant: ['GM_setValue', 'GM_getValue', 'GM_download', 'GM_notification', 'GM_xmlhttpRequest'],
  connect: ['pbs.twimg.com', 'video.twimg.com', 'api.twitter.com'],
  runAt: 'document-idle' as const,
  supportURL: 'https://github.com/PiesP/xcom-enhanced-gallery/issues',
  noframes: true,
  /** CDN base URL for updates */
  cdnBaseUrl:
    'https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@master/dist/xcom-enhanced-gallery.user.js',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildOptions {
  readonly dev: boolean;
  readonly version?: string;
  readonly skipChecks: boolean;
}

export interface BundleResult {
  readonly code: string;
  readonly sourceMap?: string;
}

export interface CommandResult {
  readonly success: boolean;
  readonly description: string;
}

export interface LicenseInfo {
  readonly name: string;
  readonly text: string;
}

export interface UserscriptConfig {
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
  readonly downloadURL: string;
  readonly updateURL: string;
  readonly noframes: boolean;
  readonly icon?: string;
  readonly require?: readonly string[];
}
