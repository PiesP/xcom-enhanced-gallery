// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite plugin: prepend userscript metadata header to the entry chunk.
 *
 * Generates the complete ==UserScript== block from build-time configuration
 * and version, then prepends it to the IIFE bundle.
 */

import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import type { UserscriptMeta, UserscriptBaseConfig } from './userscript/types';

const OUTPUT_FILE_NAMES = {
  dev: 'xcom-enhanced-gallery.dev.user.js',
  prod: 'xcom-enhanced-gallery.user.js',
  meta: 'xcom-enhanced-gallery.meta.js',
} as const;

const CDN_BASE_URL = 'https://cdn.jsdelivr.net/gh/PiesP/xcom-enhanced-gallery@release/dist' as const;

function formatMetaLine(key: string, value: string): string {
  return `// @${key} ${value}`;
}

function formatMetaLines(key: string, values: readonly string[]): string[] {
  return values.map((v) => formatMetaLine(key, v));
}

function buildMetadataBlock(config: UserscriptMeta): string {
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

function generateUserscriptHeader(args: { version: string; isDev: boolean }, baseConfig: UserscriptBaseConfig): string {
  const fileName = args.isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
  const metaFileName = OUTPUT_FILE_NAMES.meta;
  const nameSuffix = args.isDev ? ' (Dev)' : '';

  const config: UserscriptMeta = {
    ...baseConfig,
    name: `${baseConfig.name}${nameSuffix}`,
    version: args.version,
    downloadURL: `${CDN_BASE_URL}/${fileName}`,
    updateURL: `${CDN_BASE_URL}/${metaFileName}`,
  };

  return buildMetadataBlock(config);
}

export function headerPlugin(
  version: string,
  baseConfig: UserscriptBaseConfig
): Plugin {
  const header = generateUserscriptHeader({ version, isDev: false }, baseConfig);

  return {
    name: 'userscript-header',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle): void {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = `${header}\n${chunk.code}`;
          break;
        }
      }
    },
  };
}

export { OUTPUT_FILE_NAMES, CDN_BASE_URL };
