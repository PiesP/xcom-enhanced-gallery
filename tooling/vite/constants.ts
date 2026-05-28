// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Build configuration constants for Vite userscript bundler.
 *
 * Defines file output names, CDN base URLs, userscript metadata configuration,
 * browser compatibility requirements, and license mapping for distribution.
 */

/**
 * Configuration options for build mode optimization (development vs production).
 *
 * @property cssCompress - Enable CSS minification and compression
 * @property cssClassNamePattern - Regex pattern for renaming CSS class names
 * @property sourceMap - Include source maps (inline or file-based)
 */
export interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | 'inline';
}

/**
 * Complete userscript metadata for header generation.
 *
 * Includes all directives required by userscript managers (GM_*, TM_*) and
 * project-specific metadata (name, version, homepage, etc.).
 *
 * @property name - Userscript display name
 * @property namespace - Unique namespace for script identification
 * @property version - Semantic version number
 * @property description - Short script description
 * @property author - Script author name(s)
 * @property license - SPDX license identifier
 * @property match - URL patterns where script should run
 * @property grant - Userscript API permissions (GM_* functions)
 * @property connect - Hostnames permitted for GM_xmlhttpRequest
 * @property runAt - Injection timing (document-start|end|idle)
 * @property supportURL - Bug report or support page URL
 * @property homepageURL - Project homepage (optional)
 * @property downloadURL - Update check and install URL
 * @property updateURL - Version check and manifest URL
 * @property noframes - Disable script in frame elements
 * @property icon - Icon URL for script manager display (optional)
 * @property require - External library URLs (optional)
 * @property compatible - Browser compatibility declarations (optional)
 */
export interface UserscriptMeta {
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

/**
 * Base userscript configuration excluding runtime-generated fields.
 *
 * Omits `version`, `downloadURL`, and `updateURL` which are generated
 * from build configuration and environment at build time.
 */
export type UserscriptBaseConfig = Omit<UserscriptMeta, 'version' | 'downloadURL' | 'updateURL'>;

/**
 * Build mode configuration map.
 *
 * Defines optimization settings for development and production builds.
 * - development: Readable class names, no compression, source maps enabled
 * - production: Hashed class names, full compression, no source maps
 */
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

/**
 * Resolve build mode configuration from Vite mode string.
 *
 * @param mode - Vite build mode (e.g., 'development', 'production')
 * @returns BuildModeConfig for the given mode
 */
export function getBuildModeConfig(mode: string): BuildModeConfig {
  return BUILD_MODE_CONFIGS[mode === 'development' ? 'development' : 'production'];
}

/**
 * ID for injected style element in DOM.
 *
 * Used to identify and manage the global CSS injected by the userscript.
 */
export const STYLE_ID = 'xeg-injected-styles' as const;

/**
 * Output file names for production and development builds.
 *
 * - `dev`: Development bundle with source maps and readable class names
 * - `prod`: Production bundle optimized for size
 * - `meta`: Metadata-only file for update checks
 */
export const OUTPUT_FILE_NAMES = {
  dev: 'xcom-enhanced-gallery.dev.user.js',
  prod: 'xcom-enhanced-gallery.user.js',
  meta: 'xcom-enhanced-gallery.meta.js',
} as const;

/**
 * Base URL for CDN-hosted userscript and update files.
 *
 * Points to the jsdelivr CDN distribution of the release branch.
 * Used for updateURL and downloadURL in userscript metadata.
 */
export const CDN_BASE_URL =
  'https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist' as const;

/**
 * Minimum browser version requirements for the userscript.
 *
 * Specifies the oldest supported version for each major browser.
 * Used in userscript metadata @compatible directives.
 */
const BROWSER_COMPATIBILITY = {
  chrome: '117',
  firefox: '119',
  edge: '117',
  safari: '17',
} as const;

/**
 * Complete userscript metadata configuration.
 *
 * Includes name, version, match patterns, required permissions (grants),
 * target hosts (connects), and compatibility information.
 * Used to generate userscript headers for all builds.
 */
export const USERSCRIPT_CONFIG = {
  name: 'X.com Enhanced Gallery',
  namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
  description: 'Media viewer and download functionality for X.com',
  author: 'PiesP',
  license: 'MIT',
  // Note: `https://*.x.com/*` does not match the root domain (`https://x.com/*`) in
  // common userscript managers. Include both to ensure the script runs on x.com.
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
