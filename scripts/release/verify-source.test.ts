import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, test } from 'vite-plus/test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const script = fileURLToPath(new URL('./verify-source.ts', import.meta.url));
const releaseScripts = {
  'quality:coverage-owned': 'pnpm quality',
  'test:cov': 'pnpm test',
  'build:e2e': 'pnpm build',
  'test:e2e:all': 'pnpm test:e2e',
  'build:all:ci': 'pnpm build',
  'release:prepare': 'node scripts/release/prepare.ts',
};
const roots: string[] = [];
afterAll(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true });
  }
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'release-source-'));
  roots.push(root);
  const origin = join(root, 'origin.git');
  const source = join(root, 'source');
  const checkout = join(root, 'checkout');
  const output = join(root, 'output');
  git(root, 'init', '--bare', '-q', '-b', 'master', origin);
  git(root, 'init', '-q', '-b', 'master', source);
  git(source, 'config', 'user.name', 'Release fixture');
  git(source, 'config', 'user.email', 'fixture@example.invalid');
  git(source, 'config', 'tag.gpgSign', 'false');
  git(source, 'remote', 'add', 'origin', origin);
  writeFileSync(output, '');
  return {
    root,
    source,
    checkout,
    output,
    commit(
      pin: unknown,
      version: unknown = '1.2.3',
      scripts: unknown = releaseScripts,
      pinSource: 'volta' | 'node-version' = 'volta'
    ): string {
      writeFileSync(
        join(source, 'package.json'),
        JSON.stringify({
          version,
          ...(pinSource === 'volta' ? { volta: { node: pin } } : {}),
          scripts,
        })
      );
      if (pinSource === 'node-version') {
        writeFileSync(join(source, '.node-version'), `${String(pin)}\n`);
      } else {
        rmSync(join(source, '.node-version'), { force: true });
      }
      git(source, 'add', '-A');
      git(source, 'commit', '-qm', `manifest ${String(pin)}`);
      return git(source, 'rev-parse', 'HEAD');
    },
    tag(name: string, annotated = false): void {
      if (annotated) {
        git(source, 'tag', '-a', name, '-m', name);
      } else {
        git(source, 'tag', name);
      }
    },
    clone(): void {
      git(source, 'push', '-q', 'origin', '--all');
      git(source, 'push', '-q', 'origin', '--tags');
      git(root, 'clone', '-q', '--no-tags', origin, checkout);
    },
    fetchAllTags(): void {
      git(checkout, 'fetch', '-q', '--tags', 'origin');
    },
    run(tag: string, protectedSha: string, outputPath = output) {
      return spawnSync(process.execPath, ['--experimental-strip-types', script], {
        cwd: checkout,
        encoding: 'utf8',
        env: {
          ...process.env,
          RELEASE_TAG: tag,
          GITHUB_SHA: protectedSha,
          GITHUB_OUTPUT: outputPath,
        },
      });
    },
    values(): string {
      return readFileSync(output, 'utf8');
    },
  };
}

test('annotated tag resolves to its commit and reads the tagged historical Node pin', () => {
  const f = fixture();
  const releaseSha = f.commit('24.15.0');
  f.tag('v1.2.3', true);
  const protectedSha = f.commit('26.9.0');
  f.clone();
  const result = f.run('v1.2.3', protectedSha);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.values(), `node-version=24.15.0\nrelease-sha=${releaseSha}\nversion=1.2.3\n`);
  assert.equal(git(f.checkout, 'tag', '--list', 'v1.2.3'), 'v1.2.3');
});

test('current tagged source reads its exact .node-version pin', () => {
  const f = fixture();
  const head = f.commit('26.12.1', '2.3.9', releaseScripts, 'node-version');
  f.tag('v2.3.9');
  f.clone();
  const result = f.run('v2.3.9', head);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.values(), `node-version=26.12.1\nrelease-sha=${head}\nversion=2.3.9\n`);
});

test('current source rejects a competing Volta pin before publishing outputs', () => {
  const f = fixture();
  f.commit('26.12.1', '2.3.9', releaseScripts, 'node-version');
  writeFileSync(
    join(f.source, 'package.json'),
    JSON.stringify({ version: '2.3.9', volta: { node: '26.12.1' }, scripts: releaseScripts })
  );
  git(f.source, 'add', 'package.json');
  git(f.source, 'commit', '-qm', 'competing pin');
  const head = git(f.source, 'rev-parse', 'HEAD');
  f.tag('v2.3.9');
  f.clone();
  const result = f.run('v2.3.9', head);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /competing Node runtime pins/);
  assert.equal(f.values(), '');
});

test('protected workflow source rejects an older tag with a retired Nose script', () => {
  const f = fixture();
  f.commit('24.15.0', '1.2.3', { 'quality:nose': 'historical command' });
  f.tag('v1.2.3');
  const protectedSha = f.commit('26.9.0', '1.2.4');
  f.clone();
  const result = f.run('v1.2.3', protectedSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Release source still declares retired quality:nose script/);
  assert.equal(f.values(), '');
});

test('compatible older tag retains its tagged runtime and version', () => {
  const f = fixture();
  const releaseSha = f.commit('24.15.0', '1.2.3', {
    ...releaseScripts,
    quality: 'pnpm check',
  });
  f.tag('v1.2.3');
  const protectedSha = f.commit('26.9.0', '1.2.4');
  f.clone();
  const result = f.run('v1.2.3', protectedSha);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.values(), `node-version=24.15.0\nrelease-sha=${releaseSha}\nversion=1.2.3\n`);
});

test('historical sources missing a current release entrypoint fail before checkout jobs', () => {
  const f = fixture();
  const { 'build:e2e': _omitted, ...historicalScripts } = releaseScripts;
  const head = f.commit('24.15.0', '1.2.3', historicalScripts);
  f.tag('v1.2.3');
  f.clone();
  const result = f.run('v1.2.3', head);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Release source lacks current workflow entrypoints: build:e2e/);
  assert.equal(f.values(), '');
});

test('malformed tagged script maps fail before publishing outputs', () => {
  for (const scripts of [null, 'quality', [], { quality: 1 }]) {
    const f = fixture();
    const head = f.commit('26.9.0', '1.2.3', scripts);
    f.tag('v1.2.3');
    f.clone();
    const result = f.run('v1.2.3', head);
    assert.notEqual(result.status, 0, String(scripts));
    assert.match(result.stderr, /Invalid release source scripts/);
    assert.equal(f.values(), '');
  }
});

test('lightweight tag resolves to the same commit and emits only three fixed output keys', () => {
  const f = fixture();
  const releaseSha = f.commit('26.9.0', '2.0.0');
  f.tag('v2.0.0');
  f.clone();
  const result = f.run('v2.0.0', releaseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.values(), `node-version=26.9.0\nrelease-sha=${releaseSha}\nversion=2.0.0\n`);
});

test('invalid tag forms and invalid protected SHA fail before any output', () => {
  const f = fixture();
  const head = f.commit('26.9.0');
  f.tag('v1.2.3');
  f.clone();
  for (const tag of ['latest', 'v1.2', 'v1.2.3-rc.1', 'v1.2.3\nversion=0', 'v1.2.3\n', 'v1.2.3 ']) {
    const result = f.run(tag, head);
    assert.notEqual(result.status, 0, tag);
    assert.match(result.stderr, /Invalid release tag/);
    assert.equal(f.values(), '');
  }
  const badSha = f.run('v1.2.3', `${head}\n`);
  assert.notEqual(badSha.status, 0);
  assert.match(badSha.stderr, /Invalid protected workflow SHA/);
  assert.equal(f.values(), '');
  assert.equal(git(f.checkout, 'tag', '--list', 'v1.2.3'), '');
});

test('a valid tag on an unrelated branch cannot authorize a protected release', () => {
  const f = fixture();
  const protectedSha = f.commit('26.9.0');
  git(f.source, 'switch', '-q', '-c', 'topic');
  f.commit('24.15.0', '3.0.0');
  f.tag('v3.0.0');
  git(f.source, 'switch', '-q', 'master');
  f.clone();
  const result = f.run('v3.0.0', protectedSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not contained in protected master/);
  assert.equal(f.values(), '');
});

test('missing or malformed tagged Node pins fail without publishing outputs', () => {
  for (const pin of [undefined, 'latest', 26, '26.9.0\nversion=0', '26.9.0\n']) {
    const f = fixture();
    const head = f.commit(pin, '4.0.0');
    f.tag('v4.0.0');
    f.clone();
    const result = f.run('v4.0.0', head);
    assert.notEqual(result.status, 0, String(pin));
    assert.match(result.stderr, /exact volta\.node pin/);
    assert.equal(f.values(), '');
  }
});

test('tag and tagged package versions must match before output publication', () => {
  for (const version of ['1.2.3', null]) {
    const f = fixture();
    const head = f.commit('26.9.0', version);
    f.tag('v6.0.0');
    f.clone();
    const result = f.run('v6.0.0', head);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Tag version 6\.0\.0 does not match package\.json/);
    assert.equal(f.values(), '');
  }
});

test('fetch and output failures propagate without a partial decision', () => {
  const f = fixture();
  const head = f.commit('26.9.0', '5.0.0');
  f.tag('v5.0.0');
  f.clone();
  const missing = f.run('v5.0.1', head);
  assert.notEqual(missing.status, 0);
  assert.equal(f.values(), '');
  const unwritable = f.run('v5.0.0', head, f.root);
  assert.notEqual(unwritable.status, 0);
  assert.equal(f.values(), '');
});

test('importing the helper with an unrelated or missing argv path is inert', () => {
  for (const argvPath of [process.execPath, join(tmpdir(), 'absent-release-source.ts')]) {
    const imported = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        `process.argv[1] = ${JSON.stringify(argvPath)}; await import(${JSON.stringify(pathToFileURL(script).href)});`,
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, RELEASE_TAG: '', GITHUB_SHA: '', GITHUB_OUTPUT: '' },
      }
    );
    assert.equal(imported.status, 0, imported.stderr);
  }
});
