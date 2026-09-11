import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { readExtensionIconDeclarations } from '../utils/extension-icons.ts';

export function copyExtensionAssetsPlugin(options: {
  root: string;
  outDir: string;
  manifestFile: string;
}): Plugin {
  const { root, outDir, manifestFile } = options;

  return {
    name: 'copy-extension-assets',
    writeBundle() {
      const manifestSource = resolve(root, 'extension', manifestFile);
      const icons = readExtensionIconDeclarations(manifestSource);
      const copies = [...new Set(icons.map((icon) => icon.path))].map((path) => ({
        destination: resolve(outDir, path),
        path,
        source: resolve(root, 'assets', path),
      }));

      for (const icon of copies) {
        if (!existsSync(icon.source)) {
          throw new Error(
            `Extension manifest ${manifestFile} requires ${icon.path}, but the source asset does not exist.`
          );
        }
        if (!statSync(icon.source).isFile()) {
          throw new Error(
            `Extension manifest ${manifestFile} requires ${icon.path}, but the source asset is not a file.`
          );
        }
      }

      mkdirSync(outDir, { recursive: true });
      copyFileSync(manifestSource, resolve(outDir, 'manifest.json'));

      rmSync(resolve(outDir, 'icons'), { force: true, recursive: true });
      for (const icon of copies) {
        mkdirSync(dirname(icon.destination), { recursive: true });
        copyFileSync(icon.source, icon.destination);
      }
    },
  };
}
