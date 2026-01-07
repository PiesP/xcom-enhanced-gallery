/**
 * @fileoverview Type definitions for Vite build configuration.
 *
 * Defines core types for build modes, license information, and userscript metadata
 * generation. These types support the build tooling pipeline for CSS processing,
 * license aggregation, and userscript header generation.
 */

/**
 * Configuration options for build mode optimization (development vs production).
 *
 * @property cssCompress - Enable CSS minification and compression
 * @property cssRemoveComments - Remove CSS comments during build
 * @property cssVariableShortening - Apply CSS custom property abbreviation
 * @property cssPruneUnusedCustomProperties - Remove unused CSS variables
 * @property cssValueMinify - Minify individual CSS property values
 * @property cssClassNamePattern - Regex pattern for renaming CSS class names
 * @property sourceMap - Include source maps (inline or file-based)
 */
export interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssRemoveComments: boolean;
  readonly cssVariableShortening: boolean;
  readonly cssPruneUnusedCustomProperties: boolean;
  readonly cssValueMinify: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | 'inline';
}

/**
 * License file metadata extracted during build aggregation.
 *
 * @property fileName - Original filename in LICENSES directory (e.g., "MIT.txt")
 * @property name - Normalized license name for display (e.g., "MIT")
 * @property text - Full license text content
 */
export interface LicenseInfo {
  readonly fileName: string;
  readonly name: string;
  readonly text: string;
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
