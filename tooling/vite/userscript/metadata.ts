import { CDN_BASE_URL, OUTPUT_FILE_NAMES, USERSCRIPT_CONFIG } from '../constants';
import { aggregateLicenses } from '../license-aggregation';
import { LICENSES_DIR } from '../paths';
import type { LicenseInfo, UserscriptMeta } from '../types';

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

function formatMetaLine(key: string, value: string): string {
  return `// @${key} ${value}`;
}

function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((v) => formatMetaLine(key, v));
}

function resolveLicenseSourceUrl(version: string, isDev: boolean): string {
  const tag = isDev ? 'master' : `v${version}`;
  return `${USERSCRIPT_CONFIG.homepageURL}/tree/${tag}/LICENSES`;
}

export function collectUsedUserscriptGrants(code: string, candidates: readonly string[]): string[] {
  // Heuristic, intentionally conservative:
  // - Scan the final JS bundle for GM_* identifiers.
  // - If a grant string appears anywhere (even in strings), keep it.
  //   False positives are acceptable; false negatives would break runtime.
  const used: string[] = [];

  for (const grant of candidates) {
    const escaped = grant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`);
    if (regex.test(code)) {
      used.push(grant);
    }
  }

  return used;
}

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
    '// Copyright (c) 2024-2025 X.com Enhanced Gallery Contributors',
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

function buildLicenseBlock(
  licenses: readonly LicenseInfo[],
  options?: { readonly fullText?: boolean; readonly sourceUrl?: string }
): string {
  if (licenses.length === 0) return '';

  const fullText = options?.fullText ?? false;
  const sourceUrl = options?.sourceUrl;

  if (!fullText) {
    // Keep the production header short (no file list) to reduce fixed overhead.
    const url = sourceUrl ?? `${USERSCRIPT_CONFIG.homepageURL}/tree/master/LICENSES`;
    return `// Third-party licenses: ${url}`;
  }

  const mitCopyrights: Array<{ name: string; copyright: string }> = [];
  const otherLicenses: LicenseInfo[] = [];

  for (const license of licenses) {
    const isMit =
      license.text.includes('MIT License') || license.text.includes('Permission is hereby granted');
    if (isMit) {
      const match = license.text.match(/Copyright\s*\(c\)\s*(.+)/i);
      if (match?.[1]) {
        mitCopyrights.push({ name: license.name, copyright: match[1].trim() });
        continue;
      }
    }
    otherLicenses.push(license);
  }

  const lines = [' * Third-Party Licenses', ' * ===================='];
  if (sourceUrl) {
    lines.push(` * Source: ${sourceUrl}`);
  }
  lines.push(' *');

  if (mitCopyrights.length > 0) {
    lines.push(' * MIT License', ' *');
    for (const { name, copyright } of mitCopyrights) {
      lines.push(` * Copyright (c) ${copyright} (${name})`);
    }
    lines.push(' *');
    for (const textLine of MIT_LICENSE_BODY.split('\n')) {
      lines.push(` * ${textLine}`);
    }
    if (otherLicenses.length > 0) lines.push(' *', ' *');
  }

  for (let i = 0; i < otherLicenses.length; i++) {
    const license = otherLicenses[i];
    if (!license) continue;
    lines.push(` * ${license.name}:`);
    for (const textLine of license.text.split('\n')) {
      lines.push(` * ${textLine}`);
    }
    if (i < otherLicenses.length - 1) lines.push(' *', ' *');
  }

  lines.push(' *');
  return ['/*', ...lines, ' */'].join('\n');
}

export function generateUserscriptHeader(args: {
  version: string;
  isDev: boolean;
  grantOverride?: readonly string[];
}): string {
  const fileName = args.isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;

  const nameSuffix = args.isDev ? ' (Dev)' : '';

  const config: UserscriptMeta = {
    ...USERSCRIPT_CONFIG,
    name: `${USERSCRIPT_CONFIG.name}${nameSuffix}`,
    version: args.version,
    homepageURL: USERSCRIPT_CONFIG.homepageURL,
    grant: args.grantOverride ?? USERSCRIPT_CONFIG.grant,
    downloadURL: `${CDN_BASE_URL}/${fileName}`,
    updateURL: `${CDN_BASE_URL}/${metaFileName}`,
    compatible: USERSCRIPT_CONFIG.compatible,
  };

  const licenses = aggregateLicenses(LICENSES_DIR);
  const licenseSourceUrl = resolveLicenseSourceUrl(args.version, args.isDev);
  const metaBlock = buildMetadataBlock(config);
  const licenseBlock = buildLicenseBlock(licenses, { fullText: true, sourceUrl: licenseSourceUrl });

  return licenseBlock ? `${metaBlock}\n${licenseBlock}` : metaBlock;
}

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
