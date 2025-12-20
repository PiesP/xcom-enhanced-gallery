import type { Plugin } from 'vite';

import { OUTPUT_FILE_NAMES } from '../constants';

export function singleFileBundleGuardPlugin(mode: string): Plugin {
  const isDev = mode === 'development';
  const outputFileName = isDev ? OUTPUT_FILE_NAMES.dev : OUTPUT_FILE_NAMES.prod;

  return {
    name: 'single-file-bundle-guard',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
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
