/**
 * @fileoverview Vite plugin for cleaning up the dist directory
 *
 * Ensures that only expected output files are retained:
 * - Production and development bundles (*.user.js)
 * - Source maps (*.user.js.map)
 * - Meta files
 * - License files
 *
 * Runs in the pre-build phase to remove stale artifacts
 * from previous builds, preventing bloat in the output directory.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolve } from 'node:path';

import type { Plugin } from 'vite';

import { LICENSE_OUTPUT_FILES, OUTPUT_FILE_NAMES } from '../constants';
import { REPO_ROOT } from '../paths';

/**
 * Set of allowed output file names and patterns.
 *
 * All other files in the dist directory are considered stale
 * and will be removed during the build start phase.
 * Includes:
 * - Dev and production bundles (*.user.js)
 * - Source maps (*.user.js.map)
 * - Meta files (*.meta.js)
 * - License file directory and combined license
 */
const ALLOWED_OUTPUT_FILES = new Set([
  OUTPUT_FILE_NAMES.dev,
  `${OUTPUT_FILE_NAMES.dev}.map`,
  OUTPUT_FILE_NAMES.prod,
  OUTPUT_FILE_NAMES.meta,
  LICENSE_OUTPUT_FILES.project,
  LICENSE_OUTPUT_FILES.thirdPartyDir,
  LICENSE_OUTPUT_FILES.combined,
]);

/**
 * Create a Vite plugin that cleans up the dist directory.
 *
 * During the pre-build phase:
 * 1. Ensures the dist directory exists (creates if missing)
 * 2. Scans for files not in the allowed list
 * 3. Removes stale build artifacts recursively
 * 4. Logs removed files to the console
 *
 * This prevents accumulation of obsolete files from previous builds
 * and helps keep the distribution directory clean.
 *
 * @returns Vite Plugin with buildStart hook
 */
export function distCleanupPlugin(): Plugin {
  return {
    name: 'dist-cleanup',
    apply: 'build',
    enforce: 'pre',

    buildStart(): void {
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
