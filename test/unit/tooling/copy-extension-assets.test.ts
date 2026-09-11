import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { describe, expect, it } from 'vitest';
import { copyExtensionAssetsPlugin } from '../../../tooling/vite/plugins/copy-extension-assets.ts';

const projectRoot = resolve(import.meta.dirname, '../../..');
const extensionBuildCheck = resolve(projectRoot, 'scripts/check/extension-build.ts');

function write(root: string, path: string, contents: string | Uint8Array): void {
  const target = join(root, path);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, contents);
}

function runWriteBundle(plugin: Plugin): void {
  const hook = plugin.writeBundle;
  if (typeof hook !== 'function') {
    throw new TypeError('copy-extension-assets must provide a writeBundle hook.');
  }
  Reflect.apply(hook, undefined, []);
}

function runPlugin(root: string, outDir: string, manifestFile: string): void {
  runWriteBundle(copyExtensionAssetsPlugin({ root, outDir, manifestFile }));
}

function runExtensionBuildCheck(outDir: string): {
  readonly output: string;
  readonly status: number | null;
} {
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', extensionBuildCheck, outDir],
    { encoding: 'utf8' }
  );
  return { output: `${result.stdout}${result.stderr}`, status: result.status };
}

describe('copyExtensionAssetsPlugin', () => {
  it('copies only each manifest declared icons and removes stale plugin-owned output', () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-extension-assets-'));
    const chromeOut = join(root, 'dist-extension');
    const firefoxOut = join(root, 'dist-extension-firefox');
    const icons = {
      'icon-16x16.png': Uint8Array.from([0, 16, 255]),
      'icon-32x32.png': Uint8Array.from([0, 32, 255]),
      'icon-48x48.png': Uint8Array.from([0, 48, 255]),
      'icon-128x128.png': Uint8Array.from([0, 128, 255]),
      'unused.png': Uint8Array.from([222, 173, 190, 239]),
    };

    try {
      write(
        root,
        'extension/manifest.chrome.json',
        JSON.stringify({ icons: { 16: 'icons/icon-16x16.png', 128: 'icons/icon-128x128.png' } })
      );
      write(
        root,
        'extension/manifest.firefox.json',
        JSON.stringify({ icons: { 32: 'icons/icon-32x32.png', 48: 'icons/icon-48x48.png' } })
      );
      for (const [name, bytes] of Object.entries(icons)) {
        write(root, `assets/icons/${name}`, bytes);
      }
      write(chromeOut, 'background.js', 'preserve background');
      write(chromeOut, 'content.js', 'preserve content');
      write(chromeOut, 'icons/unused.png', 'stale output');

      runPlugin(root, chromeOut, 'manifest.chrome.json');
      runPlugin(root, firefoxOut, 'manifest.firefox.json');

      expect(readdirSync(join(chromeOut, 'icons')).sort()).toEqual([
        'icon-128x128.png',
        'icon-16x16.png',
      ]);
      expect(readdirSync(join(firefoxOut, 'icons')).sort()).toEqual([
        'icon-32x32.png',
        'icon-48x48.png',
      ]);
      expect(readFileSync(join(chromeOut, 'background.js'), 'utf8')).toBe('preserve background');
      expect(readFileSync(join(chromeOut, 'content.js'), 'utf8')).toBe('preserve content');
      expect(readFileSync(join(chromeOut, 'icons/icon-128x128.png'))).toEqual(
        Buffer.from(icons['icon-128x128.png'])
      );
      expect(readFileSync(join(firefoxOut, 'icons/icon-32x32.png'))).toEqual(
        Buffer.from(icons['icon-32x32.png'])
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('fails before replacing existing output when a declared icon is missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-extension-assets-missing-'));
    const outDir = join(root, 'dist-extension');

    try {
      write(
        root,
        'extension/manifest.json',
        JSON.stringify({ icons: { 128: 'icons/icon-128x128.png' } })
      );
      write(outDir, 'icons/existing.png', 'preserved after failure');

      expect(() => runPlugin(root, outDir, 'manifest.json')).toThrow(
        /manifest\.json.*icons\/icon-128x128\.png.*does not exist/i
      );
      expect(readFileSync(join(outDir, 'icons/existing.png'), 'utf8')).toBe(
        'preserved after failure'
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it.each([
    ['empty icons', { icons: {} }],
    ['non-numeric size', { icons: { large: 'icons/icon.png' } }],
    ['path traversal', { icons: { 128: 'icons/../private.png' } }],
    ['non-string path', { icons: { 128: 42 } }],
  ])('rejects invalid manifest icon declarations: %s', (_case, manifest) => {
    const root = mkdtempSync(join(tmpdir(), 'xeg-extension-assets-invalid-'));

    try {
      write(root, 'extension/manifest.json', JSON.stringify(manifest));

      expect(() => runPlugin(root, join(root, 'dist-extension'), 'manifest.json')).toThrow(
        /manifest\.json.*icons/i
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});

describe('extension build asset check', () => {
  it('reports an icon declared by the built manifest when its output file is missing', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'xeg-extension-check-missing-'));

    try {
      write(outDir, 'content.js', '(function() {})();');
      write(outDir, 'background.js', 'export {};');
      write(
        outDir,
        'manifest.json',
        JSON.stringify({
          icons: {
            16: 'icons/icon-16x16.png',
            128: 'icons/icon-128x128.png',
          },
        })
      );
      write(outDir, 'icons/icon-128x128.png', Uint8Array.from([128]));

      const result = runExtensionBuildCheck(outDir);

      expect(result.status).toBe(1);
      expect(result.output).toMatch(/icons\/icon-16x16\.png.*was not produced/i);
    } finally {
      rmSync(outDir, { force: true, recursive: true });
    }
  });

  it('keeps the manifest 128 icon aligned with the background notification fallback', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'xeg-extension-check-fallback-'));

    try {
      write(outDir, 'content.js', '(function() {})();');
      write(outDir, 'background.js', 'export {};');
      write(
        outDir,
        'manifest.json',
        JSON.stringify({ icons: { 128: 'icons/alternate-128.png' } })
      );
      write(outDir, 'icons/alternate-128.png', Uint8Array.from([128]));

      const result = runExtensionBuildCheck(outDir);

      expect(result.status).toBe(1);
      expect(result.output).toMatch(
        /icon 128 must be icons\/icon-128x128\.png.*notification fallback/i
      );
    } finally {
      rmSync(outDir, { force: true, recursive: true });
    }
  });
});
