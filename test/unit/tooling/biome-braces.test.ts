import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const biome = resolve(root, 'node_modules/.bin/biome');
const rule = 'lint/style/useBlockStatements';

interface BiomeReport {
  summary: { changed: number; unchanged: number; skipped: number };
  diagnostics: Array<{ category: string; severity: string }>;
}

function runBiome(args: string[]) {
  const result = spawnSync(biome, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.error, result.error?.message).toBeUndefined();
  return result;
}

function format(path: string): void {
  const result = runBiome(['format', '--write', path]);
  expect(result.status, result.stderr).toBe(0);
}

function check(path: string): { status: number | null; report: BiomeReport } {
  const result = runBiome(['check', '--reporter=json', path]);
  const report = JSON.parse(result.stdout) as BiomeReport;
  expect(report.summary.changed + report.summary.unchanged, result.stderr).toBe(1);
  expect(report.summary.skipped).toBe(0);
  expect(report.diagnostics.some((item) => item.category.startsWith('parse'))).toBe(false);
  return { status: result.status, report };
}

function withProbe(
  directory: string,
  extension: string,
  test: (path: string, replace: (source: string) => void) => void
): void {
  const path = `${directory}/xeg-biome-braces-${process.pid}-${randomUUID()}.${extension}`;
  // The fixture never matches Vitest's test-file pattern.
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
    if (created) {
      unlinkSync(absolutePath);
    }
  }
}

const cases = [
  {
    name: 'if body',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function value(flag: boolean): number {\n  if (flag) {\n    return 1;\n  }\n  return 0;\n}\n',
    invalid:
      'export function value(flag: boolean): number {\n  if (flag) return 1;\n  return 0;\n}\n',
  },
  {
    name: 'else body',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function value(flag: boolean): number {\n  if (flag) {\n    return 1;\n  } else {\n    return 0;\n  }\n}\n',
    invalid:
      'export function value(flag: boolean): number {\n  if (flag) {\n    return 1;\n  } else return 0;\n}\n',
  },
  {
    name: 'dangling else binds to the inner condition',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function value(first: boolean, second: boolean): number {\n  if (first) {\n    if (second) {\n      return 1;\n    } else {\n      return 2;\n    }\n  }\n  return 3;\n}\n',
    invalid:
      'export function value(first: boolean, second: boolean): number {\n  if (first)\n    if (second) return 1;\n    else return 2;\n  return 3;\n}\n',
  },
  {
    name: 'for body',
    directory: 'scripts/check',
    extension: 'ts',
    valid:
      'export function total(): number {\n  let sum = 0;\n  for (let index = 0; index < 3; index++) {\n    sum += index;\n  }\n  return sum;\n}\n',
    invalid:
      'export function total(): number {\n  let sum = 0;\n  for (let index = 0; index < 3; index++) sum += index;\n  return sum;\n}\n',
  },
  {
    name: 'for-of body',
    directory: 'validation/windows',
    extension: 'mjs',
    valid:
      'export function total(values) {\n  let sum = 0;\n  for (const value of values) {\n    sum += value;\n  }\n  return sum;\n}\n',
    invalid:
      'export function total(values) {\n  let sum = 0;\n  for (const value of values) sum += value;\n  return sum;\n}\n',
  },
  {
    name: 'while body',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function value(): number {\n  let count = 0;\n  while (count < 2) {\n    count++;\n  }\n  return count;\n}\n',
    invalid:
      'export function value(): number {\n  let count = 0;\n  while (count < 2) count++;\n  return count;\n}\n',
  },
  {
    name: 'do-while body',
    directory: 'src/shared/utils',
    extension: 'ts',
    valid:
      'export function value(): number {\n  let count = 0;\n  do {\n    count++;\n  } while (count < 2);\n  return count;\n}\n',
    invalid:
      'export function value(): number {\n  let count = 0;\n  do count++;\n  while (count < 2);\n  return count;\n}\n',
  },
] as const;

describe('Biome block statement policy', () => {
  it('configures block statements as an error', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'biome.json'), 'utf8')) as {
      linter: { rules: { style: { useBlockStatements: string } } };
    };
    expect(config.linter.rules.style.useBlockStatements).toBe('error');
  });

  it.each(cases)('requires braces for $name', ({ directory, extension, valid, invalid }) => {
    withProbe(directory, extension, (path, replace) => {
      replace(valid);
      const control = check(path);
      expect(control.status, JSON.stringify(control.report.diagnostics)).toBe(0);

      replace(invalid);
      const violation = check(path);
      expect(violation.status).toBe(1);
      const errors = violation.report.diagnostics.filter((item) => item.severity === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.every((item) => item.category === rule),
        JSON.stringify(errors)
      ).toBe(true);

      replace(valid);
      const restored = check(path);
      expect(restored.status, JSON.stringify(restored.report.diagnostics)).toBe(0);
    });
  });
});
