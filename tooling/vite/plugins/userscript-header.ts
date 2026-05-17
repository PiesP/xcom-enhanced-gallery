/**
 * @fileoverview Userscript header injection plugin for Vite.
 *
 * Injects the userscript metadata header into the final bundle and generates
 * build mode information summary.
 */

import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';
import { OUTPUT_FILE_NAMES, getBuildModeConfig } from '../constants';
import { generateUserscriptHeader } from '../userscript/metadata';
import { resolveVersion } from '../version';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Creates a Vite plugin that injects userscript metadata header and build summary.
 *
 * Runs post-build to inject the userscript header containing metadata directives
 * (@grant, @connect, @version, etc.).
 *
 * Also outputs a formatted build mode summary showing optimization settings
 * (CSS minification, source maps, etc.) to the console.
 *
 * @param mode - Build mode ('development' or 'production')
 * @returns Vite plugin instance for userscript header injection
 */
export function userscriptHeaderPlugin(mode: string): Plugin {
  const isDev = mode === 'development';
  const version = resolveVersion(isDev);
  const buildMode = getBuildModeConfig(mode);

  return {
    name: 'userscript-header',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle): void {
      const header = generateUserscriptHeader({ version, isDev });

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
        buildMode.sourceMap === 'inline' ? 'Inline' : buildMode.sourceMap ? 'External' : 'Disabled';
      const info = isDev
        ? [
            '📖 Optimized for: Debugging & Analysis',
            '├─ CSS class names: Readable (Component__class__hash)',
            '├─ CSS formatting: Preserved',
            '├─ CSS variables: Full names (--xeg-*)',
            '├─ CSS comments: Preserved',
            `└─ Source maps: ${sourceMapLabel}`,
          ]
        : [
            '📦 Optimized for: Distribution Size',
            '├─ CSS class names: Hashed (xg-*)',
            '├─ CSS formatting: Compressed',
            '├─ CSS variables: Shortened',
            '├─ CSS custom properties: Pruned',
            '├─ CSS comments: Removed',
            `└─ Source maps: ${sourceMapLabel}`,
          ];

      console.log(`\n📋 Build Mode: ${modeLabel}`);
      console.log('─'.repeat(50));
      info.forEach((line) => console.log(`   ${line}`));
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
    },
  };
}
