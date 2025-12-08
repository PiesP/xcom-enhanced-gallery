/// <reference lib="deno.ns" />
/**
 * Userscript Metadata Generator
 *
 * Generates the userscript header block with proper metadata format
 * and consolidated license information.
 */

import type { LicenseInfo, UserscriptConfig } from './shared/constants.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const KEY_PADDING = 12;

const LICENSE_NAME_MAP: Readonly<Record<string, string>> = {
  'solid-js': 'Solid.js',
  heroicons: 'Heroicons',
  'xcom-enhanced-gallery': 'X.com Enhanced Gallery',
};

const MIT_LICENSE_BODY = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

// ─────────────────────────────────────────────────────────────────────────────
// Metadata Formatting
// ─────────────────────────────────────────────────────────────────────────────

const formatLine = (key: string, value: string): string =>
  `// @${key.padEnd(KEY_PADDING)} ${value}`;

const formatLines = (key: string, values: readonly string[]): string[] =>
  values.map((v) => formatLine(key, v));

// ─────────────────────────────────────────────────────────────────────────────
// Metadata Generation
// ─────────────────────────────────────────────────────────────────────────────

function buildMetadataBlock(config: UserscriptConfig): string {
  const lines = [
    '// ==UserScript==',
    // Basic info
    formatLine('name', config.name),
    formatLine('namespace', config.namespace),
    formatLine('version', config.version),
    formatLine('description', config.description),
    formatLine('author', config.author),
    formatLine('license', config.license),
    // Permissions
    ...formatLines('match', config.match),
    ...formatLines('grant', config.grant),
    ...formatLines('connect', config.connect),
    // URLs
    formatLine('run-at', config.runAt),
    formatLine('supportURL', config.supportURL),
    formatLine('downloadURL', config.downloadURL),
    formatLine('updateURL', config.updateURL),
    // Optional
    ...(config.icon ? [formatLine('icon', config.icon)] : []),
    ...(config.require?.length ? formatLines('require', config.require) : []),
    ...(config.noframes ? ['// @noframes'] : []),
    '// ==/UserScript==',
  ];

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// License Block Generation
// ─────────────────────────────────────────────────────────────────────────────

interface MitCopyright {
  name: string;
  copyright: string;
}

function extractCopyright(text: string): string | null {
  const match = text.match(/Copyright\s*\(c\)\s*(.+)/i);
  return match?.[1]?.trim() ?? null;
}

function isMitLicense(text: string): boolean {
  return text.includes('MIT License') || text.includes('Permission is hereby granted');
}

function buildLicenseBlock(licenses: readonly LicenseInfo[]): string {
  if (licenses.length === 0) return '';

  const mitCopyrights: MitCopyright[] = [];
  const otherLicenses: LicenseInfo[] = [];

  // Categorize licenses
  for (const license of licenses) {
    if (isMitLicense(license.text)) {
      const copyright = extractCopyright(license.text);
      if (copyright) {
        mitCopyrights.push({ name: license.name, copyright });
      } else {
        otherLicenses.push(license);
      }
    } else {
      otherLicenses.push(license);
    }
  }

  const lines = [' * Third-Party Licenses', ' * ====================', ' *'];

  // Consolidated MIT block
  if (mitCopyrights.length > 0) {
    lines.push(' * MIT License', ' *');
    for (const { name, copyright } of mitCopyrights) {
      lines.push(` * Copyright (c) ${copyright} (${name})`);
    }
    lines.push(' *');
    for (const textLine of MIT_LICENSE_BODY.split('\n')) {
      lines.push(` * ${textLine}`);
    }
    if (otherLicenses.length > 0) {
      lines.push(' *', ' *');
    }
  }

  // Other licenses
  for (let i = 0; i < otherLicenses.length; i++) {
    const license = otherLicenses[i];
    if (!license) continue;

    lines.push(` * ${license.name}:`);
    for (const textLine of license.text.split('\n')) {
      lines.push(` * ${textLine}`);
    }
    if (i < otherLicenses.length - 1) {
      lines.push(' *', ' *');
    }
  }

  lines.push(' *');
  return ['/*', ...lines, ' */'].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate complete userscript metadata with license block
 */
export function generateUserscriptMeta(
  config: UserscriptConfig,
  licenses: readonly LicenseInfo[]
): string {
  const metaBlock = buildMetadataBlock(config);
  const licenseBlock = buildLicenseBlock(licenses);
  return licenseBlock ? `${metaBlock}\n${licenseBlock}` : metaBlock;
}

/**
 * Parse license name from filename
 * e.g., "solid-js-MIT.txt" -> "Solid.js"
 */
export function parseLicenseName(filename: string): string {
  const base = filename.replace(/\.(txt|md)$/i, '').replace(/-(MIT|LICENSE|APACHE|BSD)$/i, '');
  return LICENSE_NAME_MAP[base] ?? base;
}
