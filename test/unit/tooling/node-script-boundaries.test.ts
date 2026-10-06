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
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const sourceRoot = resolve(import.meta.dirname, '../../..');
const roots: string[] = [];
const scripts = [
  'scripts/build/clean.ts',
  'scripts/check/extension-build.ts',
  'scripts/release/package-extension.ts',
  'scripts/release/prepare.ts',
  'scripts/release/version.ts',
  'tooling/vite/utils/extension-icons.ts',
] as const;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'node script boundary '));
  roots.push(root);
  for (const path of scripts) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(sourceRoot, path), target);
  }
  writeFileSync(join(root, 'package.json'), '{"type":"module","version":"2.3.3"}\n');
  const command = (path: string, args: string[] = [], env: NodeJS.ProcessEnv = process.env) =>
    spawnSync(process.execPath, ['--experimental-strip-types', join(root, path), ...args], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
  return { root, command };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Node script import boundary', () => {
  it('imports every direct CLI with invalid argv and release input without deleting, spawning, or writing', () => {
    const { root } = fixture();
    mkdirSync(join(root, 'dist'));
    mkdirSync(join(root, 'release-bundle'));
    writeFileSync(join(root, 'dist/sentinel'), 'preserve');
    writeFileSync(join(root, 'release-bundle/sentinel'), 'preserve');
    const bin = join(root, 'bin');
    mkdirSync(bin);
    for (const name of ['git', 'zip']) {
      const path = join(bin, name);
      writeFileSync(path, `#!/bin/sh\nprintf called >> ${JSON.stringify(join(root, 'spawned'))}\nexit 91\n`);
      // The accidental invocation would still leave an observable marker.
      chmodSync(path, 0o755);
    }
    for (const path of scripts.filter((candidate) => candidate.startsWith('scripts/'))) {
      const target = join(root, path);
      const code = `process.argv[1] = '/definitely/missing/cli.ts'; await import(${JSON.stringify(target)});`;
      const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', code], {
        cwd: root,
        env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}`, RELEASE_VERSION: 'invalid' },
        encoding: 'utf8',
      });
      expect(result.status, `${path}: ${result.stderr}`).toBe(0);
      expect(result.stdout).toBe('');
    }
    expect(readFileSync(join(root, 'dist/sentinel'), 'utf8')).toBe('preserve');
    expect(readFileSync(join(root, 'release-bundle/sentinel'), 'utf8')).toBe('preserve');
    expect(existsSync(join(root, 'spawned'))).toBe(false);
  });

  it('keeps clean CLI behavior inside the selected working directory', () => {
    const { root, command } = fixture();
    for (const dir of ['dist', 'dist-extension', 'dist-extension-firefox']) {
      mkdirSync(join(root, dir));
      writeFileSync(join(root, dir, 'sentinel'), 'remove');
    }
    const result = command('scripts/build/clean.ts');
    expect(result.status, result.stderr).toBe(0);
    for (const dir of ['dist', 'dist-extension', 'dist-extension-firefox'])
      expect(existsSync(join(root, dir))).toBe(false);
  });

  it('accepts a symlinked direct CLI entry', () => {
    const { root, command } = fixture();
    mkdirSync(join(root, 'dist'));
    symlinkSync(join(root, 'scripts/build/clean.ts'), join(root, 'clean-link.ts'));
    const result = command('clean-link.ts');
    expect(result.status, result.stderr).toBe(0);
    expect(existsSync(join(root, 'dist'))).toBe(false);
  });

  it('checks, rejects unknown commands, and syncs versions through the real CLI', () => {
    const { root, command } = fixture();
    mkdirSync(join(root, 'extension'));
    for (const name of ['manifest.json', 'manifest.firefox.json'])
      writeFileSync(join(root, 'extension', name), '{"version":"2.3.3"}\n');
    expect(command('scripts/release/version.ts', ['check']).status).toBe(0);
    expect(command('scripts/release/version.ts', ['unknown']).status).not.toBe(0);
    writeFileSync(join(root, 'extension/manifest.firefox.json'), '{"version":"2.3.2"}\n');
    expect(command('scripts/release/version.ts', ['check']).status).not.toBe(0);
    expect(command('scripts/release/version.ts', ['sync']).status).toBe(0);
    expect(readFileSync(join(root, 'extension/manifest.firefox.json'), 'utf8')).toContain('2.3.3');
  });

  it('checks extension artifacts and reports missing output through the real CLI', () => {
    const { root, command } = fixture();
    const dist = join(root, 'dist-extension');
    mkdirSync(join(dist, 'icons'), { recursive: true });
    writeFileSync(join(dist, 'content.js'), '(function() {})();\n');
    writeFileSync(join(dist, 'background.js'), 'background');
    writeFileSync(join(dist, 'manifest.json'), '{"icons":{"128":"icons/icon-128x128.png"}}');
    writeFileSync(join(dist, 'icons/icon-128x128.png'), 'icon');
    expect(command('scripts/check/extension-build.ts', ['dist-extension']).status).toBe(0);
    rmSync(join(dist, 'icons/icon-128x128.png'));
    const result = command('scripts/check/extension-build.ts', ['dist-extension']);
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toContain('was not produced');
  });

  it('preserves early release validation without modifying an existing bundle', () => {
    const { root, command } = fixture();
    mkdirSync(join(root, 'release-bundle'));
    writeFileSync(join(root, 'release-bundle/sentinel'), 'preserve');
    const missing = command('scripts/release/prepare.ts', [], { ...process.env, RELEASE_VERSION: '' });
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain('RELEASE_VERSION must be');
    const mismatch = command('scripts/release/prepare.ts', [], { ...process.env, RELEASE_VERSION: '2.3.2' });
    expect(mismatch.status).not.toBe(0);
    expect(mismatch.stderr).toContain('does not match package.json');
    expect(readFileSync(join(root, 'release-bundle/sentinel'), 'utf8')).toBe('preserve');
  });

  it('prepares release artifacts with the checked-out source and runtime provenance', () => {
    const { root, command } = fixture();
    for (const dir of ['dist', 'dist-extension', 'dist-extension-firefox', 'release-bundle'])
      mkdirSync(join(root, dir));
    writeFileSync(join(root, 'dist/xcom-enhanced-gallery.user.js'), 'userscript');
    writeFileSync(join(root, 'dist/xcom-enhanced-gallery.meta.js'), 'metadata');
    writeFileSync(join(root, 'dist-extension/manifest.json'), 'chrome');
    writeFileSync(join(root, 'dist-extension-firefox/manifest.json'), 'firefox');
    writeFileSync(join(root, 'release-bundle/sentinel'), 'old bundle');
    writeFileSync(join(root, 'CHANGELOG.md'), '## [2.3.3]\n\nRelease fixture notes.\n\n## [2.3.2]\n');
    const bin = join(root, 'bin');
    mkdirSync(bin);
    const git = join(bin, 'git');
    writeFileSync(git, `#!/bin/sh\nprintf '%s\\n' "$*" >> "$FAKE_CALLS"\ncase "$1" in\n  rev-parse) printf '%s\\n' '${'a'.repeat(40)}' ;;\n  tag) printf '%s\\n' 'v2.3.2' ;;\nesac\n`);
    chmodSync(git, 0o755);
    const zip = join(bin, 'zip');
    writeFileSync(zip, '#!/bin/sh\nprintf archive > "$3"\n');
    chmodSync(zip, 0o755);
    const result = command('scripts/release/prepare.ts', [], {
      ...process.env,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      FAKE_CALLS: join(root, 'calls'),
      RELEASE_VERSION: '2.3.3',
      RELEASE_SHA: 'a'.repeat(40),
      RUNNER_OS: 'Linux',
      RUNNER_ARCH: 'X64',
      ImageOS: 'ubuntu24',
      ImageVersion: 'fixture',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Prepared release-bundle/ for v2.3.3 (4 assets)');
    expect(readFileSync(join(root, 'calls'), 'utf8')).toBe('rev-parse HEAD\ntag --list v*\n');
    expect(existsSync(join(root, 'release-bundle/sentinel'))).toBe(false);
    expect(readFileSync(join(root, 'release-bundle/deploy/dist/xcom-enhanced-gallery.user.js'), 'utf8')).toBe('userscript');
    const release = join(root, 'release-bundle/release');
    expect(readFileSync(join(release, 'checksums.txt'), 'utf8').trim().split('\n')).toHaveLength(4);
    expect(existsSync(join(release, 'xcom-enhanced-gallery-chrome.zip'))).toBe(true);
    expect(existsSync(join(release, 'xcom-enhanced-gallery-firefox.zip'))).toBe(true);
    expect(JSON.parse(readFileSync(join(release, 'metadata.json'), 'utf8'))).toMatchObject({
      version: '2.3.3',
      commit: 'a'.repeat(40),
      node_version: process.versions.node,
      runner_os: 'Linux',
      runner_arch: 'X64',
      runner_image: 'ubuntu24',
      runner_image_version: 'fixture',
    });
    expect(readFileSync(join(root, 'release-bundle/RELEASE_NOTES.md'), 'utf8')).toContain('/compare/v2.3.2...v2.3.3');
  });

  it('preserves the package CLI missing-build diagnostic', () => {
    const { command } = fixture();
    const result = command('scripts/release/package-extension.ts');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('dist-extension does not exist. Run build first.');
  });
});
