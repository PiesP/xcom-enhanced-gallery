// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import * as fs from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { OUTPUT_FILE_NAMES } from '../../vite/constants';
import { generateMetaOnlyHeader } from './metadata';

export function metaOnlyPlugin(version: string): Plugin {
  return {
    name: 'meta-only-file',
    apply: 'build',
    enforce: 'post',
    writeBundle(options): void {
      const outDir = (options as { dir?: string }).dir ?? 'dist';
      const metaContent = generateMetaOnlyHeader(version);
      const metaPath = resolve(outDir, OUTPUT_FILE_NAMES.meta);
      fs.writeFileSync(metaPath, metaContent, 'utf8');
      console.log(`\ud83d\udcc4 Meta-only file generated: ${OUTPUT_FILE_NAMES.meta}`);
    },
  };
}
