import { spawnSync } from 'node:child_process';
import {
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
import { afterEach, describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(import.meta.dirname, '../../..');
const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const fixtures: string[] = [];

afterEach(() => {
  for (const root of fixtures.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'xcom commands with spaces '));
  fixtures.push(root);
  mkdirSync(join(root, 'scripts/check'), { recursive: true });
  copyFileSync(
    join(projectRoot, 'scripts/check/bootstrap.ts'),
    join(root, 'scripts/check/bootstrap.ts')
  );
  return root;
}

function runCli(root: string, name: string, env = process.env) {
  return spawnSync(
    process.execPath,
    ['--experimental-strip-types', join(root, 'scripts/check', name)],
    {
      cwd: tmpdir(),
      env,
      encoding: 'utf8',
    }
  );
}

describe('dependency-free command adapters', () => {
  it('uses the production entrypoints from package scripts', () => {
    expect(manifest.scripts.preinstall).toBe(
      'node --experimental-strip-types scripts/check/bootstrap.ts'
    );
    expect(manifest.scripts.prebuild).toBe('vp run check:prebuild');
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
      JSON.stringify({
        name: 'xcom-command-fixture',
        private: true,
        type: 'module',
        scripts: { preinstall: manifest.scripts.preinstall },
      })
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
    const url = pathToFileURL(join(root, 'scripts/check/bootstrap.ts')).href;
    const imported = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--input-type=module', '-e', `import ${JSON.stringify(url)};`],
      { cwd: tmpdir(), encoding: 'utf8' }
    );
    expect(imported.status).toBe(0);
    expect(imported.stdout).toBe('');
    expect(imported.stderr).toBe('');
  });
});
