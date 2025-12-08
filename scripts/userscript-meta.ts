/**
 * Userscript Metadata Generator
 *
 * Generates the userscript header block with proper metadata format.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
  readonly resource?: Readonly<Record<string, string>>;
}

export interface LicenseInfo {
  readonly name: string;
  readonly text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Padding width for metadata key alignment */
const KEY_PADDING = 12;

/** License name mappings from filename patterns */
const LICENSE_NAME_MAP: Readonly<Record<string, string>> = {
  'solid-js': 'Solid.js',
  heroicons: 'Heroicons',
  'xcom-enhanced-gallery': 'X.com Enhanced Gallery',
};

/** Pattern to strip license type suffix from filename */
const LICENSE_SUFFIX_PATTERN = /-(MIT|LICENSE|APACHE|BSD)$/i;

/** Pattern to strip file extension */
const FILE_EXTENSION_PATTERN = /\.(txt|md)$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Metadata Line Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a single metadata line with aligned values
 */
function formatMetaLine(key: string, value: string): string {
  return `// @${key.padEnd(KEY_PADDING)} ${value}`;
}

/**
 * Format multiple metadata lines for array values
 */
function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((value) => formatMetaLine(key, value));
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate basic metadata section
 */
function generateBasicMeta(config: UserscriptConfig): string[] {
  return [
    formatMetaLine('name', config.name),
    formatMetaLine('namespace', config.namespace),
    formatMetaLine('version', config.version),
    formatMetaLine('description', config.description),
    formatMetaLine('author', config.author),
    formatMetaLine('license', config.license),
  ];
}

/**
 * Generate URL metadata section
 */
function generateUrlMeta(config: UserscriptConfig): string[] {
  const lines = [
    formatMetaLine('run-at', config.runAt),
    formatMetaLine('supportURL', config.supportURL),
    formatMetaLine('downloadURL', config.downloadURL),
    formatMetaLine('updateURL', config.updateURL),
  ];

  if (config.icon) {
    lines.push(formatMetaLine('icon', config.icon));
  }

  return lines;
}

/**
 * Generate optional metadata section
 */
function generateOptionalMeta(config: UserscriptConfig): string[] {
  const lines: string[] = [];

  if (config.require?.length) {
    lines.push(...formatMetaLines('require', config.require));
  }

  if (config.resource) {
    for (const [name, url] of Object.entries(config.resource)) {
      lines.push(formatMetaLine('resource', `${name} ${url}`));
    }
  }

  if (config.noframes) {
    lines.push('// @noframes');
  }

  return lines;
}

/**
 * Generate userscript metadata block
 */
export function generateUserscriptMeta(
  config: UserscriptConfig,
  licenses: readonly LicenseInfo[],
): string {
  const sections = [
    ['// ==UserScript=='],
    generateBasicMeta(config),
    formatMetaLines('match', config.match),
    formatMetaLines('grant', config.grant),
    formatMetaLines('connect', config.connect),
    generateUrlMeta(config),
    generateOptionalMeta(config),
    ['// ==/UserScript=='],
  ];

  const metaBlock = sections.flat().join('\n');
  const licenseBlock = generateLicenseBlock(licenses);

  return licenseBlock ? `${metaBlock}\n${licenseBlock}` : metaBlock;
}

// ─────────────────────────────────────────────────────────────────────────────
// License Block Generation
// ─────────────────────────────────────────────────────────────────────────────

/** Common MIT License body text (without copyright line) */
const MIT_LICENSE_BODY =
  `Permission is hereby granted, free of charge, to any person obtaining a copy
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

/** Pattern to extract copyright line from MIT license */
const COPYRIGHT_PATTERN = /Copyright\s*\(c\)\s*(.+)/i;

/**
 * Extract copyright holder from license text
 */
function extractCopyright(licenseText: string): string | null {
  const match = licenseText.match(COPYRIGHT_PATTERN);
  return match?.[1]?.trim() ?? null;
}

/**
 * Check if license text is MIT license
 */
function isMitLicense(licenseText: string): boolean {
  return licenseText.includes('MIT License') ||
    licenseText.includes('Permission is hereby granted');
}

/**
 * Generate formatted license block comment
 * Consolidates multiple MIT licenses into a single block with merged copyrights
 */
function generateLicenseBlock(licenses: readonly LicenseInfo[]): string {
  if (licenses.length === 0) return '';

  // Separate MIT and non-MIT licenses
  const mitCopyrights: Array<{ name: string; copyright: string }> = [];
  const nonMitLicenses: LicenseInfo[] = [];

  for (const license of licenses) {
    if (!license) continue;

    if (isMitLicense(license.text)) {
      const copyright = extractCopyright(license.text);
      if (copyright) {
        mitCopyrights.push({ name: license.name, copyright });
      } else {
        // MIT but no extractable copyright - include as-is
        nonMitLicenses.push(license);
      }
    } else {
      nonMitLicenses.push(license);
    }
  }

  const lines: string[] = [
    '/*',
    ' * Third-Party Licenses',
    ' * ====================',
    ' *',
  ];

  // Output consolidated MIT license block if any
  if (mitCopyrights.length > 0) {
    lines.push(' * MIT License');
    lines.push(' *');

    // List all copyright holders with their project names
    for (const { name, copyright } of mitCopyrights) {
      lines.push(` * Copyright (c) ${copyright} (${name})`);
    }
    lines.push(' *');

    // Single MIT license body
    for (const textLine of MIT_LICENSE_BODY.split('\n')) {
      lines.push(` * ${textLine}`);
    }

    // Separator if there are non-MIT licenses
    if (nonMitLicenses.length > 0) {
      lines.push(' *', ' *');
    }
  }

  // Output non-MIT licenses as before
  for (let i = 0; i < nonMitLicenses.length; i++) {
    const license = nonMitLicenses[i];
    if (!license) continue;

    lines.push(` * ${license.name}:`);

    for (const textLine of license.text.split('\n')) {
      lines.push(` * ${textLine}`);
    }

    if (i < nonMitLicenses.length - 1) {
      lines.push(' *', ' *');
    }
  }

  lines.push(' *', ' */');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// License Name Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse license name from filename
 * e.g., "solid-js-MIT.txt" -> "Solid.js"
 */
export function parseLicenseName(filename: string): string {
  const base = filename
    .replace(FILE_EXTENSION_PATTERN, '')
    .replace(LICENSE_SUFFIX_PATTERN, '');

  return LICENSE_NAME_MAP[base] ?? base;
}
