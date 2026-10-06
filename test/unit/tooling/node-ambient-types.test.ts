import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const scriptConfig = resolve(root, 'tsconfig.scripts.json');
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
const temporaryRoots: string[] = [];

function compileProbe(addDom: boolean) {
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
    extends: scriptConfig,
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
  expect(files).toContain(resolve(root, 'scripts/check/bootstrap.ts'));
  expect(files).toContain(resolve(root, 'scripts/release/prepare.ts'));
  return { ...result, files };
}

afterEach(() => {
  for (const directory of temporaryRoots.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('Node tooling ambient types', () => {
  it('rejects browser globals through the actual script project while accepting Node APIs', () => {
    const result = compileProbe(false);
    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toBe('');
    const diagnostics = result.stdout.trim().split('\n');
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0]).toMatch(/^.*probe\.ts\(7,6\): error TS2584: Cannot find name 'document'\./);
    expect(diagnostics[1]).toMatch(/^.*probe\.ts\(8,6\): error TS2304: Cannot find name 'window'\./);
    expect(result.files.some((file) => file.endsWith('/lib.dom.d.ts'))).toBe(false);
  });

  it('detects DOM reintroduction in a disposable extension of the real config', () => {
    const result = compileProbe(true);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.files.some((file) => file.endsWith('/lib.dom.d.ts'))).toBe(true);
  });
});
