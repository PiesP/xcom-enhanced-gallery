import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';

import { OUTPUT_FILE_NAMES } from '../constants';
import { generateMetaOnlyHeader } from '../userscript/metadata';
import { resolveVersion } from '../version';

export function metaOnlyPlugin(mode: string): Plugin {
  const isDev = mode === 'development';
  const version = resolveVersion(isDev);
  // Only generate meta.js for production builds
  const shouldGenerateMeta = !isDev;

  return {
    name: 'meta-only-file',
    apply: 'build',
    enforce: 'post',

    writeBundle(options) {
      if (!shouldGenerateMeta) return;

      const outDir = options.dir ?? 'dist';
      const metaContent = generateMetaOnlyHeader(version);
      const metaPath = path.join(outDir, OUTPUT_FILE_NAMES.meta);

      fs.writeFileSync(metaPath, metaContent, 'utf8');
      console.log(`📄 Meta-only file generated: ${OUTPUT_FILE_NAMES.meta}`);
    },
  };
}
