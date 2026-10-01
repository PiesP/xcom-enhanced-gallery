import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs, { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  evaluateReuse,
  fingerprint,
  shouldReuse,
  validMarker,
  writeMarker,
} from './deep-check-reuse.ts';

const fixture = mkdtempSync(join(tmpdir(), 'deep-check-reuse-'));
after(() => rmSync(fixture, { recursive: true, force: true }));

function write(path: string, content: string | Uint8Array) {
  const fullPath = join(fixture, path);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, content);
}

function git(...args: string[]) {
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
  GITHUB_RUN_ID: '100',
  GITHUB_RUN_ATTEMPT: '1',
  GITHUB_SHA: 'a'.repeat(40),
};
const baseline = fingerprint('duplication', fixture, runner);
if (!baseline) throw new Error('Fixture runner identity must be complete');

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
      t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => {
        const [file] = args;
        if (file === path && !replaced) {
          // Change the file at the read boundary, after any separate metadata lookup.
          writeFileSync(path, replacement);
          replaced = true;
        }
        return read(...args);
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
  assert.equal(JSON.parse(readFileSync(marker, 'utf8')).runId, 100);
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
      schema: 3,
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
  const decide = (
    valid: boolean,
    event: string,
    choice: string,
    hit = 'true',
    outcome = 'success'
  ) => shouldReuse(valid, hit, outcome, event, choice);
  assert.equal(decide(true, 'schedule', ''), true);
  assert.equal(decide(false, 'schedule', ''), false);
  assert.equal(decide(true, 'schedule', '', '', 'success'), false);
  assert.equal(decide(true, 'schedule', '', 'true', 'failure'), false);
  assert.equal(decide(true, 'workflow_dispatch', ''), false);
  assert.equal(decide(true, 'workflow_dispatch', 'false'), false);
  assert.equal(decide(true, 'workflow_dispatch', 'true'), true);
  assert.equal(decide(true, 'push', 'true'), false);
});

const analyzedAt = '2026-09-30T01:05:00Z';
const oldRun: {
  id: number;
  run_attempt: number;
  head_sha: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
} = {
  id: 100,
  run_attempt: 1,
  head_sha: runner.GITHUB_SHA,
  status: 'completed',
  conclusion: 'success',
  created_at: '2026-09-30T00:50:00Z',
  updated_at: '2026-09-30T01:07:00Z',
};
const laterRun = {
  ...oldRun,
  id: 101,
  head_sha: 'b'.repeat(40),
  created_at: '2026-09-30T02:00:00Z',
  updated_at: '2026-09-30T02:20:00Z',
};
const oldJob: {
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  steps?: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    started_at: string | null;
    completed_at: string | null;
  } | null> | null;
} = {
  name: '🔍 Duplication',
  status: 'completed',
  conclusion: 'success',
  started_at: '2026-09-30T01:00:00Z',
  completed_at: '2026-09-30T01:04:00Z',
  steps: [
    {
      name: '🔎 Check for new duplication',
      status: 'completed',
      conclusion: 'success',
      started_at: '2026-09-30T01:03:40Z',
      completed_at: '2026-09-30T01:04:00Z',
    },
  ],
};
const verifyEnv = {
  ...runner,
  CACHE_HIT: 'true',
  RESTORE_OUTCOME: 'success',
  GITHUB_EVENT_NAME: 'schedule',
  GITHUB_REPOSITORY: 'PiesP/xcom-enhanced-gallery',
  GITHUB_REF: 'refs/heads/master',
  DEFAULT_BRANCH: 'master',
  GITHUB_RUN_ID: '103',
  GH_TOKEN: 'test-token',
};

function markerWithTime(path: string, time = analyzedAt, source = runner) {
  writeMarker(path, 'duplication', baseline!, source);
  const marker = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  marker.analyzedAt = time;
  writeFileSync(path, JSON.stringify(marker));
}

function historyApi(
  runs = [oldRun],
  jobs: Record<number, (typeof oldJob)[]> = { 100: [oldJob] },
  override?: (url: URL) => unknown
) {
  const requests: string[] = [];
  const api = async (rawUrl: string) => {
    const url = new URL(rawUrl);
    requests.push(url.pathname + url.search);
    const custom = override?.(url);
    let body: unknown;
    if (custom !== undefined) body = custom;
    else if (url.pathname.endsWith('/runs')) {
      const page = Number(url.searchParams.get('page'));
      body = { total_count: runs.length, workflow_runs: runs.slice((page - 1) * 100, page * 100) };
    } else {
      const match = /\/actions\/runs\/(\d+)\/attempts\/(\d+)\/jobs$/.exec(url.pathname);
      if (!match) throw new Error(`Unexpected API path: ${url.pathname}`);
      const list = jobs[Number(match[1])] ?? [];
      const page = Number(url.searchParams.get('page'));
      body = { total_count: list.length, jobs: list.slice((page - 1) * 100, page * 100) };
    }
    return { ok: true, json: async () => body };
  };
  return { api, requests };
}

test('verified origin reports only the completed analysis step duration', async () => {
  const marker = join(fixture, 'history-marker.json');
  markerWithTime(marker);
  const { api, requests } = historyApi();
  assert.deepEqual(await evaluateReuse(marker, 'duplication', baseline, verifyEnv, api), {
    reuse: true,
    reason: 'validated-history',
    savedSeconds: 20,
  });
  assert.ok(requests.some((request) => request.includes('/attempts/1/jobs')));
});

test('missing, skipped, duplicate, or invalid analysis timing omits the estimate', async () => {
  const marker = join(fixture, 'history-marker.json');
  markerWithTime(marker);
  const analysis = oldJob.steps![0]!;
  for (const steps of [
    null,
    [],
    [{ ...analysis, name: '📦 Setup project' }],
    [{ ...analysis, status: 'completed', conclusion: 'skipped' }],
    [{ ...analysis, started_at: 'invalid' }],
    [{ ...analysis, completed_at: '2026-09-30T01:03:39Z' }],
    [{ ...analysis, started_at: '2026-09-30T00:59:00Z' }],
    [null, analysis],
    [analysis, analysis],
  ]) {
    const { api } = historyApi([oldRun], { 100: [{ ...oldJob, steps }] });
    assert.deepEqual(await evaluateReuse(marker, 'duplication', baseline, verifyEnv, api), {
      reuse: true,
      reason: 'validated-history',
    });
  }
});

test('zero-second analysis and mutation gate use their exact step durations', async () => {
  const marker = join(fixture, 'history-marker.json');
  markerWithTime(marker);
  const analysis = oldJob.steps![0]!;
  const zero = historyApi([oldRun], {
    100: [{ ...oldJob, steps: [{ ...analysis, completed_at: analysis.started_at }] }],
  });
  assert.deepEqual(await evaluateReuse(marker, 'duplication', baseline, verifyEnv, zero.api), {
    reuse: true,
    reason: 'validated-history',
    savedSeconds: 0,
  });

  const mutationFingerprint = fingerprint('mutation', fixture, runner);
  if (!mutationFingerprint) throw new Error('Mutation fixture must be fingerprintable');
  writeMarker(marker, 'mutation', mutationFingerprint, runner);
  const mutationMarker = JSON.parse(readFileSync(marker, 'utf8')) as Record<string, unknown>;
  mutationMarker.analyzedAt = analyzedAt;
  writeFileSync(marker, JSON.stringify(mutationMarker));
  const mutation = historyApi([oldRun], {
    100: [
      { ...oldJob, name: '🧬 Mutation', steps: [{ ...analysis, name: '🧬 Run mutation gate' }] },
    ],
  });
  assert.deepEqual(
    await evaluateReuse(marker, 'mutation', mutationFingerprint, verifyEnv, mutation.api),
    {
      reuse: true,
      reason: 'validated-history',
      savedSeconds: 20,
    }
  );
});

test('later failed, cancelled, and ongoing selected gates invalidate a prior success', async () => {
  const marker = join(fixture, 'history-marker.json');
  markerWithTime(marker);
  for (const [status, conclusion] of [
    ['completed', 'failure'],
    ['completed', 'cancelled'],
    ['in_progress', null],
  ] as const) {
    const changed = { ...laterRun, status, conclusion };
    const { api } = historyApi([changed, oldRun], {
      100: [oldJob],
      101: [{ ...oldJob, status, conclusion }],
    });
    const decision = await evaluateReuse(marker, 'duplication', baseline, verifyEnv, api);
    assert.equal(decision.reuse, false, `${status}/${conclusion}`);
  }
  // A failure that finished while the origin job was marking success must not
  // hide behind the marker's later local timestamp.
  const interleaved = {
    ...oldRun,
    id: 99,
    created_at: '2026-09-30T00:30:00Z',
    updated_at: '2026-09-30T01:04:30Z',
    conclusion: 'failure',
  };
  const history = historyApi([oldRun, interleaved], {
    100: [oldJob],
    99: [{ ...oldJob, conclusion: 'failure', completed_at: '2026-09-30T01:04:30Z' }],
  });
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, history.api)).reason,
    'newer-gate-invalid'
  );
});

test('same-run retries run fresh after API errors and failed analysis', async () => {
  const marker = join(fixture, 'rerun-marker.json');
  markerWithTime(marker);
  for (const event of ['schedule', 'workflow_dispatch']) {
    const current = {
      ...verifyEnv,
      GITHUB_EVENT_NAME: event,
      REUSE_SUCCESS: 'true',
      GITHUB_RUN_ID: '101',
      GITHUB_RUN_ATTEMPT: '1',
    };
    const unavailable = async () => ({ ok: false, json: async () => ({}) });
    assert.equal(
      (await evaluateReuse(marker, 'duplication', baseline, current, unavailable)).reason,
      'api-unavailable-or-incomplete'
    );
    // The resulting fresh analysis failed in this run's first attempt. A new
    // run sees that failure, but the runs API exposes only the current attempt
    // when this same run is retried.
    const failedRun = { ...laterRun, conclusion: 'failure' };
    const failedJob = { ...oldJob, conclusion: 'failure' };
    const failed = historyApi([failedRun, oldRun], { 100: [oldJob], 101: [failedJob] });
    assert.equal(
      (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, failed.api)).reason,
      'newer-gate-invalid'
    );
    for (const attempt of [2, 3]) {
      const history = historyApi(
        [{ ...laterRun, run_attempt: attempt, status: 'in_progress', conclusion: null }, oldRun],
        { 100: [oldJob], 101: [failedJob] }
      );
      assert.deepEqual(
        await evaluateReuse(
          marker,
          'duplication',
          baseline,
          { ...current, GITHUB_RUN_ATTEMPT: String(attempt) },
          history.api
        ),
        { reuse: false, reason: 'rerun-fresh' },
        `${event} attempt ${attempt}`
      );
      assert.deepEqual(history.requests, [], 'reruns must not accept API history');
    }
  }
});

test('reruns stay fresh even when the earlier selected attempt succeeded', async () => {
  const marker = join(fixture, 'rerun-success-marker.json');
  markerWithTime(marker);
  const history = historyApi(
    [{ ...laterRun, run_attempt: 2, status: 'in_progress', conclusion: null }, oldRun],
    { 100: [oldJob], 101: [oldJob] }
  );
  assert.deepEqual(
    await evaluateReuse(
      marker,
      'duplication',
      baseline,
      { ...verifyEnv, GITHUB_RUN_ID: '101', GITHUB_RUN_ATTEMPT: '2' },
      history.api
    ),
    { reuse: false, reason: 'rerun-fresh' }
  );
  assert.deepEqual(history.requests, []);
});

test('invalid current attempt provenance refuses reuse before Actions lookup', async () => {
  const marker = join(fixture, 'invalid-attempt-marker.json');
  markerWithTime(marker);
  for (const attempt of ['', '0', '-1', '1.5', 'invalid', '9007199254740992']) {
    const history = historyApi();
    assert.deepEqual(
      await evaluateReuse(
        marker,
        'duplication',
        baseline,
        { ...verifyEnv, GITHUB_RUN_ATTEMPT: attempt },
        history.api
      ),
      { reuse: false, reason: 'provenance-unavailable' },
      attempt
    );
    assert.deepEqual(history.requests, []);
  }
});

test('complete second pages of workflow runs and jobs are required', async () => {
  const marker = join(fixture, 'history-marker.json');
  markerWithTime(marker);
  const older = Array.from({ length: 100 }, (_, index) => ({
    ...oldRun,
    id: 1000 + index,
    created_at: '2026-09-29T00:00:00Z',
    updated_at: '2026-09-29T00:05:00Z',
  }));
  const unrelatedJobs = Array.from({ length: 100 }, (_, index) => ({
    ...oldJob,
    name: `Other ${index}`,
  }));
  const complete = historyApi([...older, oldRun], { 100: [...unrelatedJobs, oldJob] });
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, complete.api)).reuse,
    true
  );
  assert.ok(
    complete.requests.some((request) => request.includes('/runs?') && request.includes('page=2'))
  );
  assert.ok(
    complete.requests.some((request) => request.includes('/jobs?') && request.includes('page=2'))
  );
  const rerun = {
    ...oldRun,
    id: 99,
    created_at: '2026-09-29T00:00:00Z',
    updated_at: '2026-09-30T01:04:30Z',
    conclusion: 'failure',
  };
  const invalid = historyApi([...older.slice(0, 99), oldRun, rerun], {
    100: [oldJob],
    99: [{ ...oldJob, conclusion: 'failure' }],
  });
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, invalid.api)).reason,
    'newer-gate-invalid'
  );
});

test('skipped unrelated gate is safe, while missing selected gate and reruns run fresh', async () => {
  const marker = join(fixture, 'history-marker.json');
  markerWithTime(marker);
  const skipped = historyApi([laterRun, oldRun], {
    100: [oldJob],
    101: [{ ...oldJob, conclusion: 'skipped' }],
  });
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, skipped.api)).reuse,
    true
  );
  const missing = historyApi([laterRun, oldRun], { 100: [oldJob], 101: [] });
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, missing.api)).reason,
    'gate-history-incomplete'
  );
  const rerun = historyApi([{ ...oldRun, run_attempt: 2 }, laterRun], { 100: [oldJob] });
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, rerun.api)).reason,
    'origin-invalid'
  );
  const olderRerun = historyApi(
    [oldRun, { ...oldRun, id: 99, updated_at: '2026-09-30T03:00:00Z', conclusion: 'failure' }],
    { 100: [oldJob], 99: [{ ...oldJob, conclusion: 'failure' }] }
  );
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, olderRerun.api)).reason,
    'newer-gate-invalid'
  );
});

test('a newer successful marker restores reuse after the earlier failed run', async () => {
  for (const attempt of ['1', '2']) {
    const marker = join(fixture, 'recovered-marker.json');
    const recovered = {
      ...runner,
      GITHUB_RUN_ID: '102',
      GITHUB_RUN_ATTEMPT: attempt,
      GITHUB_SHA: 'c'.repeat(40),
    };
    markerWithTime(marker, '2026-09-30T04:05:00Z', recovered);
    const recoveredRun = {
      ...laterRun,
      id: 102,
      run_attempt: Number(attempt),
      head_sha: recovered.GITHUB_SHA,
      created_at: '2026-09-30T04:00:00Z',
      updated_at: '2026-09-30T04:07:00Z',
    };
    const recoveredJob = {
      ...oldJob,
      started_at: '2026-09-30T04:00:00Z',
      completed_at: '2026-09-30T04:04:00Z',
    };
    const { api } = historyApi([recoveredRun, { ...laterRun, conclusion: 'failure' }, oldRun], {
      102: [recoveredJob],
    });
    assert.equal(
      (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, api)).reuse,
      true
    );
  }
});

test('unavailable, truncated, or forged Actions history always runs fresh', async () => {
  const marker = join(fixture, 'history-marker.json');
  markerWithTime(marker);
  const absent = historyApi([laterRun]);
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, absent.api)).reason,
    'origin-invalid'
  );
  const unavailable = async () => ({ ok: false, json: async () => ({}) });
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, unavailable)).reason,
    'api-unavailable-or-incomplete'
  );
  const truncated = historyApi([oldRun], { 100: [oldJob] }, (url) =>
    url.pathname.endsWith('/runs') ? { total_count: 101, workflow_runs: [oldRun] } : undefined
  );
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, truncated.api)).reason,
    'api-unavailable-or-incomplete'
  );
  markerWithTime(marker, '2099-01-01T00:00:00Z');
  assert.equal(validMarker(marker, 'duplication', baseline), false);
  markerWithTime(marker, '2026-09-30T00:55:00Z');
  const validApi = historyApi();
  assert.equal(
    (await evaluateReuse(marker, 'duplication', baseline, verifyEnv, validApi.api)).reason,
    'origin-invalid'
  );
});

test('CLI fails closed when Actions history cannot be authenticated', () => {
  const script = fileURLToPath(new URL('./deep-check-reuse.ts', import.meta.url));
  const output = join(fixture, 'output.txt');
  const marker = join(fixture, 'cli-marker.json');
  const run = (args: string[], extraEnv: Record<string, string> = {}) => {
    writeFileSync(output, '');
    execFileSync(process.execPath, ['--experimental-strip-types', script, ...args], {
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
  assert.match(run(['verify', 'duplication', baseline, marker], verifyEnv), /reuse=false/);
  assert.match(
    run(['verify', 'duplication', baseline, marker], verifyEnv),
    /reason=provenance-unavailable/
  );
  assert.match(run(['verify', 'duplication', baseline, marker], verifyEnv), /origin_run_id=100/);
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
  const byName = (name: string) =>
    steps.findIndex((step) => step.startsWith(`      - name: ${name}`));

  const check = byName('🧬 Run mutation gate');
  const upload = byName('📊 Upload mutation reports');
  const summary = byName('✅ Record fresh mutation pass');
  const mark = byName('📝 Mark successful mutation');
  const save = byName('💾 Save successful mutation marker');
  assert.ok(check >= 0 && check < upload && upload < summary && summary < mark && mark < save);
  assert.equal(save, steps.length - 1); // No later required step can fail after the marker is saved.
  assert.match(steps[check]!, /if:.*steps\.marker\.outputs\.reuse != 'true'/);
  assert.match(steps[upload]!, /id: upload/);
  assert.match(steps[upload]!, /if:.*steps\.check\.outcome != 'skipped'/);
  assert.match(steps[upload]!, /if-no-files-found: error/);
  for (const step of [steps[summary]!, steps[mark]!]) {
    assert.match(step, /steps\.check\.outcome == 'success' && steps\.upload\.outcome == 'success'/);
  }
  assert.match(steps[save]!, /if:.*steps\.mark\.outcome == 'success'/);
});

test('each deep job pins Node before fingerprint without installing dependencies', () => {
  const workflow = readFileSync(
    fileURLToPath(new URL('../../.github/workflows/deep-checks.yaml', import.meta.url)),
    'utf8'
  );
  const duplication = workflow.split('\n  duplication:\n')[1]?.split('\n  mutation:\n')[0];
  const mutation = workflow.split('\n  mutation:\n')[1];
  assert.ok(duplication);
  assert.ok(mutation);

  for (const job of [duplication, mutation]) {
    const checkout = job.indexOf('      - name: 📥 Checkout code');
    const setup = job.indexOf('      - name: 📦 Setup fingerprint runtime');
    const fingerprint = job.indexOf('      - name: 🔑 Fingerprint');
    assert.ok(checkout >= 0 && checkout < setup && setup < fingerprint);
    assert.match(
      job.slice(setup, fingerprint),
      /uses: PiesP\/browser-core\/automation\/actions\/setup-project@[0-9a-f]{40}/
    );
    assert.match(job.slice(setup, fingerprint), /install-dependencies: 'false'/);
    assert.match(
      job.slice(fingerprint),
      /node --experimental-strip-types scripts\/ci\/deep-check-reuse\.ts fingerprint/
    );
  }

  const marker = mutation.indexOf('      - name: 🔎 Validate successful mutation marker');
  const freshSetup = mutation.indexOf('      - name: 📦 Setup project');
  const mutationCheck = mutation.indexOf('      - name: 🧬 Run mutation gate');
  assert.ok(marker >= 0 && marker < freshSetup && freshSetup < mutationCheck);
  assert.match(
    mutation.slice(freshSetup, mutationCheck),
    /if:.*steps\.marker\.outputs\.reuse != 'true'/
  );
});
