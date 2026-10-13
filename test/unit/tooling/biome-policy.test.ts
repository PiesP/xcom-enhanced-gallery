import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const biome = resolve(root, 'node_modules/.bin/biome');

interface Diagnostic {
  category: string;
  severity: 'error' | 'warning' | 'info';
}

interface BiomeReport {
  summary: { changed: number; unchanged: number; skipped: number };
  diagnostics: Diagnostic[];
}

function runBiome(args: string[]): { status: number | null; report: BiomeReport; stderr: string } {
  const result = spawnSync(biome, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.error, result.error?.message).toBeUndefined();
  return {
    status: result.status,
    report: JSON.parse(result.stdout) as BiomeReport,
    stderr: result.stderr,
  };
}

function check(path: string): { status: number | null; report: BiomeReport } {
  const result = runBiome(['check', '--reporter=json', path]);
  expect(result.report.summary.changed + result.report.summary.unchanged, result.stderr).toBe(1);
  expect(result.report.summary.skipped).toBe(0);
  expect(result.report.diagnostics.some((item) => item.category === 'parse')).toBe(false);
  return result;
}

function format(path: string): void {
  const result = spawnSync(biome, ['format', '--write', path], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
}

function withProbe(
  directory: string,
  extension: string,
  test: (path: string, replace: (source: string) => void) => void
): void {
  // These files are never Vitest test files, even when they contain an `.only` fixture.
  const path = `${directory}/xeg-biome-policy-${process.pid}-${randomUUID()}.${extension}`;
  expect(path).not.toMatch(/\.test\.[cm]?[jt]sx?$/);
  const absolutePath = resolve(root, path);
  let created = false;
  const replace = (source: string): void => {
    writeFileSync(absolutePath, source, { flag: created ? 'w' : 'wx' });
    created = true;
    format(path);
  };
  try {
    test(path, replace);
  } finally {
    if (created) unlinkSync(absolutePath);
  }
}

function expectClean(result: ReturnType<typeof check>): void {
  expect(result.status, JSON.stringify(result.report.diagnostics)).toBe(0);
  expect(result.report.diagnostics.filter((item) => item.severity === 'error')).toEqual([]);
}

function expectRule(
  result: ReturnType<typeof check>,
  category: string,
  severity: 'error' | 'warning' = 'error'
): void {
  expect(result.status, JSON.stringify(result.report.diagnostics)).toBe(
    severity === 'error' ? 1 : 0
  );
  const errors = result.report.diagnostics.filter((item) => item.severity === 'error');
  expect(errors.map((item) => item.category)).toEqual(severity === 'error' ? [category] : []);
  expect(result.report.diagnostics).toContainEqual(expect.objectContaining({ category, severity }));
}

interface PolicyCase {
  name: string;
  directory: string;
  extension: string;
  valid: string;
  invalid: string;
  category: string;
  severity?: 'error' | 'warning';
}

const cases: PolicyCase[] = [
  {
    name: 'unused imports',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: "import { createSignal } from 'solid-js';\n\nexport const value = createSignal(1);\n",
    invalid: "import { createSignal } from 'solid-js';\n\nexport const value = 1;\n",
    category: 'lint/correctness/noUnusedImports',
  },
  {
    name: 'template literals without interpolation',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: "export const label = 'static';\n",
    invalid: 'export const label = `static`;\n',
    category: 'lint/style/noUnusedTemplateLiteral',
  },
  {
    name: 'exponentiation syntax',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export const squared = 2 ** 2;\n',
    invalid: 'export const squared = Math.pow(2, 2);\n',
    category: 'lint/style/useExponentiationOperator',
  },
  {
    name: 'untyped deferred let bindings',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function number(): number {\n  let result: number;\n  result = 1;\n  result = 2;\n  return result;\n}\n',
    invalid:
      'export function number(): number {\n  let result;\n  result = 1;\n  result = 2;\n  return result;\n}\n',
    category: 'lint/suspicious/noImplicitAnyLet',
  },
  {
    name: 'iterable callbacks returning values',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export const values = [1, 2].map((value) => value * 2);\n',
    invalid: 'export const values = [1, 2].map((value) => {\n  value.toString();\n});\n',
    category: 'lint/suspicious/useIterableCallbackReturn',
  },
  {
    name: 'unnecessary boolean ternaries',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export function positive(value: number): boolean {\n  return value > 0;\n}\n',
    invalid:
      'export function positive(value: number): boolean {\n  return value > 0 ? true : false;\n}\n',
    category: 'lint/complexity/noUselessTernary',
  },
  {
    name: 'empty cases before defaults',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function choose(value: number): number {\n  switch (value) {\n    case 0:\n      return 0;\n    default:\n      return 1;\n  }\n}\n',
    invalid:
      'export function choose(value: number): number {\n  switch (value) {\n    case 0:\n    default:\n      return 1;\n  }\n}\n',
    category: 'lint/complexity/noUselessSwitchCase',
  },
  {
    name: 'empty exports in modules',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export const value = 1;\n',
    invalid: 'export const value = 1;\nexport {};\n',
    category: 'lint/complexity/noUselessEmptyExport',
  },
  {
    name: 'useless lone blocks',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export const value = 1;\n',
    invalid: '{}\nexport const value = 1;\n',
    category: 'lint/complexity/noUselessLoneBlockStatements',
  },
  {
    name: 'quadratic accumulating spread',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function copy(items: number[]): number[] {\n  return items.reduce((acc, item) => {\n    acc.push(item);\n    return acc;\n  }, [] as number[]);\n}\n',
    invalid:
      'export function copy(items: number[]): number[] {\n  return items.reduce((acc, item) => [...acc, item], [] as number[]);\n}\n',
    category: 'lint/performance/noAccumulatingSpread',
  },
  {
    name: 'ARIA properties supported by the element role',
    directory: 'src/shared/components/ui',
    extension: 'tsx',
    valid: 'export function Link() {\n  return <a href="/gallery" aria-expanded>Gallery</a>;\n}\n',
    invalid: 'export function Link() {\n  return <a href="/gallery" aria-checked>Gallery</a>;\n}\n',
    category: 'lint/a11y/useAriaPropsSupportedByRole',
  },
  {
    name: 'unused symbols in a maintained Windows module',
    directory: 'validation/windows',
    extension: 'mjs',
    valid: 'export const used = 1;\n',
    invalid: 'const orphan = 1;\nexport const used = 1;\n',
    category: 'lint/correctness/noUnusedVariables',
  },
  {
    name: 'parameter rebinding while allowing property mutation',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function update(state: { count: number }): number {\n  state.count += 1;\n  return state.count;\n}\n',
    invalid: 'export function update(count: number): number {\n  count += 1;\n  return count;\n}\n',
    category: 'lint/style/noParameterAssign',
  },
  {
    name: 'self comparisons',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export function equal(a: number, b: number): boolean {\n  return a === b;\n}\n',
    invalid: 'export function equal(a: number): boolean {\n  return a === a;\n}\n',
    category: 'lint/suspicious/noSelfCompare',
  },
  {
    name: 'assignments inside expressions',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function next(value: number): number {\n  const nextValue = value + 1;\n  return nextValue;\n}\n',
    invalid:
      'export function next(value: number): boolean {\n  let nextValue = value;\n  return (nextValue = 1) > 0;\n}\n',
    category: 'lint/suspicious/noAssignInExpressions',
  },
  {
    name: 'control character escapes in regular expressions',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export const whitespace = /\\t/;\n',
    invalid: 'export const nul = /\\x00/;\n',
    category: 'lint/suspicious/noControlCharactersInRegex',
  },
  {
    name: 'cookie writes while allowing reads',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export function readCookie(): string {\n  return document.cookie;\n}\n',
    invalid: 'export function writeCookie(): void {\n  document.cookie = "session=invalid";\n}\n',
    category: 'lint/suspicious/noDocumentCookie',
  },
  {
    name: 'unknown CSS media features',
    directory: 'src/features/gallery/styles',
    extension: 'css',
    valid: '@media (prefers-reduced-motion: reduce) { .probe { color: red; } }\n',
    invalid: '@media (xeg-unknown-feature: yes) { .probe { color: red; } }\n',
    category: 'lint/correctness/noUnknownMediaFeatureName',
  },
  {
    name: 'unknown CSS pseudo elements',
    directory: 'src/features/gallery/styles',
    extension: 'css',
    valid: '.probe::before { content: ""; }\n',
    invalid: '.probe::xeg-unknown { content: ""; }\n',
    category: 'lint/correctness/noUnknownPseudoElement',
  },
  {
    name: 'focused tests without running their fixture',
    directory: 'test/unit/tooling',
    extension: 'ts',
    valid: "import { it } from 'vitest';\n\nit('case', () => {});\n",
    invalid: "import { it } from 'vitest';\n\nit.only('case', () => {});\n",
    category: 'lint/suspicious/noFocusedTests',
  },
  {
    name: 'caption tracks on ordinary product video',
    directory: 'src/shared/components/ui',
    extension: 'tsx',
    valid:
      'export function Video() {\n  return <video controls><track kind="captions" src="/captions.vtt" /></video>;\n}\n',
    invalid: 'export function Video() {\n  return <video controls />;\n}\n',
    category: 'lint/a11y/useMediaCaption',
  },
  {
    name: 'accessible SVG titles',
    directory: 'src/shared/components/ui',
    extension: 'tsx',
    valid: 'export function Icon() {\n  return <svg><title>Close</title></svg>;\n}\n',
    invalid: 'export function Icon() {\n  return <svg><circle /></svg>;\n}\n',
    category: 'lint/a11y/noSvgWithoutTitle',
  },
  {
    name: 'void types used outside returns',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid: 'export type Task = () => void;\n',
    invalid: 'export type Maybe = number | void;\n',
    category: 'lint/suspicious/noConfusingVoidType',
    severity: 'warning',
  },
  {
    name: 'Solid list rendering trial',
    directory: 'src/features/gallery/components',
    extension: 'tsx',
    valid:
      "import { For } from 'solid-js';\nexport function List(props: { items: string[] }) {\n  return <ul><For each={props.items}>{(item) => <li>{item}</li>}</For></ul>;\n}\n",
    invalid:
      'export function List(props: { items: string[] }) {\n  return <ul>{props.items.map((item) => <li>{item}</li>)}</ul>;\n}\n',
    category: 'lint/performance/useSolidForComponent',
    severity: 'warning',
  },
];

describe('Biome rule policy', () => {
  it('retains explicit error-level protections in parsed root configuration', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'biome.json'), 'utf8')) as {
      linter: { rules: Record<string, Record<string, string> | string> };
    };
    const expected: Record<string, string[]> = {
      correctness: ['noUnusedImports'],
      style: ['useConst', 'noUnusedTemplateLiteral', 'useExponentiationOperator'],
      suspicious: ['noExplicitAny', 'noImplicitAnyLet', 'useIterableCallbackReturn'],
      complexity: [
        'noUselessTernary',
        'noUselessSwitchCase',
        'noUselessEmptyExport',
        'noUselessLoneBlockStatements',
      ],
      performance: ['noAccumulatingSpread'],
      a11y: [
        'noStaticElementInteractions',
        'useKeyWithClickEvents',
        'noSvgWithoutTitle',
        'useAriaPropsSupportedByRole',
        'useSemanticElements',
      ],
    };
    for (const [group, rules] of Object.entries(expected)) {
      const configured = config.linter.rules[group];
      expect(configured, group).toBeTypeOf('object');
      for (const rule of rules) {
        expect((configured as Record<string, string>)[rule], `${group}/${rule}`).toBe('error');
      }
    }
  });

  it.each(cases)('$name', ({ directory, extension, valid, invalid, category, severity }) => {
    withProbe(directory, extension, (path, replace) => {
      replace(valid);
      expectClean(check(path));
      replace(invalid);
      expectRule(check(path), category, severity);
      replace(valid);
      expectClean(check(path));
    });
  });

  it('protects Solid prop reactivity while allowing splitProps and accessors', () => {
    withProbe('src/features/gallery/components', 'tsx', (path, replace) => {
      const split =
        "import { splitProps } from 'solid-js';\nexport function Card(props: { label: string }) {\n  const [local] = splitProps(props, ['label']);\n  return <span>{local.label}</span>;\n}\n";
      const accessor =
        'export function Card(props: { label: string }) {\n  const label = () => props.label;\n  return <span>{label()}</span>;\n}\n';
      replace(split);
      expectClean(check(path));
      replace(accessor);
      expectClean(check(path));
      replace(
        'export function Card({ label }: { label: string }) {\n  return <span>{label}</span>;\n}\n'
      );
      expectRule(check(path), 'lint/correctness/noSolidDestructuredProps');
      replace(split);
      expectClean(check(path));
    });
  });

  it('requires semantic keyboard-accessible controls', () => {
    withProbe('src/shared/components/ui', 'tsx', (path, replace) => {
      const valid =
        'export function Control() {\n  return <button type="button" onClick={() => {}}>Open</button>;\n}\n';
      replace(valid);
      expectClean(check(path));
      replace('export function Control() {\n  return <div onClick={() => {}}>Open</div>;\n}\n');
      const invalid = check(path);
      expect(invalid.status).toBe(1);
      expect(
        invalid.report.diagnostics
          .filter((item) => item.severity === 'error')
          .map((item) => item.category)
          .sort()
      ).toEqual(
        ['lint/a11y/noStaticElementInteractions', 'lint/a11y/useKeyWithClickEvents'].sort()
      );
      replace(valid);
      expectClean(check(path));
    });
  });

  it('rejects product non-null assertions while allowing intentional test assertions', () => {
    const valid =
      'export function size(value: string | null): number {\n  return value?.length ?? 0;\n}\n';
    const invalid =
      'export function size(value: string | null): number {\n  return value!.length;\n}\n';
    withProbe('src/shared/utils', 'ts', (path, replace) => {
      replace(valid);
      expectClean(check(path));
      replace(invalid);
      expectRule(check(path), 'lint/style/noNonNullAssertion');
      replace(valid);
      expectClean(check(path));
    });
    withProbe('test/unit/tooling', 'ts', (path, replace) => {
      replace(valid);
      expectClean(check(path));
      replace(invalid);
      const intentional = check(path);
      expectClean(intentional);
      expect(intentional.report.diagnostics.map((item) => item.category)).not.toContain(
        'lint/style/noNonNullAssertion'
      );
      replace(valid);
      expectClean(check(path));
    });
  });
});
