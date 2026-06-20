// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Vite plugin: generate a minimal meta-only userscript file for update checking.
 */

import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { OUTPUT_FILE_NAMES, CDN_BASE_URL } from './header';

export function metaOnlyPlugin(version: string): Plugin {
  return {
    name: 'meta-only-file',
    apply: 'build',
    enforce: 'post',
    writeBundle(options): void {
      const outDir = (options as { dir?: string }).dir ?? 'dist';
      const metaContent = [
        '// ==UserScript==',
        `// @name X.com Enhanced Gallery`,
        `// @namespace https://github.com/PiesP/xcom-enhanced-gallery`,
        `// @version ${version}`,
        `// @downloadURL ${CDN_BASE_URL}/${OUTPUT_FILE_NAMES.prod}`,
        `// @updateURL ${CDN_BASE_URL}/${OUTPUT_FILE_NAMES.meta}`,
        '// ==/UserScript==',
      ].join('\n');
      const metaPath = resolve(outDir, OUTPUT_FILE_NAMES.meta);
      const { writeFileSync } = require('node:fs') as typeof import('node:fs');
      writeFileSync(metaPath, metaContent, 'utf8');
      console.log(`📄 Meta-only file generated: ${OUTPUT_FILE_NAMES.meta}`);
    },
  };
}
