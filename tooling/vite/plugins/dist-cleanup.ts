import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

import { OUTPUT_FILE_NAMES } from '../constants';
import { REPO_ROOT } from '../paths';

const ALLOWED_OUTPUT_FILES = new Set([
  OUTPUT_FILE_NAMES.dev,
  `${OUTPUT_FILE_NAMES.dev}.map`,
  OUTPUT_FILE_NAMES.prod,
  OUTPUT_FILE_NAMES.meta,
]);

export function distCleanupPlugin(): Plugin {
  return {
    name: 'dist-cleanup',
    apply: 'build',
    enforce: 'pre',

    buildStart() {
      const distDir = resolve(REPO_ROOT, 'dist');

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
        return;
      }

      const files = fs.readdirSync(distDir);
      for (const file of files) {
        if (!ALLOWED_OUTPUT_FILES.has(file)) {
          const filePath = path.join(distDir, file);
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`🗑️  Removed: ${file}`);
        }
      }
    },
  };
}
