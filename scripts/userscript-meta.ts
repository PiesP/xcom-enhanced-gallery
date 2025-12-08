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

/**
 * Generate formatted license block comment
 */
function generateLicenseBlock(licenses: readonly LicenseInfo[]): string {
  if (licenses.length === 0) return '';

  const lines: string[] = [
    '/*',
    ' * Third-Party Licenses',
    ' * ====================',
    ' *',
  ];

  for (let i = 0; i < licenses.length; i++) {
    const license = licenses[i];
    if (!license) continue;

    // Add license name as header
    lines.push(` * ${license.name}:`);

    // Add license text with proper formatting
    for (const textLine of license.text.split('\n')) {
      lines.push(` * ${textLine}`);
    }

    // Add separator between licenses (except for the last one)
    if (i < licenses.length - 1) {
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
