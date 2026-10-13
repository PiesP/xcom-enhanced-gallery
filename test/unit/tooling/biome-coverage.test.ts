import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const biome = resolve(root, 'node_modules/.bin/biome');
const maxFileSize = 1_048_576;

interface BiomeReport {
  summary: {
    changed: number;
    unchanged: number;
    skipped: number;
    errors: number;
  };
  diagnostics: Array<{ category: string }>;
}

function run(command: string, args: string[], input?: string) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    input,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1' },
  });
  expect(result.error, result.error?.message).toBeUndefined();
  return result;
}

function check(
  paths: string[],
  options: string[] = []
): { status: number | null; report: BiomeReport } {
  const result = run(biome, ['check', '--reporter=json', ...options, ...paths]);
  expect(result.stdout, result.stderr).not.toBe('');
  const report = JSON.parse(result.stdout) as BiomeReport;
  return { status: result.status, report };
}

function ci(path: string): { status: number | null; report: BiomeReport } {
  const result = run(biome, ['ci', '--reporter=json', '--colors=off', path]);
  expect(result.stdout, result.stderr).not.toBe('');
  const report = JSON.parse(result.stdout) as BiomeReport;
  expect(processed(report)).toBe(1);
  expect(report.summary.skipped).toBe(0);
  expect(report.diagnostics.some((diagnostic) => diagnostic.category === 'parse')).toBe(false);
  return { status: result.status, report };
}

function processed(report: BiomeReport): number {
  return report.summary.changed + report.summary.unchanged;
}

function withProbe(path: string, content: string, test: () => void): void {
  const absolutePath = resolve(root, path);
  // Exclusive creation refuses collisions atomically; cleanup starts only after
  // this invocation owns the file.
  writeFileSync(absolutePath, content, { flag: 'wx' });
  try {
    test();
  } finally {
    unlinkSync(absolutePath);
  }
}

const probes = [
  { directory: 'src/shared/utils', extension: 'ts', kind: 'typescript' },
  { directory: 'test/unit/tooling', extension: 'ts', kind: 'typescript' },
  { directory: 'test/unit/tooling', extension: 'tsx', kind: 'tsx' },
  { directory: 'test/visual', extension: 'js', kind: 'module' },
  { directory: 'tooling/vite/plugins', extension: 'ts', kind: 'typescript' },
  { directory: 'scripts/check', extension: 'ts', kind: 'typescript' },
  { directory: '.', extension: 'config.ts', kind: 'typescript' },
  { directory: '.', extension: 'json', kind: 'json' },
  { directory: 'validation/windows', extension: 'mjs', kind: 'module' },
  { directory: '.github/actions/setup-release', extension: 'mjs', kind: 'module' },
  { directory: 'extension', extension: 'json', kind: 'json' },
  { directory: 'src/features/gallery/styles', extension: 'css', kind: 'css' },
] as const;

const examples = {
  typescript: {
    valid: 'export const probe = 1;\n',
    invalid: 'export const probe: any = 1;\n',
    diagnostic: 'lint/suspicious/noExplicitAny',
  },
  tsx: {
    valid: 'export const Probe = () => <div />;\n',
    invalid: 'export const Probe = (value: any) => <div>{value}</div>;\n',
    diagnostic: 'lint/suspicious/noExplicitAny',
  },
  module: {
    valid: 'export const probe = 1;\n',
    invalid: 'let probe = 1;\nexport { probe };\n',
    diagnostic: 'lint/style/useConst',
  },
  json: {
    valid: '{\n  "probe": true\n}\n',
    invalid: '{"probe":true}\n',
    diagnostic: 'format',
  },
  css: {
    valid: '.probe {\n  color: red;\n}\n',
    invalid: '.probe{color:red}\n',
    diagnostic: 'format',
  },
} as const;

describe('Biome managed-file coverage', () => {
  it('loads the root configuration in the canonical read-only command', () => {
    const result = ci('biome.json');
    expect(result.status, JSON.stringify(result.report.diagnostics)).toBe(0);
  });

  it.each([
    {
      name: 'format',
      valid: 'export const probe = 1;\n',
      invalid: 'export const probe=1;\n',
      diagnostic: 'format',
    },
    {
      name: 'lint',
      valid: 'export const probe: number = 1;\n',
      invalid: 'export const probe: any = 1;\n',
      diagnostic: 'lint/suspicious/noExplicitAny',
    },
    {
      name: 'assist',
      valid:
        "import { createEffect, createSignal } from 'solid-js';\nexport const probe = [createEffect, createSignal];\n",
      invalid:
        "import { createSignal, createEffect } from 'solid-js';\nexport const probe = [createSignal, createEffect];\n",
      diagnostic: 'assist/source/organizeImports',
    },
  ])('runs read-only Biome ci for isolated $name violations', (probe) => {
    const path = `test/unit/tooling/xeg-biome-ci-${process.pid}-${randomUUID()}.ts`;
    withProbe(path, probe.valid, () => {
      const valid = ci(path);
      expect(valid.status, JSON.stringify(valid.report.diagnostics)).toBe(0);
      const absolutePath = resolve(root, path);

      writeFileSync(absolutePath, probe.invalid);
      const before = readFileSync(absolutePath);
      const invalid = ci(path);
      expect(invalid.status, JSON.stringify(invalid.report.diagnostics)).toBe(1);
      expect(invalid.report.diagnostics.map((diagnostic) => diagnostic.category)).toEqual([
        probe.diagnostic,
      ]);
      expect(readFileSync(absolutePath)).toEqual(before);

      writeFileSync(absolutePath, probe.valid);
      const restored = ci(path);
      expect(restored.status, JSON.stringify(restored.report.diagnostics)).toBe(0);
      expect(readFileSync(absolutePath, 'utf8')).toBe(probe.valid);
    });
  });

  it.each(probes)('checks valid and violating .$extension in $directory', (probe) => {
    const example = examples[probe.kind];
    const path = `${probe.directory}/xeg-biome-coverage-${process.pid}-${randomUUID()}.${probe.extension}`;
    withProbe(path, example.valid, () => {
      const valid = check([path]);
      expect(valid.status, JSON.stringify(valid.report.diagnostics)).toBe(0);
      expect(processed(valid.report)).toBe(1);
      expect(valid.report.summary.skipped).toBe(0);

      writeFileSync(resolve(root, path), example.invalid);
      const invalid = check([path]);
      expect(invalid.status).toBe(1);
      expect(processed(invalid.report)).toBe(1);
      expect(invalid.report.diagnostics.map((diagnostic) => diagnostic.category)).toContain(
        example.diagnostic
      );
      expect(invalid.report.diagnostics.some((diagnostic) => diagnostic.category === 'parse')).toBe(
        false
      );
      writeFileSync(resolve(root, path), example.valid);
      const restored = check([path]);
      expect(restored.status, JSON.stringify(restored.report.diagnostics)).toBe(0);
      expect(processed(restored.report)).toBe(1);
    });
  });

  it('checks maintained HTML and its embedded JavaScript', () => {
    const path = `test/visual/xeg-biome-coverage-${process.pid}-${randomUUID()}.html`;
    const valid =
      '<!doctype html>\n<html lang="en"><head><title>Probe</title></head><body><script>const probe = 1; document.title = String(probe);</script></body></html>\n';
    withProbe(path, valid, () => {
      const formatted = run(biome, ['format', '--write', path]);
      expect(formatted.status, formatted.stderr).toBe(0);
      const control = check([path]);
      expect(control.status, JSON.stringify(control.report.diagnostics)).toBe(0);
      expect(processed(control.report)).toBe(1);

      const controlBytes = readFileSync(resolve(root, path), 'utf8');
      const invalid = controlBytes.replace('const probe = 1;', 'let probe = 1;');
      expect(invalid).toContain('let probe = 1;');
      writeFileSync(resolve(root, path), invalid);
      const violation = check([path]);
      expect(violation.status).toBe(1);
      expect(processed(violation.report)).toBe(1);
      expect(violation.report.diagnostics.map((diagnostic) => diagnostic.category)).toContain(
        'lint/style/useConst'
      );
      writeFileSync(resolve(root, path), controlBytes);
      expect(check([path]).status).toBe(0);
    });
  });

  it('does not process generated or exact-byte captured HTML fixtures', () => {
    const generatedDirectory = resolve(root, 'dist');
    const directoryExisted = existsSync(generatedDirectory);
    if (!directoryExisted) {
      mkdirSync(generatedDirectory);
    }
    const generated = `dist/xeg-biome-coverage-${process.pid}-${randomUUID()}.ts`;
    try {
      withProbe(generated, 'export const probe: any = 1;\n', () => {
        const ignored = check([generated], ['--no-errors-on-unmatched']);
        expect(ignored.status).toBe(0);
        expect(processed(ignored.report)).toBe(0);
        expect(ignored.report.summary.errors).toBe(0);
        const vcsIgnored = run('git', ['check-ignore', '-q', generated]);
        expect(vcsIgnored.status).toBe(0);
      });
    } finally {
      if (!directoryExisted) {
        rmdirSync(generatedDirectory);
      }
    }

    const captured = 'test/fixtures/authenticated-x-layouts/card.html';
    expect(existsSync(resolve(root, captured))).toBe(true);
    const ignored = check([captured], ['--no-errors-on-unmatched']);
    expect(ignored.status).toBe(0);
    expect(processed(ignored.report)).toBe(0);
    expect(ignored.report.summary.errors).toBe(0);
  });

  it('processes every tracked supported file except precise declared exclusions', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'biome.json'), 'utf8')) as {
      files: { maxSize: number; includes: string[] };
      vcs: { enabled: boolean; useIgnoreFile: boolean };
    };
    expect(config.files.maxSize).toBe(maxFileSize);
    expect(config.vcs.enabled).toBe(true);
    expect(config.vcs.useIgnoreFile).toBe(true);

    const tracked = run('git', ['ls-files', '-z']);
    expect(tracked.status).toBe(0);
    const supported = tracked.stdout
      .split('\0')
      .filter((path) => /\.(?:[cm]?[jt]sx?|css|jsonc?|html)$/.test(path));
    const ignored = run(
      'git',
      ['check-ignore', '--no-index', '-z', '--stdin'],
      `${supported.join('\0')}\0`
    );
    expect([0, 1]).toContain(ignored.status);
    expect(ignored.stdout).toBe('');

    const capturedPattern = '!!test/fixtures/authenticated-x-layouts/*.html';
    const exclusions = new Set(
      supported.filter(
        (path) =>
          path === '.nose-baseline.json' ||
          (path.startsWith('test/fixtures/authenticated-x-layouts/') && path.endsWith('.html'))
      )
    );
    expect(config.files.includes).toContain('**');
    expect(config.files.includes).toContain('!!**/node_modules');
    expect(config.files.includes).toContain('!!packages/core');
    expect(config.files.includes).toContain('!!.nose-baseline.json');
    expect(config.files.includes).toContain('!!pnpm-lock.yaml');
    expect(config.files.includes).toContain(capturedPattern);

    const scan = run(biome, [
      'check',
      '--verbose',
      '--reporter=summary',
      '--max-diagnostics=none',
      '.',
    ]);
    expect([0, 1], scan.stderr).toContain(scan.status);
    const output = `${scan.stdout}\n${scan.stderr}`;
    const listing = output.match(/Files processed:([\s\S]*?)Files fixed:/)?.[1];
    expect(listing, output.slice(-2000)).toBeDefined();
    const processedPaths = new Set(
      [...(listing?.matchAll(/^ {2}- (.+)$/gm) ?? [])].map((match) => match[1])
    );
    expect(processedPaths.size).toBeGreaterThan(0);

    for (const path of supported) {
      if (exclusions.has(path)) {
        expect(processedPaths.has(path), path).toBe(false);
        continue;
      }
      expect(statSync(resolve(root, path)).size, path).toBeLessThanOrEqual(maxFileSize);
      expect(processedPaths.has(path), path).toBe(true);
    }
  });
});
