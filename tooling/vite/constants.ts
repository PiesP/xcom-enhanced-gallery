/**
 * @fileoverview Build configuration constants for Vite userscript bundler.
 *
 * Defines file output names, CDN base URLs, userscript metadata configuration,
 * browser compatibility requirements, and license mapping for distribution.
 */

import type { UserscriptBaseConfig } from './types';

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
 * Output file names for license and attribution documentation.
 *
 * - `project`: Project root LICENSE file path
 * - `thirdPartyDir`: Directory for third-party license files
 * - `combined`: Combined license file for distribution
 */
export const LICENSE_OUTPUT_FILES = {
  project: 'LICENSE',
  thirdPartyDir: 'LICENSES',
  combined: 'LICENSES.txt',
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

/**
 * Mapping from package/directory names to display names for licenses.
 *
 * Used when aggregating third-party license information for documentation.
 * Maps package identifiers to human-readable names shown to users.
 */
export const LICENSE_NAME_MAP: Record<string, string> = {
  'solid-js': 'Solid.js',
  lucide: 'Lucide',
  'lucide-ISC': 'Lucide',
  'xcom-enhanced-gallery': 'X.com Enhanced Gallery',
};
