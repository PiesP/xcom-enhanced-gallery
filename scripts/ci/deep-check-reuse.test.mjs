import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs, { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { fingerprint, shouldReuse, validMarker, writeMarker } from './deep-check-reuse.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'deep-check-reuse-'));
after(() => rmSync(fixture, { recursive: true, force: true }));

function write(path, content) {
  const fullPath = join(fixture, path);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content);
}

function git(...args) {
  execFileSync('git', args, { cwd: fixture });
}

git('init', '-q');
write(
  'package.json',
  JSON.stringify({
    packageManager: 'pnpm@11.26.0',
    volta: { node: '26.9.0', pnpm: '11.26.0' },
  })
);
for (const path of [
  'src/app.ts',
  'test/app.test.ts',
  'stryker.conf.fast.json',
  'pnpm-lock.yaml',
  'scripts/ci/install-nose.sh',
  '.github/workflows/deep-checks.yaml',
]) {
  write(path, 'original\n');
}
git('add', '-A');
git(
  'update-index',
  '--add',
  '--cacheinfo',
  '160000,1111111111111111111111111111111111111111,packages/core'
);

const runner = {
  RUNNER_OS: 'Linux',
  RUNNER_ARCH: 'X64',
  ImageOS: 'ubuntu24',
  ImageVersion: '20261001.1',
  DEEP_RUNNER_LABEL: 'ubuntu-24.04',
};
const baseline = fingerprint('duplication', fixture, runner);

test('each tracked source, test, configuration, lock, and tool input invalidates success', () => {
  assert.match(baseline, /^[0-9a-f]{64}$/);
  for (const path of [
    'src/app.ts',
    'test/app.test.ts',
    'stryker.conf.fast.json',
    'pnpm-lock.yaml',
    'scripts/ci/install-nose.sh',
    '.github/workflows/deep-checks.yaml',
    'package.json',
  ]) {
    write(
      path,
      path === 'package.json'
        ? JSON.stringify({
            packageManager: 'pnpm@11.26.0',
            volta: { node: '26.9.1', pnpm: '11.26.0' },
          })
        : 'changed\n'
    );
    assert.notEqual(fingerprint('duplication', fixture, runner), baseline, path);
    if (path === 'package.json') {
      write(
        path,
        JSON.stringify({
          packageManager: 'pnpm@11.26.0',
          volta: { node: '26.9.0', pnpm: '11.26.0' },
        })
      );
    } else {
      write(path, 'original\n');
    }
  }
  assert.equal(fingerprint('duplication', fixture, runner), baseline);
  write(
    'package.json',
    JSON.stringify({
      packageManager: 'pnpm@11.26.1',
      volta: { node: '26.9.0', pnpm: '11.26.1' },
    })
  );
  assert.notEqual(fingerprint('duplication', fixture, runner), baseline);
  write(
    'package.json',
    JSON.stringify({
      packageManager: 'pnpm@11.26.0',
      volta: { node: '26.9.0', pnpm: '11.26.0' },
    })
  );
});

test('fingerprint uses the length of the bytes read when a tracked file changes', (t) => {
  const path = join(fixture, 'src/app.ts');
  const read = fs.readFileSync;
  try {
    for (const replacement of [Buffer.alloc(0), Buffer.from('changed longer content\n')]) {
      write('src/app.ts', replacement);
      const expected = fingerprint('duplication', fixture, runner);
      write('src/app.ts', 'original\n');
      let replaced = false;
      t.mock.method(fs, 'readFileSync', (file, ...args) => {
        if (file === path && !replaced) {
          // Change the file at the read boundary, after any separate metadata lookup.
          writeFileSync(path, replacement);
          replaced = true;
        }
        return read(file, ...args);
      });
      syncBuiltinESMExports();
      assert.equal(fingerprint('duplication', fixture, runner), expected);
      assert.equal(replaced, true);
      t.mock.restoreAll();
      syncBuiltinESMExports();
    }
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
    write('src/app.ts', 'original\n');
  }
  assert.equal(fingerprint('duplication', fixture, runner), baseline);
});

test('gitlink, runner platform and label, and gate identity invalidate success', () => {
  git(
    'update-index',
    '--add',
    '--cacheinfo',
    '160000,2222222222222222222222222222222222222222,packages/core'
  );
  assert.notEqual(fingerprint('duplication', fixture, runner), baseline);
  git(
    'update-index',
    '--add',
    '--cacheinfo',
    '160000,1111111111111111111111111111111111111111,packages/core'
  );
  for (const change of [
    { RUNNER_OS: 'Windows' },
    { RUNNER_ARCH: 'ARM64' },
    { ImageOS: 'ubuntu26' },
    { DEEP_RUNNER_LABEL: 'ubuntu-26.04' },
  ]) {
    assert.notEqual(fingerprint('duplication', fixture, { ...runner, ...change }), baseline);
  }
  assert.equal(
    fingerprint('duplication', fixture, { ...runner, ImageVersion: '20261001.2' }),
    baseline
  );
  assert.notEqual(fingerprint('mutation', fixture, runner), baseline);
  assert.equal(fingerprint('duplication', fixture, { ...runner, ImageVersion: '' }), null);
  assert.equal(fingerprint('duplication', fixture, { ...runner, DEEP_RUNNER_LABEL: '' }), null);
});

test('only a valid successful marker can be reused', () => {
  const marker = join(fixture, 'marker.json');
  assert.equal(validMarker(marker, 'duplication', baseline), false);
  writeMarker(marker, 'duplication', baseline, runner);
  assert.equal(validMarker(marker, 'duplication', baseline), true);
  assert.equal(JSON.parse(readFileSync(marker, 'utf8')).imageVersion, runner.ImageVersion);
  assert.equal(
    validMarker(
      marker,
      'duplication',
      fingerprint('duplication', fixture, {
        ...runner,
        ImageVersion: '20261001.2',
      })
    ),
    true
  );
  assert.equal(validMarker(marker, 'mutation', baseline), false);
  assert.equal(validMarker(marker, 'duplication', '0'.repeat(64)), false);
  writeFileSync(
    marker,
    JSON.stringify({
      schema: 2,
      gate: 'duplication',
      fingerprint: baseline,
      result: 'failure',
      imageVersion: runner.ImageVersion,
    })
  );
  assert.equal(validMarker(marker, 'duplication', baseline), false);
  writeFileSync(marker, 'corrupt');
  assert.equal(validMarker(marker, 'duplication', baseline), false);
});

test('schedule reuses success; manual defaults to fresh and can opt in', () => {
  const decide = (valid, event, choice, hit = 'true', outcome = 'success') =>
    shouldReuse(valid, hit, outcome, event, choice);
  assert.equal(decide(true, 'schedule', ''), true);
  assert.equal(decide(false, 'schedule', ''), false);
  assert.equal(decide(true, 'schedule', '', '', 'success'), false);
  assert.equal(decide(true, 'schedule', '', 'true', 'failure'), false);
  assert.equal(decide(true, 'workflow_dispatch', ''), false);
  assert.equal(decide(true, 'workflow_dispatch', 'false'), false);
  assert.equal(decide(true, 'workflow_dispatch', 'true'), true);
  assert.equal(decide(true, 'push', 'true'), false);
});

test('CLI emits a reusable result only after a successful marker is present', () => {
  const script = fileURLToPath(new URL('./deep-check-reuse.mjs', import.meta.url));
  const output = join(fixture, 'output.txt');
  const marker = join(fixture, 'cli-marker.json');
  const run = (args, extraEnv = {}) => {
    writeFileSync(output, '');
    execFileSync(process.execPath, [script, ...args], {
      cwd: fixture,
      env: { ...process.env, ...runner, GITHUB_OUTPUT: output, ...extraEnv },
    });
    return readFileSync(output, 'utf8');
  };
  assert.match(run(['fingerprint', 'duplication']), new RegExp(`fingerprint=${baseline}`));
  const verifyEnv = {
    CACHE_HIT: 'true',
    RESTORE_OUTCOME: 'success',
    GITHUB_EVENT_NAME: 'schedule',
  };
  assert.match(run(['verify', 'duplication', baseline, marker], verifyEnv), /reuse=false/);
  run(['mark', 'duplication', baseline, marker]);
  assert.match(run(['verify', 'duplication', baseline, marker], verifyEnv), /reuse=true/);
  assert.match(
    run(['verify', 'duplication', baseline, marker], {
      ...verifyEnv,
      RESTORE_OUTCOME: 'failure',
    }),
    /reuse=false/
  );
});

test('mutation marker follows a required successful report upload', () => {
  const workflow = readFileSync(
    fileURLToPath(new URL('../../.github/workflows/deep-checks.yaml', import.meta.url)),
    'utf8'
  );
  const mutation = workflow.split('\n  mutation:\n')[1];
  assert.ok(mutation);
  const starts = [...mutation.matchAll(/^ {6}- name: /gm)].map((match) => match.index);
  const steps = starts.map((start, index) => mutation.slice(start, starts[index + 1]));
  const byName = (name) => steps.findIndex((step) => step.startsWith(`      - name: ${name}`));

  const check = byName('🧬 Run mutation gate');
  const upload = byName('📊 Upload mutation reports');
  const summary = byName('✅ Record fresh mutation pass');
  const mark = byName('📝 Mark successful mutation');
  const save = byName('💾 Save successful mutation marker');
  assert.ok(check >= 0 && check < upload && upload < summary && summary < mark && mark < save);
  assert.equal(save, steps.length - 1); // No later required step can fail after the marker is saved.
  assert.match(steps[check], /if:.*steps\.marker\.outputs\.reuse != 'true'/);
  assert.match(steps[upload], /id: upload/);
  assert.match(steps[upload], /if:.*steps\.check\.outcome != 'skipped'/);
  assert.match(steps[upload], /if-no-files-found: error/);
  for (const step of [steps[summary], steps[mark]]) {
    assert.match(step, /steps\.check\.outcome == 'success' && steps\.upload\.outcome == 'success'/);
  }
  assert.match(steps[save], /if:.*steps\.mark\.outcome == 'success'/);
});
