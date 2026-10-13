import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const knip = resolve(root, 'node_modules/.bin/knip');

interface KnipIssue {
  file: string;
  files: Array<{ name: string }>;
  exports: Array<{ name: string }>;
}

interface KnipReport {
  issues: KnipIssue[];
}

function analyze(mode: 'full' | 'production', config?: string) {
  const args = [
    ...(config ? ['--config', config] : []),
    ...(mode === 'production' ? ['--production', '--tags=-testOnly'] : []),
    '--files',
    '--exports',
    '--dependencies',
    '--treat-config-hints-as-errors',
    '--reporter',
    'json',
  ];
  const result = spawnSync(knip, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.stdout, result.stderr).not.toBe('');
  const report = JSON.parse(result.stdout) as KnipReport;
  return { status: result.status, report, stderr: result.stderr };
}

function expectClean(mode: 'full' | 'production', config?: string): void {
  const result = analyze(mode, config);
  expect(result.status, `${mode}: ${JSON.stringify(result.report)} ${result.stderr}`).toBe(0);
  expect(result.report.issues).toEqual([]);
}

function createOwned(path: string, content: string, owned: string[]): void {
  writeFileSync(resolve(root, path), content, { flag: 'wx' });
  owned.push(path);
}

describe('Knip reachability boundaries', () => {
  it('rejects orphan script and runtime helpers in full analysis and restores the baseline', () => {
    const id = randomUUID();
    const script = `scripts/ci/xeg-knip-orphan-${id}.ts`;
    const runtime = `validation/windows/xeg-knip-orphan-${id}.mjs`;
    const owned: string[] = [];
    try {
      expectClean('full');
      expectClean('production');
      createOwned(script, 'export const orphan = 1;\n', owned);
      createOwned(runtime, 'export const orphan = 1;\n', owned);

      const full = analyze('full');
      expect(full.status, JSON.stringify(full.report)).toBe(1);
      for (const path of [script, runtime]) {
        expect(full.report.issues.find((issue) => issue.file === path)?.files).toEqual([
          { name: path },
        ]);
      }

      // Production mode intentionally excludes direct Node tooling.
      const production = analyze('production');
      expect(production.status, JSON.stringify(production.report)).toBe(0);
      expect(production.report.issues).toEqual([]);
    } finally {
      for (const path of owned) {
        unlinkSync(resolve(root, path));
      }
    }
    expectClean('full');
    expectClean('production');
  }, 30_000);

  it('resolves genuine source and runtime roots and rejects an unnecessary source export', () => {
    const id = randomUUID();
    const config = `knip.reachability-probe-${id}.json`;
    const sourceRoot = `src/xeg-knip-root-${id}.ts`;
    const sourceHelper = `src/shared/utils/xeg-knip-helper-${id}.ts`;
    const testRoot = `test/unit/tooling/xeg-knip-tag-${id}.test.ts`;
    const runtimeRoot = `validation/windows/xeg-knip-runtime-${id}.mjs`;
    const runtimeHelper = `validation/windows/xeg-knip-helper-${id}.mjs`;
    const sourceContent =
      '/** @testOnly */\nexport const onlyForTests = 1;\nexport const used = 2;\n';
    const owned: string[] = [];
    try {
      const configData = JSON.parse(readFileSync(resolve(root, 'knip.json'), 'utf8')) as {
        entry: string[];
      };
      configData.entry.push(`${sourceRoot}!`, runtimeRoot);
      createOwned(config, `${JSON.stringify(configData)}\n`, owned);
      createOwned(
        sourceRoot,
        `import { used } from '@shared/utils/xeg-knip-helper-${id}';\nvoid used;\n`,
        owned
      );
      createOwned(sourceHelper, sourceContent, owned);
      createOwned(
        testRoot,
        `import { onlyForTests } from '@shared/utils/xeg-knip-helper-${id}';\nvoid onlyForTests;\n`,
        owned
      );
      createOwned(
        runtimeRoot,
        `import { runtimeValue } from './xeg-knip-helper-${id}.mjs';\nvoid runtimeValue;\n`,
        owned
      );
      createOwned(runtimeHelper, 'export const runtimeValue = 1;\n', owned);

      expectClean('full', config);
      expectClean('production', config);

      writeFileSync(resolve(root, sourceHelper), `${sourceContent}export const unnecessary = 3;\n`);
      for (const mode of ['full', 'production'] as const) {
        const result = analyze(mode, config);
        expect(result.status, JSON.stringify(result.report)).toBe(1);
        expect(
          result.report.issues.find((issue) => issue.file === sourceHelper)?.exports
        ).toContainEqual(expect.objectContaining({ name: 'unnecessary' }));
      }

      writeFileSync(resolve(root, sourceHelper), sourceContent);
      expectClean('full', config);
      expectClean('production', config);

      writeFileSync(resolve(root, sourceHelper), sourceContent.replace('/** @testOnly */\n', ''));
      expectClean('full', config);
      const untagged = analyze('production', config);
      expect(untagged.status, JSON.stringify(untagged.report)).toBe(1);
      expect(
        untagged.report.issues.find((issue) => issue.file === sourceHelper)?.exports
      ).toContainEqual(expect.objectContaining({ name: 'onlyForTests' }));

      writeFileSync(resolve(root, sourceHelper), sourceContent);
      expectClean('full', config);
      expectClean('production', config);
    } finally {
      for (const path of owned.reverse()) {
        unlinkSync(resolve(root, path));
      }
    }
    expectClean('full');
    expectClean('production');
  }, 40_000);
});
