// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Meta-Only Plugin — Vite plugin that generates a metadata-only .meta.js file.
 *
 * Writes a minimal `==UserScript==` block (without the full bundle code)
 * for update checking by userscript managers.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { generateMetaOnlyHeader, OUTPUT_FILE_NAMES } from '../utils/userscript';

export function metaOnlyPlugin(
  version: string,
  baseConfig: Parameters<typeof generateMetaOnlyHeader>[1]
): Plugin {
  return {
    name: 'meta-only-file',
    apply: 'build',
    enforce: 'post',
    writeBundle(options): void {
      const outDir = (options as { dir?: string }).dir ?? 'dist';
      const metaContent = generateMetaOnlyHeader(version, baseConfig);
      const metaPath = resolve(outDir, OUTPUT_FILE_NAMES.meta);
      writeFileSync(metaPath, metaContent, 'utf8');
      console.log(`📄 Meta-only file generated: ${OUTPUT_FILE_NAMES.meta}`);
    },
  };
}
