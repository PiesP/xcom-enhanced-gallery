import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
const biome = resolve(root, 'node_modules/.bin/biome');
const temporaryRoots: string[] = [];
const nodeProjects = [
  {
    name: 'scripts',
    config: 'tsconfig.scripts.json',
    roots: ['scripts/check/bootstrap.ts', 'scripts/release/prepare.ts'],
  },
  {
    name: 'direct Firefox test',
    config: 'tsconfig.node-tests.json',
    roots: ['test/e2e/firefox-extension-runtime.test.ts'],
  },
  {
    name: 'tooling',
    config: 'tsconfig.tooling.json',
    roots: ['vite.config.ts', 'vitest.config.ts'],
  },
] as const;

function runCompiler(config: string, args: string[]) {
  const result = spawnSync(process.execPath, [tsc, '-p', config, ...args, '--pretty', 'false'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  expect(result.error, result.error?.message).toBeUndefined();
  return result;
}

function listFiles(config: string): string[] {
  const listed = runCompiler(config, ['--listFilesOnly']);
  expect(listed.status, listed.stdout + listed.stderr).toBe(0);
  return listed.stdout.trim().split('\n');
}

function compileProbe(config: string, code: string, options: Record<string, unknown> = {}) {
  const directory = mkdtempSync(join(root, '.node-ambient-probe-'));
  temporaryRoots.push(directory);
  const source = join(directory, 'probe.ts');
  writeFileSync(source, code);
  const probeConfig = join(directory, 'tsconfig.json');
  writeFileSync(
    probeConfig,
    JSON.stringify({
      extends: resolve(root, config),
      // Add the probe while preserving actual project includes and declarations.
      files: [source],
      compilerOptions: { incremental: false, ...options },
    })
  );
  const result = runCompiler(probeConfig, ['--noEmit']);
  const files = listFiles(probeConfig);
  expect(files).toContain(source);
  return { ...result, files, source };
}

function expectOnlyProbeErrors(result: ReturnType<typeof compileProbe>, names: string[]): void {
  expect(result.status, result.stdout + result.stderr).toBe(1);
  expect(result.stderr).toBe('');
  const diagnostics = result.stdout.trim().split('\n');
  expect(diagnostics).toHaveLength(names.length);
  for (const [index, name] of names.entries()) {
    expect(diagnostics[index]).toContain(`${result.source.slice(root.length + 1)}(`);
    expect(diagnostics[index]).toContain(`Cannot find name '${name}'`);
  }
}

function hasDom(files: string[]): boolean {
  return files.some((file) => file.endsWith('/lib.dom.d.ts'));
}

function hasNode(files: string[]): boolean {
  return files.some((file) => file.includes('/@types/node/'));
}

interface BiomeReport {
  summary: { changed: number; unchanged: number; skipped: number };
  diagnostics: { category: string; severity: string }[];
}

function lint(relativePath: string) {
  const result = spawnSync(biome, ['lint', '--reporter=json', relativePath], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.error, result.error?.message).toBeUndefined();
  const report = JSON.parse(result.stdout) as BiomeReport;
  expect(report.summary.changed + report.summary.unchanged, result.stderr).toBe(1);
  expect(report.summary.skipped).toBe(0);
  expect(report.diagnostics.some((diagnostic) => diagnostic.category === 'parse')).toBe(false);
  return { status: result.status, report };
}

function withBiomeProbe(run: (replace: (code: string) => ReturnType<typeof lint>) => void): void {
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

describe('TypeScript runtime boundaries', () => {
  it('loads browser roots and accepts DOM, Solid, and injected build flags', () => {
    const result = compileProbe(
      'tsconfig.json',
      [
        "import { createSignal } from 'solid-js';",
        'void createSignal(0);',
        'void document.title;',
        'void window.location;',
        'void __DEV__;',
        'void __VERSION__;',
        'void __FEATURE_MEDIA_EXTRACTION__;',
        'void import.meta.env.MODE;',
      ].join('\n')
    );
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.files).toContain(resolve(root, 'src/main.ts'));
    expect(result.files).toContain(resolve(root, 'src/types/env.d.ts'));
    expect(hasDom(result.files)).toBe(true);
    expect(hasNode(result.files)).toBe(false);
  });

  it('rejects implicit Node globals in browser code', () => {
    const result = compileProbe(
      'tsconfig.json',
      'void process.version;\nvoid Buffer.from("node");\n'
    );
    expectOnlyProbeErrors(result, ['process', 'Buffer']);
    expect(hasDom(result.files)).toBe(true);
    expect(hasNode(result.files)).toBe(false);
  });

  it('rejects an explicit Node type import without loading Node ambient declarations', () => {
    const result = compileProbe(
      'tsconfig.json',
      "import type { Stats } from 'node:fs';\nexport type FileStats = Stats;\nvoid process.version;\n"
    );
    expectOnlyProbeErrors(result, ['node:fs', 'process']);
    expect(hasNode(result.files)).toBe(false);
  });

  for (const project of nodeProjects) {
    it(`accepts Node APIs and rejects DOM globals in ${project.name}`, () => {
      const result = compileProbe(
        project.config,
        [
          "import { readFileSync } from 'node:fs';",
          'void readFileSync;',
          'void process.version;',
          "void Buffer.from('node');",
          "void fetch('https://example.invalid');",
          'void AbortController;',
          'void document.title;',
          "void window.alert('browser');",
        ].join('\n')
      );
      expectOnlyProbeErrors(result, ['document', 'window']);
      for (const requiredRoot of project.roots) {
        expect(result.files).toContain(resolve(root, requiredRoot));
      }
      expect(hasDom(result.files)).toBe(false);
      expect(hasNode(result.files)).toBe(true);
    });

    it(`detects and restores DOM reintroduction in a disposable ${project.name} config`, () => {
      const result = compileProbe(project.config, 'void document.title;\nvoid window.location;\n', {
        lib: ['ESNext', 'DOM'],
      });
      expect(result.status, result.stdout + result.stderr).toBe(0);
      expect(hasDom(result.files)).toBe(true);
      expect(hasDom(listFiles(resolve(root, project.config)))).toBe(false);
    });
  }

  it('detects and restores Node ambient reintroduction in a disposable browser config', () => {
    const result = compileProbe('tsconfig.json', 'void process.version;\n', { types: ['node'] });
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(hasNode(result.files)).toBe(true);
    expectOnlyProbeErrors(compileProbe('tsconfig.json', 'void process.version;\n'), ['process']);
  });

  it('keeps Node and DOM types in hosted unit and Playwright projects', () => {
    for (const [config, rootFile] of [
      ['tsconfig.test.json', 'test/unit/tooling/node-ambient-types.test.ts'],
      ['tsconfig.e2e.json', 'test/e2e/playwright.config.ts'],
    ] as const) {
      const files = listFiles(resolve(root, config));
      expect(files).toContain(resolve(root, rootFile));
      expect(files).toContain(resolve(root, 'src/types/env.d.ts'));
      expect(hasDom(files)).toBe(true);
      expect(hasNode(files)).toBe(true);
    }
  });
});

describe('Biome browser Node-import boundary', () => {
  it('covers every public bare builtin exposed by the pinned Node runtime', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'biome.json'), 'utf8')) as {
      overrides: {
        includes: string[];
        linter: {
          rules: {
            style: {
              noRestrictedImports: { options: { patterns: { group: string[] }[] } };
            };
          };
        };
      }[];
    };
    const sourceOverride = config.overrides.find((override) =>
      override.includes.includes('src/**')
    );
    expect(sourceOverride).toBeDefined();
    const group = sourceOverride?.linter.rules.style.noRestrictedImports.options.patterns.flatMap(
      (pattern) => pattern.group
    );
    expect(group).toContain('node:*');
    const publicBare = builtinModules.filter(
      (name) => !name.startsWith('_') && !name.startsWith('node:')
    );
    expect(publicBare.filter((name) => !group?.includes(name))).toEqual([]);
  });

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
      withBiomeProbe((replace) => {
        const cleanBefore = replace(valid);
        expect(cleanBefore.status, JSON.stringify(cleanBefore.report.diagnostics)).toBe(0);
        const blocked = replace(invalid);
        expect(blocked.status, JSON.stringify(blocked.report.diagnostics)).toBe(1);
        expect(blocked.report.diagnostics.filter((item) => item.severity === 'error')).toEqual([
          expect.objectContaining({ category: 'lint/style/noRestrictedImports' }),
        ]);
        const cleanAfter = replace(valid);
        expect(cleanAfter.status, JSON.stringify(cleanAfter.report.diagnostics)).toBe(0);
      });
    });
  }
});
