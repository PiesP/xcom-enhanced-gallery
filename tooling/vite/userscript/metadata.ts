// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Userscript metadata generation and analysis utilities.
 *
 * Generates userscript headers with metadata directives (at-grant, at-connect, etc.).
 * Supports auto-detection of used permissions by scanning bundle code.
 * Handles license block generation with MIT license formatting.
 */

import type { UserscriptMeta } from '../constants';
import { CDN_BASE_URL, OUTPUT_FILE_NAMES, USERSCRIPT_CONFIG } from '../constants';

const CURRENT_PROJECT_YEAR = new Date().getUTCFullYear();
const PROJECT_COPYRIGHT_RANGE =
  CURRENT_PROJECT_YEAR <= 2024 ? '2024' : `2024-${CURRENT_PROJECT_YEAR}`;

/**
 * Formats a single metadata directive as a userscript comment line.
 *
 * @param key - Metadata key without at-prefix (e.g., 'name', 'version')
 * @param value - Metadata value to format
 * @returns Formatted line as `// @key value`
 * @internal
 */
function formatMetaLine(key: string, value: string): string {
  return `// @${key} ${value}`;
}

/**
 * Formats multiple metadata values into multiple comment lines.
 *
 * @param key - Metadata key without at-prefix
 * @param values - Array of values to format (one per line)
 * @returns Array of formatted lines as `// @key value`
 * @internal
 */
function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((v) => formatMetaLine(key, v));
}

/**
 * Formats a single metadata directive as a userscript comment line.
 *
 * Generates the standard userscript header including at-name, at-version, at-grant,
 * at-connect, and other metadata directives in the correct order.
 *
 * @param config - Userscript metadata configuration
 * @returns Formatted metadata block as a string
 * @internal
 */
function buildMetadataBlock(config: UserscriptMeta): string {
  const lines = [
    '// ==UserScript==',
    formatMetaLine('name', config.name),
    formatMetaLine('namespace', config.namespace),
    formatMetaLine('version', config.version),
    formatMetaLine('description', config.description),
    formatMetaLine('author', config.author),
    formatMetaLine('license', config.license),
    // MIT requires that the copyright notice is included in all copies.
    // Keep it as a plain comment line to avoid relying on non-standard metadata keys.
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

/**
 * Generates the complete userscript header for the main bundle.
 *
 * Combines metadata directives. Third-party licenses are not inlined;
 * see LICENSES/ directory in the repository.
 *
 * @param args - Header generation options
 * @param args.version - Semantic version string
 * @param args.isDev - True if development build (affects name suffix and URL paths)
 * @returns Complete userscript header ready for injection into bundle
 */
export function generateUserscriptHeader(args: { version: string; isDev: boolean }): string {
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

/**
 * Generates a minimal userscript metadata header for .meta.js distribution.
 *
 * Used for hosting on script update registries (Greasy Fork, etc.).
 * Includes only essential directives for update checks and downloads.
 *
 * @param version - Semantic version string
 * @returns Minimal userscript metadata header as a string
 */
export function generateMetaOnlyHeader(version: string): string {
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
