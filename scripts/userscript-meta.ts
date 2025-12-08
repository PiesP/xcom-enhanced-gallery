/**
 * Userscript Metadata Generator
 *
 * Generates the userscript header block with proper metadata format.
 */

export interface UserscriptConfig {
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  license: string;
  match: string[];
  grant: string[];
  connect: string[];
  runAt: 'document-start' | 'document-end' | 'document-idle';
  supportURL: string;
  downloadURL: string;
  updateURL: string;
  noframes: boolean;
  icon?: string;
  require?: string[];
  resource?: Record<string, string>;
}

export interface LicenseInfo {
  name: string;
  text: string;
}

/**
 * Format a single metadata line
 */
function formatMetaLine(key: string, value: string): string {
  // Pad key to align values (max key length is ~12 chars)
  const paddedKey = key.padEnd(12);
  return `// @${paddedKey} ${value}`;
}

/**
 * Generate userscript metadata block
 */
export function generateUserscriptMeta(
  config: UserscriptConfig,
  licenses: LicenseInfo[],
): string {
  const lines: string[] = ['// ==UserScript=='];

  // Basic metadata
  lines.push(formatMetaLine('name', config.name));
  lines.push(formatMetaLine('namespace', config.namespace));
  lines.push(formatMetaLine('version', config.version));
  lines.push(formatMetaLine('description', config.description));
  lines.push(formatMetaLine('author', config.author));
  lines.push(formatMetaLine('license', config.license));

  // Match patterns
  for (const match of config.match) {
    lines.push(formatMetaLine('match', match));
  }

  // GM API grants
  for (const grant of config.grant) {
    lines.push(formatMetaLine('grant', grant));
  }

  // Connect domains (for GM_xmlhttpRequest)
  for (const domain of config.connect) {
    lines.push(formatMetaLine('connect', domain));
  }

  // Run timing
  lines.push(formatMetaLine('run-at', config.runAt));

  // URLs
  lines.push(formatMetaLine('supportURL', config.supportURL));
  lines.push(formatMetaLine('downloadURL', config.downloadURL));
  lines.push(formatMetaLine('updateURL', config.updateURL));

  // Optional fields
  if (config.icon) {
    lines.push(formatMetaLine('icon', config.icon));
  }

  if (config.require) {
    for (const url of config.require) {
      lines.push(formatMetaLine('require', url));
    }
  }

  if (config.resource) {
    for (const [name, url] of Object.entries(config.resource)) {
      lines.push(formatMetaLine('resource', `${name} ${url}`));
    }
  }

  // Noframes
  if (config.noframes) {
    lines.push('// @noframes');
  }

  lines.push('// ==/UserScript==');

  // Add license block
  const licenseBlock = generateLicenseBlock(licenses);
  if (licenseBlock) {
    lines.push(licenseBlock);
  }

  return lines.join('\n');
}

/**
 * Generate formatted license block comment
 */
function generateLicenseBlock(licenses: LicenseInfo[]): string {
  if (licenses.length === 0) {
    return '';
  }

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
    const textLines = license.text.trim().split('\n');
    for (const textLine of textLines) {
      lines.push(` * ${textLine}`);
    }

    // Add separator between licenses (except for the last one)
    if (i < licenses.length - 1) {
      lines.push(' *');
      lines.push(' *');
    }
  }

  lines.push(' *');
  lines.push(' */');

  return lines.join('\n');
}

/**
 * Parse license name from filename
 * e.g., "solid-js-MIT.txt" -> "Solid.js"
 */
export function parseLicenseName(filename: string): string {
  // Remove extension and -MIT/-LICENSE suffix
  const base = filename
    .replace(/\.(txt|md)$/i, '')
    .replace(/-(MIT|LICENSE|APACHE|BSD)$/i, '');

  // Special case mappings
  const nameMap: Record<string, string> = {
    'solid-js': 'Solid.js',
    heroicons: 'Heroicons',
    'xcom-enhanced-gallery': 'X.com Enhanced Gallery',
  };

  return nameMap[base] || base;
}
