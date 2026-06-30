// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Userscript metadata generation utilities.
 *
 * Provides functions to format and generate the `==UserScript==` header
 * block for the X.com Enhanced Gallery userscript.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Complete userscript metadata for header generation.
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

/** Base userscript configuration excluding runtime-generated fields. */
export type UserscriptBaseConfig = Omit<UserscriptMeta, 'version' | 'downloadURL' | 'updateURL'>;

// ── Constants ────────────────────────────────────────────────────────────────

/** Output file names for production and development builds. */
export const OUTPUT_FILE_NAMES = {
  dev: 'xcom-enhanced-gallery.dev.user.js',
  prod: 'xcom-enhanced-gallery.user.js',
  meta: 'xcom-enhanced-gallery.meta.js',
} as const;

/** Base URL for CDN-hosted userscript and update files. */
export const CDN_BASE_URL =
  'https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist' as const;

/** Minimum browser version requirements for the userscript. */
const BROWSER_COMPATIBILITY = {
  chrome: '117',
  firefox: '119',
  edge: '117',
  safari: '17',
} as const;

/** Complete userscript metadata configuration. */
export const USERSCRIPT_CONFIG = {
  name: 'X.com Enhanced Gallery',
  namespace: 'https://github.com/PiesP/xcom-enhanced-gallery',
  description: 'Media viewer and download functionality for X.com',
  author: 'PiesP',
  license: 'MIT',
  match: ['https://x.com/*', 'https://twitter.com/*', 'https://*.x.com/*'],
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
  noframes: true,
  compatible: BROWSER_COMPATIBILITY,
} as const satisfies UserscriptBaseConfig;

// ── Formatting helpers ───────────────────────────────────────────────────────

export function formatMetaLine(key: string, value: string): string {
  return `// @${key} ${value}`;
}

export function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((v) => formatMetaLine(key, v));
}

// ── Metadata block generation ────────────────────────────────────────────────

/**
 * Build the complete `==UserScript==` metadata block as a string.
 * @param config - Complete userscript metadata
 * @returns Formatted userscript header block
 */
export function buildMetadataBlock(config: UserscriptMeta): string {
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

// ── Header generators ───────────────────────────────────────────────────────

/**
 * Generate the full userscript header including metadata block.
 * @param args.version - Resolved version string
 * @param args.isDev - Whether this is a development build
 * @param args.baseConfig - Base userscript configuration (without version/URLs)
 * @returns Formatted userscript header with `==UserScript==` block
 */
export function generateUserscriptHeader(args: {
  version: string;
  isDev: boolean;
  baseConfig: UserscriptBaseConfig;
}): string {
  const { version, isDev, baseConfig } = args;
  const fileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;
  const nameSuffix = isDev ? ' (Dev)' : '';

  const config: UserscriptMeta = {
    ...baseConfig,
    name: `${baseConfig.name}${nameSuffix}`,
    version,
    downloadURL: `${CDN_BASE_URL}/${fileName}`,
    updateURL: `${CDN_BASE_URL}/${metaFileName}`,
  };

  return buildMetadataBlock(config);
}

/**
 * Generate a minimal metadata-only header (no full bundle code) for update checking.
 * @param version - Resolved version string
 * @param baseConfig - Base userscript configuration (name and namespace)
 * @returns Minimal `==UserScript==` block with download/update URLs
 */
export function generateMetaOnlyHeader(
  version: string,
  baseConfig: Pick<UserscriptMeta, 'name' | 'namespace'>
): string {
  const fileName = OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;

  const lines = [
    '// ==UserScript==',
    formatMetaLine('name', baseConfig.name),
    formatMetaLine('namespace', baseConfig.namespace),
    formatMetaLine('version', version),
    formatMetaLine('downloadURL', `${CDN_BASE_URL}/${fileName}`),
    formatMetaLine('updateURL', `${CDN_BASE_URL}/${metaFileName}`),
    '// ==/UserScript==',
  ];

  return lines.join('\n');
}
