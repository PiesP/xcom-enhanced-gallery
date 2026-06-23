// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Build Summary Plugin — Vite plugin that summarizes the build output.
 *
 * Prepends the userscript header (metadata block) to the entry chunk,
 * prints build mode information, version, bundle size, and performs
 * a single-file bundle guard to ensure no unexpected files appear in dist/.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';
import { generateUserscriptHeader, OUTPUT_FILE_NAMES } from '../utils/userscript';

/** Configuration options for build mode optimization (development vs production). */
interface BuildModeConfig {
  readonly cssCompress: boolean;
  readonly cssClassNamePattern: string;
  readonly sourceMap: boolean | 'inline';
}

export function buildSummaryPlugin(opts: {
  isDev: boolean;
  version: string;
  config: BuildModeConfig;
  baseConfig: Parameters<typeof generateUserscriptHeader>[0]['baseConfig'];
}): Plugin {
  const { isDev, version, config, baseConfig } = opts;
  const header = generateUserscriptHeader({ version, isDev, baseConfig });

  return {
    name: 'post-build',
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

    closeBundle(): void {
      const modeLabel = isDev ? 'Development' : 'Production';
      const sourceMapLabel =
        config.sourceMap === 'inline' ? 'Inline' : config.sourceMap ? 'External' : 'Disabled';
      const info = isDev
        ? [
            '📖 Optimized for: Debugging & Analysis',
            '├─ CSS class names: Readable (Component__class__hash)',
            '├─ CSS formatting: Preserved',
            '├─ CSS variables: Full names',
            '├─ CSS comments: Preserved',
            `└─ Source maps: ${sourceMapLabel}`,
          ]
        : [
            '📦 Optimized for: Distribution Size',
            '├─ CSS class names: Hashed (xg-*)',
            '├─ CSS formatting: Compressed',
            '├─ CSS variables: Full names',
            '├─ CSS custom properties: Pruned',
            '├─ CSS comments: Removed',
            `└─ Source maps: ${sourceMapLabel}`,
          ];

      console.log(`\n📋 Build Mode: ${modeLabel}`);
      console.log('─'.repeat(50));
      info.forEach((line) => {
        console.log(`   ${line}`);
      });
      console.log('─'.repeat(50));

      console.log(`📌 Version: ${version}`);

      const bundleName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;
      const bundlePath = `dist/${bundleName}`;
      try {
        const stats = statSync(bundlePath);
        const gzipped = gzipSync(readFileSync(bundlePath)).length;
        console.log(
          `📦 Bundle: ${bundleName} — ${formatBytes(stats.size)} (gzip ${formatBytes(gzipped)})`
        );
      } catch {
        // Bundle size reporting is best-effort; ignore read errors.
      }

      // Single-file bundle guard: fail if unexpected files appear in dist/
      const expectedFiles = new Set([
        bundleName,
        ...(config.sourceMap && config.sourceMap !== 'inline' ? [`${bundleName}.map`] : []),
        OUTPUT_FILE_NAMES.meta,
      ]);
      const actualDist = readdirSync('dist');
      const unexpected = actualDist.filter((f) => !expectedFiles.has(f));
      if (unexpected.length > 0) {
        throw new Error(
          `Unexpected files in dist/: ${unexpected.join(', ')}. ` +
            `Expected only: ${[...expectedFiles].join(', ')}. ` +
            `Check for url() references, ?url imports, or new URL() patterns.`
        );
      }
    },
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
