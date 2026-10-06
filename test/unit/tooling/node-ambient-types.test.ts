import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
const temporaryRoots: string[] = [];
const projects = [
  {
    name: 'scripts',
    config: resolve(root, 'tsconfig.scripts.json'),
    roots: [resolve(root, 'scripts/check/bootstrap.ts'), resolve(root, 'scripts/release/prepare.ts')],
  },
  {
    name: 'direct Firefox test',
    config: resolve(root, 'tsconfig.node-tests.json'),
    roots: [resolve(root, 'test/e2e/firefox-extension-runtime.test.ts')],
  },
] as const;

function compileProbe(project: (typeof projects)[number], addDom: boolean) {
  const directory = mkdtempSync(join(root, '.node-ambient-probe-'));
  temporaryRoots.push(directory);
  const source = join(directory, 'probe.ts');
  writeFileSync(source, [
    "import { readFileSync } from 'node:fs';",
    'void readFileSync;',
    'void process.version;',
    "void Buffer.from('node');",
    "void fetch('https://example.invalid');",
    'void AbortController;',
    'void document.title;',
    "void window.alert('browser');",
  ].join('\n'));

  const config = join(directory, 'tsconfig.json');
  writeFileSync(config, JSON.stringify({
    extends: project.config,
    // `files` adds the probe while retaining the real project's inherited `include`.
    files: [source],
    ...(addDom && { compilerOptions: { lib: ['ESNext', 'DOM'] } }),
  }));
  const result = spawnSync(process.execPath, [tsc, '-p', config, '--noEmit', '--pretty', 'false'], {
    cwd: root,
    encoding: 'utf8',
  });
  const listed = spawnSync(process.execPath, [tsc, '-p', config, '--listFilesOnly'], {
    cwd: root,
    encoding: 'utf8',
  });
  expect(listed.status, listed.stdout + listed.stderr).toBe(0);
  const files = listed.stdout.trim().split('\n');
  for (const requiredRoot of project.roots) expect(files).toContain(requiredRoot);
  return { ...result, files };
}

afterEach(() => {
  for (const directory of temporaryRoots.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('Node tooling ambient types', () => {
  for (const project of projects) {
    it(`rejects browser globals in ${project.name} while accepting Node APIs`, () => {
      const result = compileProbe(project, false);
      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toBe('');
      const diagnostics = result.stdout.trim().split('\n');
      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0]).toMatch(/^.*probe\.ts\(7,6\): error TS2584: Cannot find name 'document'\./);
      expect(diagnostics[1]).toMatch(/^.*probe\.ts\(8,6\): error TS2304: Cannot find name 'window'\./);
      expect(result.files.some((file) => file.endsWith('/lib.dom.d.ts'))).toBe(false);
    });

    it(`detects DOM reintroduction in a disposable ${project.name} config`, () => {
      const result = compileProbe(project, true);
      expect(result.status, result.stdout + result.stderr).toBe(0);
      expect(result.files.some((file) => file.endsWith('/lib.dom.d.ts'))).toBe(true);
    });
  }
});
