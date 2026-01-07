/**
 * @fileoverview Single-file bundle guard plugin for Vite.
 *
 * Validates that the build produces exactly one JavaScript output file and no
 * unexpected assets. Prevents accidental code-splitting or asset generation that
 * would violate the single-file userscript constraint.
 *
 * Rejects builds that emit:
 * - Multiple code chunks (code-splitting)
 * - Non-sourcemap assets (images, CSS bundles, etc.)
 * - Misnamed output files
 *
 * Helps developers catch asset import mistakes early:
 * - Local file imports with `?url` query parameter
 * - CSS `url()` references to local files
 * - `new URL(..., import.meta.url)` patterns
 * - Worker or dynamic import patterns
 */

import type { Plugin } from 'vite';
import { OUTPUT_FILE_NAMES } from '../constants';

/**
 * Creates a Vite plugin that validates single-file bundle constraints.
 *
 * Ensures the build output is exactly one JavaScript file with no separate assets,
 * preventing accidental violations of the userscript single-file requirement.
 * The plugin runs after the main build (post-enforce) to catch asset emissions.
 *
 * @param mode - Build mode ('development' or 'production')
 * @returns Vite plugin instance for single-file bundle validation
 * @throws Error if multiple chunks, unexpected assets, or name mismatches detected
 */
export function singleFileBundleGuardPlugin(mode: string): Plugin {
  const isDev = mode === 'development';
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;

  return {
    name: 'single-file-bundle-guard',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle): void {
      type MinimalChunk = {
        readonly type: 'chunk';
        readonly fileName: string;
        readonly isEntry: boolean;
      };
      type MinimalAsset = {
        readonly type: 'asset';
        readonly fileName: string;
      };
      type MinimalBundleItem = MinimalChunk | MinimalAsset;

      const values = Object.values(bundle) as unknown as MinimalBundleItem[];
      const chunkFiles = values.filter((item) => item.type === 'chunk') as MinimalChunk[];
      const entryChunks = chunkFiles.filter((chunk) => chunk.isEntry);
      const assetFiles = values
        .filter((item) => item.type === 'asset')
        .map((item) => item.fileName);

      if (entryChunks.length !== 1) {
        throw new Error(
          `[single-file] Expected exactly 1 entry chunk, but got ${entryChunks.length}. ` +
            `Emitted chunks: ${chunkFiles.map((c) => c.fileName).join(', ')}`
        );
      }

      const entry = entryChunks[0];
      if (entry && entry.fileName !== outputFileName) {
        throw new Error(
          `[single-file] Entry file name mismatch. Expected '${outputFileName}', got '${entry.fileName}'.`
        );
      }

      const unexpectedAssets = assetFiles.filter((name) => !name.endsWith('.map'));
      if (unexpectedAssets.length > 0) {
        throw new Error(
          `[single-file] Unexpected build assets emitted: ${unexpectedAssets.join(', ')}. ` +
            `Avoid importing local files via ?url, CSS url(), new URL(..., import.meta.url), Workers, or dynamic chunking.`
        );
      }

      if (chunkFiles.length !== 1) {
        throw new Error(
          `[single-file] Expected a single output chunk, but got ${chunkFiles.length}: ` +
            `${chunkFiles.map((c) => c.fileName).join(', ')}`
        );
      }
    },
  };
}
