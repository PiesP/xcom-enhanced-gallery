/**
 * @fileoverview Vite plugin for generating meta-only userscript file
 *
 * Creates a minimal meta-only file containing only userscript metadata
 * for distribution on script hosting platforms (Greasy Fork, etc.).
 *
 * Only runs for production builds. Development builds skip this step
 * as they don't need the separate meta file.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Plugin } from 'vite';

import { OUTPUT_FILE_NAMES } from '../constants';
import { generateMetaOnlyHeader } from '../userscript/metadata';
import { resolveVersion } from '../version';

/**
 * Create a Vite plugin that generates a meta-only userscript file.
 *
 * During the post-build phase (production only):
 * 1. Resolves the current version from build mode
 * 2. Generates userscript metadata header
 * 3. Writes metadata as a standalone file
 * 4. Logs completion message
 *
 * This meta-only file can be distributed separately to script managers,
 * allowing users to check for updates and install the full script.
 *
 * @param mode Build mode identifier (e.g., 'production', 'development')
 * @returns Vite Plugin with writeBundle hook
 */
export function metaOnlyPlugin(mode: string): Plugin {
  const isDev = mode === 'development';
  const version = resolveVersion(isDev);
  // Only generate meta.js for production builds
  const shouldGenerateMeta = !isDev;

  return {
    name: 'meta-only-file',
    apply: 'build',
    enforce: 'post',

    writeBundle(options): void {
      if (!shouldGenerateMeta) return;

      const outDir = options.dir ?? 'dist';
      const metaContent = generateMetaOnlyHeader(version);
      const metaPath = path.join(outDir, OUTPUT_FILE_NAMES.meta);

      fs.writeFileSync(metaPath, metaContent, 'utf8');
      console.log(`📄 Meta-only file generated: ${OUTPUT_FILE_NAMES.meta}`);
    },
  };
}
