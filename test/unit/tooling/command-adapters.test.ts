import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runOptionalNose } from '../../../scripts/check/nose.ts';

const projectRoot = resolve(import.meta.dirname, '../../..');
const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const fixtures: string[] = [];

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'xcom commands with spaces '));
  fixtures.push(root);
  mkdirSync(join(root, 'scripts/check'), { recursive: true });
  copyFileSync(join(projectRoot, 'scripts/check/bootstrap.ts'), join(root, 'scripts/check/bootstrap.ts'));
  copyFileSync(join(projectRoot, 'scripts/check/nose.ts'), join(root, 'scripts/check/nose.ts'));
  return root;
}

function runCli(root: string, name: string, env = process.env) {
  return spawnSync(process.execPath, ['--experimental-strip-types', join(root, 'scripts/check', name)], {
    cwd: tmpdir(),
    env,
    encoding: 'utf8',
  });
}

describe('dependency-free command adapters', () => {
  it('uses the production entrypoints from package scripts', () => {
    expect(manifest.scripts.preinstall).toBe(
      'node --experimental-strip-types scripts/check/bootstrap.ts'
    );
    expect(manifest.scripts['quality:nose']).toBe(
      'node --experimental-strip-types scripts/check/nose.ts'
    );
    expect(manifest.scripts.prebuild).toBe('pnpm -s check:prebuild');
  });

  it('rejects a missing submodule before node_modules exists and accepts a real or symlinked file', () => {
    const root = fixtureRoot();
    const packagePath = join(root, 'packages/core/package.json');
    const missing = runCli(root, 'bootstrap.ts');
    expect(existsSync(join(root, 'node_modules'))).toBe(false);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('Submodule not initialized');
    expect(missing.stderr).toContain('git submodule sync --recursive');
    expect(missing.stderr).toContain('git submodule update --init --recursive');

    mkdirSync(join(root, 'packages/core'), { recursive: true });
    expect(runCli(root, 'bootstrap.ts').status).toBe(1);
    writeFileSync(packagePath, '{}\n');
    const present = runCli(root, 'bootstrap.ts');
    expect(present.status).toBe(0);
    expect(present.stderr).toBe('');

    const link = join(root, 'linked-bootstrap.ts');
    symlinkSync(join(root, 'scripts/check/bootstrap.ts'), link);
    const linked = spawnSync(process.execPath, ['--experimental-strip-types', link], {
      cwd: tmpdir(),
      encoding: 'utf8',
    });
    expect(linked.status).toBe(0);

    rmSync(join(root, 'packages/core'), { recursive: true });
    const target = join(root, 'core target');
    mkdirSync(target);
    writeFileSync(join(target, 'package.json'), '{}\n');
    symlinkSync(target, join(root, 'packages/core'));
    expect(runCli(root, 'bootstrap.ts').status).toBe(0);
  });

  it('runs the package preinstall lifecycle in a disposable checkout without dependencies', () => {
    const root = fixtureRoot();
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'xcom-command-fixture', private: true, type: 'module', scripts: { preinstall: manifest.scripts.preinstall } })
    );
    const result = spawnSync('pnpm', ['run', 'preinstall'], {
      cwd: root,
      env: process.env,
      encoding: 'utf8',
    });
    expect(existsSync(join(root, 'node_modules'))).toBe(false);
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('git submodule update --init --recursive');
  });

  it('does nothing when imported as a module', () => {
    const root = fixtureRoot();
    const fakeBin = join(root, 'fake-bin');
    mkdirSync(fakeBin);
    const record = join(root, 'nose-record');
    writeFileSync(join(fakeBin, 'nose'), '#!/bin/sh\nprintf invoked > "$NOSE_RECORD"\n', {
      mode: 0o755,
    });
    for (const name of ['bootstrap.ts', 'nose.ts']) {
      const url = pathToFileURL(join(root, 'scripts/check', name)).href;
      const imported = spawnSync(
        process.execPath,
        ['--experimental-strip-types', '--input-type=module', '-e', `import ${JSON.stringify(url)};`],
        {
          cwd: tmpdir(),
          env: { ...process.env, PATH: fakeBin, NOSE_RECORD: record },
          encoding: 'utf8',
        }
      );
      expect(imported.status).toBe(0);
      expect(imported.stdout).toBe('');
      expect(imported.stderr).toBe('');
      expect(existsSync(record)).toBe(false);
    }
  });

  it('skips only when Nose is absent', () => {
    const root = fixtureRoot();
    const fakeBin = join(root, 'empty-bin');
    mkdirSync(fakeBin);
    const result = runCli(root, 'nose.ts', { ...process.env, PATH: fakeBin });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[nose] not installed — skipping');
  });

  it('does not mistake an unavailable project directory for an absent Nose binary', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect(runOptionalNose(join(tmpdir(), 'xcom-project-does-not-exist'))).toBe(1);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('could not run in project directory'));
    } finally {
      error.mockRestore();
    }
  });

  it('passes exact arguments, project cwd and inherited environment to installed Nose', () => {
    const root = fixtureRoot();
    const fakeBin = join(root, 'fake-bin');
    mkdirSync(fakeBin);
    const record = join(root, 'nose-record');
    writeFileSync(
      join(fakeBin, 'nose'),
      '#!/bin/sh\nprintf "%s\\n" "$(pwd)" "$NOSE_ENV_MARKER" "$@" > "$NOSE_RECORD"\n',
      { mode: 0o755 }
    );
    const result = runCli(root, 'nose.ts', {
      ...process.env,
      PATH: fakeBin,
      NOSE_ENV_MARKER: 'inherited',
      NOSE_RECORD: record,
    });
    expect(result.status).toBe(0);
    expect(readFileSync(record, 'utf8').split('\n').slice(0, -1)).toEqual([
      root,
      'inherited',
      'query',
      'src',
      '--baseline',
      '.nose-baseline.json',
      '--fail-on',
      'new',
    ]);
    expect(result.stdout).not.toContain('skipping');
  });

  it('propagates installed Nose status and non-ENOENT spawn failures', () => {
    const root = fixtureRoot();
    const fakeBin = join(root, 'fake-bin');
    mkdirSync(fakeBin);
    const nose = join(fakeBin, 'nose');
    writeFileSync(nose, '#!/bin/sh\necho nose-failed >&2\nexit 17\n', { mode: 0o755 });
    const env = { ...process.env, PATH: fakeBin };
    const failed = runCli(root, 'nose.ts', env);
    expect(failed.status).toBe(17);
    expect(failed.stderr).toContain('nose-failed');
    expect(failed.stdout).not.toContain('skipping');

    writeFileSync(nose, '#!/bin/sh\nexit 0\n', { mode: 0o644 });
    chmodSync(nose, 0o644);
    const inaccessible = runCli(root, 'nose.ts', env);
    expect(inaccessible.status).toBe(1);
    expect(inaccessible.stderr).toContain('[nose] could not run:');
    expect(inaccessible.stdout).not.toContain('skipping');
  });

  it.skipIf(process.platform === 'win32')('fails when Nose exists but its shebang interpreter is missing', () => {
    const root = fixtureRoot();
    const fakeBin = join(root, 'fake-bin');
    mkdirSync(fakeBin);
    writeFileSync(join(fakeBin, 'nose'), '#!/no/such/nose-interpreter\n', { mode: 0o755 });
    const result = runCli(root, 'nose.ts', { ...process.env, PATH: fakeBin });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[nose] could not run:');
    expect(result.stdout).not.toContain('skipping');
  });

  it.skipIf(process.platform === 'win32')('propagates a Nose termination signal', () => {
    const root = fixtureRoot();
    const fakeBin = join(root, 'fake-bin');
    mkdirSync(fakeBin);
    writeFileSync(join(fakeBin, 'nose'), '#!/bin/sh\nkill -TERM $$\n', { mode: 0o755 });
    const result = runCli(root, 'nose.ts', { ...process.env, PATH: fakeBin });
    expect(result.signal).toBe('SIGTERM');
  });
});
