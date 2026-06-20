// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite plugin: print build summary and validate single-file output.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';
import { OUTPUT_FILE_NAMES } from './header';

interface BuildModeConfig {
  readonly sourceMap: boolean | 'inline';
}

interface BuildSummaryOptions {
  isDev: boolean;
  version: string;
  config: BuildModeConfig;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function buildSummaryPlugin(opts: BuildSummaryOptions): Plugin {
  const { isDev, version, config } = opts;

  return {
    name: 'post-build',
    apply: 'build',
    enforce: 'post',

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
