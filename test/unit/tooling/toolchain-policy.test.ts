import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const vp = resolve(root, 'node_modules/.bin/vp');

function probe(directory: string, extension: string, source: string, run: (path: string) => void) {
  const path = `${directory}/xeg-toolchain-probe-${process.pid}-${randomUUID()}.${extension}`;
  const absolutePath = resolve(root, path);
  writeFileSync(absolutePath, source, { flag: 'wx' });
  try {
    run(path);
  } finally {
    unlinkSync(absolutePath);
  }
}

function diagnostics(command: string, args: string[]): { status: number | null; codes: string[] } {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', timeout: 15_000 });
  expect(result.error).toBeUndefined();
  const report = JSON.parse(result.stdout) as {
    diagnostics: Array<{ code?: string; category?: string }>;
  };
  return {
    status: result.status,
    codes: report.diagnostics.map((item) => item.code ?? item.category ?? ''),
  };
}

describe('toolchain policy boundaries', () => {
  it.each([
    { directory: 'src/shared/utils', extension: 'ts', source: 'export const value=1;\n' },
    {
      directory: 'test/e2e/fixtures',
      extension: 'html',
      source:
        '<!doctype html><html lang="en"><head><title>Probe</title></head><body><div>value</div></body></html>\n',
    },
  ])('checks .$extension formatting without writing', ({ directory, extension, source }) => {
    probe(directory, extension, source, (path) => {
      const result = spawnSync(vp, ['fmt', path, '--check'], {
        cwd: root,
        encoding: 'utf8',
        timeout: 15_000,
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(readFileSync(resolve(root, path), 'utf8')).toBe(source);
    });
  });

  it.each([
    {
      directory: 'src/shared/utils',
      extension: 'ts',
      source: 'export const value: any = 1;\n',
      code: 'typescript(no-explicit-any)',
    },
    {
      directory: 'src/shared/utils',
      extension: 'ts',
      source: 'export function value(input: string | null) { return input!.length; }\n',
      code: 'typescript(no-non-null-assertion)',
    },
    {
      directory: 'test/unit/tooling',
      extension: 'ts',
      source: "import { it } from 'vite-plus/test';\nit.only('probe', () => {});\n",
      code: 'vitest(no-focused-tests)',
    },
    {
      directory: 'src/shared/utils',
      extension: 'ts',
      source: 'export function value(flag: boolean) { if (flag) return 1; return 0; }\n',
      code: 'eslint(curly)',
    },
    {
      directory: 'src/shared/utils',
      extension: 'ts',
      source: "export function setCookie() { document.cookie = 'x=y'; }\n",
      code: 'unicorn(no-document-cookie)',
    },
  ])('rejects $code through Oxlint', ({ directory, extension, source, code }) => {
    probe(directory, extension, source, (path) => {
      const result = diagnostics(vp, ['lint', path, '--format=json']);
      expect(result.status).toBe(1);
      expect(result.codes).toContain(code);
    });
  });

  it.each([
    {
      source:
        'export const collect = (items: number[]) => items.reduce<number[]>((acc, item) => [...acc, item], []);\n',
      code: 'oxc(no-accumulating-spread)',
    },
    {
      source:
        'export function value(input: number) { switch (input) { case 1: default: return 1; } }\n',
      code: 'unicorn(no-useless-switch-case)',
    },
    {
      source: 'export function value(flag: boolean) { if (flag = true) return 1; return 0; }\n',
      code: 'eslint(no-cond-assign)',
    },
  ])('rejects native $code policy violations', ({ source, code }) => {
    probe('src/shared/utils', 'ts', source, (path) => {
      const result = diagnostics(vp, ['lint', path, '--format=json']);
      expect(result.status).toBe(1);
      expect(result.codes).toContain(code);
    });
  });
});
