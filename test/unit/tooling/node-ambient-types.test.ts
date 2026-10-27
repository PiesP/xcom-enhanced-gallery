import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const vp = resolve(root, 'node_modules/vite-plus/bin/vp');
const temporaryRoots: string[] = [];

type CheckResult = { status: number | null; stdout: string; stderr: string };

function check(
  relativeDirectory: string,
  code: string,
  extraFiles: Record<string, string> = {}
): CheckResult {
  const directory = mkdtempSync(join(root, relativeDirectory, 'type-boundary-'));
  temporaryRoots.push(directory);
  const source = join(directory, 'probe.ts');
  writeFileSync(source, code);
  for (const [name, contents] of Object.entries(extraFiles)) {
    writeFileSync(join(directory, name), contents);
  }
  const result = spawnSync(process.execPath, [vp, 'check', '--no-fmt', '--no-lint', source], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.error, result.error?.message).toBeUndefined();
  return result;
}

function expectClean(result: CheckResult): void {
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toContain('Found no type errors in 1 file');
}

function expectTypeErrors(result: CheckResult, ...diagnostics: string[]): void {
  expect(result.status, result.stdout + result.stderr).toBe(1);
  for (const diagnostic of diagnostics) {
    expect(result.stdout).toContain(diagnostic);
  }
  expect(result.stdout).toMatch(/Found \d+ errors? and 0 warnings in 1 file/);
}

interface LintReport {
  diagnostics: { code: string; severity: string }[];
  number_of_files: number;
}

function lint(relativePath: string) {
  const result = spawnSync(vp, ['lint', relativePath, '--format=json'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.error).toBeUndefined();
  const report = JSON.parse(result.stdout) as LintReport;
  expect(report.number_of_files).toBe(1);
  return { status: result.status, report };
}

function withLintProbe(run: (replace: (code: string) => ReturnType<typeof lint>) => void): void {
  const relativePath = `src/shared/utils/xeg-node-boundary-${process.pid}-${randomUUID()}.ts`;
  const absolutePath = resolve(root, relativePath);
  let created = false;
  const replace = (code: string): ReturnType<typeof lint> => {
    writeFileSync(absolutePath, code, { flag: created ? 'w' : 'wx' });
    created = true;
    return lint(relativePath);
  };
  try {
    run(replace);
  } finally {
    if (created) {
      unlinkSync(absolutePath);
    }
  }
}

afterEach(() => {
  for (const directory of temporaryRoots.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('native Vite+ type project boundaries', () => {
  it('accepts browser DOM, Solid, aliases, and build flags while rejecting Node ambient types', () => {
    expectClean(
      check(
        'src/shared/utils',
        [
          "import { createSignal } from 'solid-js';",
          "import { clampIndex } from '@piesp/browser-core/util';",
          "import '@main';",
          'void createSignal(0);',
          'void clampIndex(0, 1);',
          'void document.title;',
          'void window.location;',
          'void __DEV__;',
          'void __VERSION__;',
          'void import.meta.env.MODE;',
        ].join('\n')
      )
    );
    expectTypeErrors(
      check(
        'src/shared/utils',
        [
          'void process.version;',
          'void Buffer.from("node");',
          "import { clampIndex } from '@piesp/browser-core/util';",
          "void clampIndex('wrong', 1);",
          "import type { Stats } from 'node:fs';",
          'export type FileStats = Stats;',
        ].join('\n')
      ),
      "Cannot find name 'process'",
      "Cannot find name 'Buffer'",
      "Cannot find name 'node:fs'",
      "Argument of type 'string' is not assignable to parameter of type 'number'"
    );
  });

  it('keeps BrowserMode DOM access and rejects Node globals', () => {
    expectClean(
      check(
        'test/browser',
        "import { expect } from 'vite-plus/test';\nexpect(document.title).toBeTypeOf('string');\n"
      )
    );
    expectTypeErrors(
      check('test/browser', 'void document.title;\nvoid process.version;\n'),
      "Cannot find name 'process'"
    );
  });

  for (const directory of ['scripts', 'tooling', 'test/firefox'] as const) {
    it(`accepts Node and rejects DOM globals in ${directory}`, () => {
      expectClean(
        check(
          directory,
          "import { readFileSync } from 'node:fs';\nvoid readFileSync(process.execPath);\nvoid Buffer.from('node');\n"
        )
      );
      expectTypeErrors(
        check(directory, 'void process.version;\nvoid document.title;\nvoid window.location;\n'),
        "Cannot find name 'document'",
        "Cannot find name 'window'"
      );
    });
  }

  it('retains NodeNext extensions, erased syntax, and strict optional/indexed checks', () => {
    expectTypeErrors(
      check(
        'scripts',
        [
          'enum ToolMode { Ready }',
          'void ToolMode;',
          'const optional: { enabled?: boolean } = { enabled: undefined };',
          'void optional;',
          'const first: number = [1][0];',
          'void first;',
          "import { helper } from './helper';",
          'void helper;',
        ].join('\n'),
        { 'helper.ts': 'export const helper = 1;\n' }
      ),
      'erasableSyntaxOnly',
      'exactOptionalPropertyTypes',
      "Type 'number | undefined' is not assignable",
      'TS2835'
    );
  });

  it('keeps Windows NodeNext fixtures in the DOM-enabled project', () => {
    expectClean(
      check(
        'validation/windows/fixtures',
        "import { readFileSync } from 'node:fs';\nvoid readFileSync;\nvoid process.version;\nvoid document.title;\n"
      )
    );
  });

  for (const directory of ['test/unit', 'test/e2e'] as const) {
    it(`accepts Node and DOM in hosted ${directory} tests`, () => {
      expectClean(
        check(
          directory,
          "import { readFileSync } from 'node:fs';\nvoid readFileSync;\nvoid process.version;\nvoid document.title;\n"
        )
      );
      expectTypeErrors(
        check(directory, 'const value: number = "wrong";\nvoid value;\n'),
        "Type 'string' is not assignable to type 'number'"
      );
    });
  }
});

describe('Oxlint browser Node-import boundary', () => {
  const cases = [
    [
      "import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n",
      "import { createSignal } from 'solid-js';\nexport const state = createSignal(0);\n",
    ],
    [
      "import { readFileSync } from 'fs';\nexport const read = readFileSync;\n",
      "import { createSignal } from 'solid-js';\nexport const state = createSignal(0);\n",
    ],
    [
      "import type { Stats } from 'node:fs';\nexport type FileStats = Stats;\n",
      "import type { Accessor } from 'solid-js';\nexport type Count = Accessor<number>;\n",
    ],
    [
      "import type { Stats } from 'fs';\nexport type FileStats = Stats;\n",
      "import type { Accessor } from 'solid-js';\nexport type Count = Accessor<number>;\n",
    ],
    ["export type { Stats } from 'node:fs';\n", "export type { Accessor } from 'solid-js';\n"],
    ["export type { Stats } from 'fs';\n", "export type { Accessor } from 'solid-js';\n"],
    [
      "export const load = () => import('node:fs');\n",
      "export const load = () => import('solid-js');\n",
    ],
    [
      "export const load = () => import('fs');\n",
      "export const load = () => import('solid-js');\n",
    ],
  ] as const;
  for (const [index, [invalid, valid]] of cases.entries()) {
    it(`rejects Node import form ${index + 1} and restores a valid import`, () => {
      withLintProbe((replace) => {
        const cleanBefore = replace(valid);
        expect(cleanBefore.status, JSON.stringify(cleanBefore.report.diagnostics)).toBe(0);
        const blocked = replace(invalid);
        expect(blocked.status, JSON.stringify(blocked.report.diagnostics)).toBe(1);
        expect(
          blocked.report.diagnostics.filter((item) => item.code === 'eslint(no-restricted-imports)')
        ).toEqual([expect.objectContaining({ code: 'eslint(no-restricted-imports)' })]);
        const cleanAfter = replace(valid);
        expect(cleanAfter.status, JSON.stringify(cleanAfter.report.diagnostics)).toBe(0);
      });
    });
  }
});
