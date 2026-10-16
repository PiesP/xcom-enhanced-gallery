import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

// These are small unit doubles. Source-bound interruption acceptance uses installed Stryker separately.
const sourceLauncher = fileURLToPath(new URL('./mutation-workspace.ts', import.meta.url));
const owner = mkdtempSync(join(tmpdir(), 'xeg-mutation-boundary-'));
const maintainer = join(owner, 'maintainer');
const coreOrigin = join(owner, 'core-origin');
const runnerTemp = join(owner, 'runner-temp');
mkdirSync(runnerTemp);
after(() => rmSync(owner, { recursive: true, force: true }));

function write(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function git(cwd: string, ...args: string[]): string {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  });
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}

function commit(cwd: string, message: string): void {
  git(cwd, 'add', '-A');
  git(
    cwd,
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    'commit',
    '-qm',
    message
  );
}

git(owner, 'init', '-q', coreOrigin);
write(join(coreOrigin, 'package.json'), '{"name":"@piesp/browser-core","version":"0.0.0"}\n');
write(join(coreOrigin, 'src/index.js'), 'export const core = 1;\n');
commit(coreOrigin, 'core fixture');

git(owner, 'init', '-q', maintainer);
write(join(maintainer, '.gitignore'), 'node_modules/\nreports/\n.stryker-tmp*/\n');
write(
  join(maintainer, 'package.json'),
  '{"name":"xcom-enhanced-gallery","private":true,"type":"module"}\n'
);
write(join(maintainer, 'stryker.conf.json'), '{"inPlace":true}\n');
write(join(maintainer, 'stryker.conf.fast.json'), '{"inPlace":true}\n');
write(join(maintainer, 'src/committed.txt'), 'committed source\n');
mkdirSync(join(maintainer, 'scripts/ci'), { recursive: true });
copyFileSync(sourceLauncher, join(maintainer, 'scripts/ci/mutation-workspace.ts'));
git(
  maintainer,
  '-c',
  'protocol.file.allow=always',
  'submodule',
  'add',
  `file://${coreOrigin}`,
  'packages/core'
);
commit(maintainer, 'protected committed source');
const selected = git(maintainer, 'rev-parse', 'HEAD');

write(join(maintainer, 'src/staged.txt'), 'staged private change\n');
git(maintainer, 'add', 'src/staged.txt');
write(join(maintainer, 'src/committed.txt'), 'unstaged private change\n');
write(join(maintainer, 'private-untracked.txt'), 'untracked private change\n');
write(join(maintainer, 'packages/core/src/index.js'), 'export const core = "dirty private";\n');

function protectedState(): Record<string, string> {
  const names = [
    'src/committed.txt',
    'src/staged.txt',
    'private-untracked.txt',
    'packages/core/src/index.js',
    '.git/index',
    '.git/modules/packages/core/index',
  ];
  const state = Object.fromEntries(
    names.map((name) => [name, readFileSync(join(maintainer, name)).toString('hex')])
  );
  state.refs = git(maintainer, 'for-each-ref', '--format=%(refname) %(objectname)');
  state.head = git(maintainer, 'rev-parse', 'HEAD');
  state.indexEntries = git(maintainer, 'ls-files', '--stage');
  state.status = git(maintainer, 'status', '--porcelain=v1', '--untracked-files=all');
  state.coreHead = git(join(maintainer, 'packages/core'), 'rev-parse', 'HEAD');
  state.coreStatus = git(join(maintainer, 'packages/core'), 'status', '--porcelain=v1');
  return state;
}

const original = protectedState();
function maintainerUnchanged(): void {
  assert.deepEqual(protectedState(), original);
}

const fakeStryker = `import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
writeFileSync(process.env.FAKE_MUTATION_MODE === 'hold'
  ? '.git/xeg-mutation/run/fake-argv.json' : 'fake-argv.json', JSON.stringify(args));
if (process.env.FAKE_MUTATION_MODE === 'fail') process.exit(7);
if (process.env.FAKE_MUTATION_MODE === 'hold') {
  writeFileSync('.git/xeg-mutation/run/fake-started', 'started');
  const deadline = Date.now() + 10000;
  while (!existsSync('fake-release') && Date.now() < deadline) await new Promise((done) => setTimeout(done, 20));
  if (!existsSync('fake-release')) process.exit(8);
}
if (args[1] === 'stryker.conf.fast.json' && !args.includes('--dryRunOnly')) {
  mkdirSync(join('reports', 'mutation'), { recursive: true });
  const mode = process.env.FAKE_MUTATION_MODE;
  writeFileSync(join('reports', 'mutation', 'mutation.json'), mode === 'malformed'
    ? '{bad'
    : JSON.stringify({ files: { 'src/committed.txt': { mutants: mode === 'empty' ? [] : [{ status: 'Killed' }] } } }));
  writeFileSync(join('reports', 'mutation', 'mutation.html'), '<html>fixture</html>');
}
`;

function clone(): string {
  const execution = join(owner, `execution-${randomUUID()}`);
  git(owner, 'clone', '--no-local', '--no-hardlinks', '--no-checkout', maintainer, execution);
  git(execution, '-c', 'advice.detachedHead=false', 'checkout', '--detach', selected);
  git(
    execution,
    '-c',
    'protocol.file.allow=always',
    'submodule',
    'update',
    '--init',
    '--recursive'
  );
  const installedCore = join(execution, 'node_modules/@piesp/browser-core');
  for (const name of ['package.json', 'src/index.js']) {
    const destination = join(installedCore, name);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(execution, 'packages/core', name), destination);
  }
  const stryker = join(execution, 'node_modules/@stryker-mutator/core');
  write(join(stryker, 'package.json'), '{"name":"@stryker-mutator/core","version":"10.0.0"}\n');
  write(join(stryker, 'bin/stryker.js'), fakeStryker);
  return execution;
}

function invoke(cwd: string, args: string[], extraEnv: Record<string, string> = {}) {
  return spawnSync(
    process.execPath,
    ['--experimental-strip-types', 'scripts/ci/mutation-workspace.ts', ...args],
    {
      cwd,
      encoding: 'utf8',
      timeout: 15000,
      env: { ...process.env, ...extraEnv },
    }
  );
}

function prepared(): string {
  const execution = clone();
  const result = invoke(execution, ['prepare', maintainer, selected]);
  assert.equal(result.status, 0, result.stderr);
  return execution;
}

function runRecord(execution: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(execution, '.git/xeg-mutation/run/result.json'), 'utf8')
  ) as Record<string, unknown>;
}

test('both ordinary maintainer commands refuse before instrumentation without changing protected state', () => {
  for (const profile of ['full', 'fast']) {
    const result = invoke(maintainer, ['run', profile], { CI: 'true' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /refused before instrumentation/i);
    assert.equal(existsSync(join(maintainer, '.git/xeg-mutation')), false);
    assert.equal(existsSync(join(maintainer, 'fake-argv.json')), false);
    maintainerUnchanged();
  }
});

test('explicit committed preparation admits an independent clone without copying private edits', () => {
  const execution = prepared();
  assert.equal(realpathSync(execution) === realpathSync(maintainer), false);
  assert.equal(git(execution, 'remote', 'get-url', 'origin'), realpathSync(maintainer));
  assert.equal(readFileSync(join(execution, 'src/committed.txt'), 'utf8'), 'committed source\n');
  assert.equal(existsSync(join(execution, 'src/staged.txt')), false);
  assert.equal(existsSync(join(execution, 'private-untracked.txt')), false);
  assert.equal(
    readFileSync(join(execution, 'packages/core/src/index.js'), 'utf8'),
    'export const core = 1;\n'
  );
  assert.equal(
    realpathSync(git(join(execution, 'packages/core'), 'rev-parse', '--absolute-git-dir')),
    join(execution, '.git/modules/packages/core')
  );
  assert.equal(
    readFileSync(join(execution, 'node_modules/@piesp/browser-core/src/index.js'), 'utf8'),
    'export const core = 1;\n'
  );
  assert.equal(invoke(execution, ['prepare', maintainer, selected]).status, 2);
  maintainerUnchanged();
});

test('local admission keeps clone origin bound to the named source during preparation and execution', () => {
  const swapped = clone();
  git(swapped, 'remote', 'set-url', 'origin', 'https://github.com/PiesP/xcom-enhanced-gallery.git');
  assert.notEqual(invoke(swapped, ['prepare', maintainer, selected]).status, 0);
  assert.equal(existsSync(join(swapped, '.git/xeg-mutation')), false);

  const execution = prepared();
  const other = clone();
  const recordPath = join(execution, '.git/xeg-mutation/prepared.json');
  const changed = JSON.parse(readFileSync(recordPath, 'utf8')) as Record<string, unknown>;
  changed.source = other;
  writeFileSync(recordPath, `${JSON.stringify(changed)}\n`);
  assert.notEqual(invoke(execution, ['run', 'fast']).status, 0);
  assert.equal(existsSync(join(execution, '.git/xeg-mutation/run')), false);
  assert.equal(existsSync(join(execution, 'fake-argv.json')), false);

  const originChanged = prepared();
  git(
    originChanged,
    'remote',
    'set-url',
    'origin',
    'https://github.com/PiesP/xcom-enhanced-gallery.git'
  );
  assert.notEqual(invoke(originChanged, ['run', 'fast']).status, 0);
  assert.equal(existsSync(join(originChanged, '.git/xeg-mutation/run')), false);
  assert.equal(existsSync(join(originChanged, 'fake-argv.json')), false);
  maintainerUnchanged();
});

test('core common object storage outside the clone is refused before preparation', () => {
  const execution = clone();
  const coreDir = realpathSync(
    git(join(execution, 'packages/core'), 'rev-parse', '--absolute-git-dir')
  );
  const externalCommon = realpathSync(join(coreOrigin, '.git'));
  write(join(coreDir, 'commondir'), `${externalCommon}\n`);
  assert.equal(
    realpathSync(git(join(execution, 'packages/core'), 'rev-parse', '--git-common-dir')),
    externalCommon
  );
  const result = invoke(execution, ['prepare', maintainer, selected]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Core and object storage must belong/);
  assert.equal(existsSync(join(execution, '.git/xeg-mutation')), false);
  maintainerUnchanged();
});

test('Git worktree routing outside either execution root is refused before preparation', () => {
  for (const scope of ['root', 'core'] as const) {
    const execution = clone();
    const external = clone();
    const location = scope === 'root' ? execution : join(execution, 'packages/core');
    const target = scope === 'root' ? external : join(external, 'packages/core');
    git(location, 'config', 'core.worktree', target);
    assert.equal(realpathSync(git(location, 'rev-parse', '--show-toplevel')), target);

    const result = invoke(execution, ['prepare', maintainer, selected]);
    assert.notEqual(result.status, 0, `${scope}: ${result.stderr}`);
    assert.match(result.stderr, /Git worktree|execution checkout|top-level/i);
    assert.equal(existsSync(join(execution, '.git/xeg-mutation')), false);
    assert.equal(existsSync(join(execution, 'fake-argv.json')), false);
    maintainerUnchanged();
  }
});

test('a nonregular installed core file is refused without an empty-content fallback', () => {
  const execution = clone();
  const installedFile = join(execution, 'node_modules/@piesp/browser-core/src/index.js');
  rmSync(installedFile);
  mkdirSync(installedFile);
  const result = invoke(execution, ['prepare', maintainer, selected]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Installed file:packages\/core differs|regular file/i);
  assert.equal(existsSync(join(execution, '.git/xeg-mutation')), false);
  assert.equal(existsSync(join(execution, 'fake-argv.json')), false);
  maintainerUnchanged();
});

test('fresh checkout rejects untracked or ignored inputs outside installed dependencies', () => {
  for (const name of [
    'src/untracked.ts',
    'test/unit/untracked.test.ts',
    'vitest.config.ts',
    'reports/mutation/stale.txt',
    '.stryker-tmp-stale/backup.txt',
    '.deep-check-cache/mutation.json',
  ]) {
    const execution = clone();
    write(join(execution, name), 'unexpected source or report\n');
    assert.notEqual(invoke(execution, ['prepare', maintainer, selected]).status, 0, name);
    assert.equal(existsSync(join(execution, '.git/xeg-mutation')), false, name);
  }
  const preparedExecution = prepared();
  write(join(preparedExecution, 'src/untracked.ts'), 'untracked after preparation\n');
  assert.notEqual(invoke(preparedExecution, ['run', 'fast']).status, 0);
  assert.equal(existsSync(join(preparedExecution, '.git/xeg-mutation/run')), false);
  assert.equal(existsSync(join(preparedExecution, 'fake-argv.json')), false);
  maintainerUnchanged();
});

test('wrong commit, copied record, path escape, and shared core dependency are refused', () => {
  const wrong = clone();
  assert.equal(invoke(wrong, ['prepare', maintainer, 'a'.repeat(40)]).status, 2);
  assert.equal(existsSync(join(wrong, '.git/xeg-mutation')), false);

  const first = prepared();
  const second = clone();
  mkdirSync(join(second, '.git/xeg-mutation'));
  copyFileSync(
    join(first, '.git/xeg-mutation/prepared.json'),
    join(second, '.git/xeg-mutation/prepared.json')
  );
  assert.match(invoke(second, ['run', 'fast']).stderr, /Mismatched preparation record/);
  assert.equal(existsSync(join(second, 'fake-argv.json')), false);

  const escaped = clone();
  symlinkSync(maintainer, join(escaped, 'reports'));
  assert.notEqual(invoke(escaped, ['prepare', maintainer, selected]).status, 0);
  assert.equal(existsSync(join(escaped, '.git/xeg-mutation')), false);

  const shared = clone();
  rmSync(join(shared, 'node_modules/@piesp/browser-core'), { recursive: true });
  symlinkSync(join(maintainer, 'packages/core'), join(shared, 'node_modules/@piesp/browser-core'));
  assert.notEqual(invoke(shared, ['prepare', maintainer, selected]).status, 0);
  assert.equal(existsSync(join(shared, '.git/xeg-mutation')), false);
  maintainerUnchanged();
});

test('full and fast profiles forward supported arguments and retain one analysis claim', () => {
  const full = prepared();
  const fullResult = invoke(full, [
    'run',
    'full',
    '--dryRunOnly',
    '-c',
    '2',
    '--logLevel=debug',
    '--mutate',
    'src/*.ts',
    '--testFiles',
    'test/**/*.test.ts',
  ]);
  assert.equal(fullResult.status, 0, fullResult.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(full, 'fake-argv.json'), 'utf8')), [
    'run',
    'stryker.conf.json',
    '--reporters=progress',
    '--dryRunOnly',
    '-c',
    '2',
    '--logLevel',
    'debug',
    '--mutate',
    'src/*.ts',
    '--testFiles',
    'test/**/*.test.ts',
  ]);
  assert.equal(runRecord(full).status, 'dry-run-only');
  assert.notEqual(invoke(full, ['run', 'fast']).status, 0);

  const fast = prepared();
  assert.equal(invoke(fast, ['run', 'fast']).status, 0);
  assert.deepEqual(JSON.parse(readFileSync(join(fast, 'fake-argv.json'), 'utf8')), [
    'run',
    'stryker.conf.fast.json',
  ]);
  assert.equal(runRecord(fast).status, 'completed');
  assert.equal(existsSync(join(fast, 'reports/mutation/mutation.json')), true);
  maintainerUnchanged();
});

test('unsafe output and path arguments refuse before a run claim or fake child', () => {
  const execution = prepared();
  for (const args of [
    ['--tempDirName', '../../maintainer'],
    ['--reporters', 'html'],
    ['--mutate', '../maintainer/src/*.ts'],
    ['--mutate', join(maintainer, 'src/committed.txt')],
    ['--mutate', 'src/{private,public}.ts'],
    ['--mutate', 'src/[a-z].ts'],
    ['--testFiles', 'test/**/../private.test.ts'],
  ]) {
    const result = invoke(execution, ['run', 'fast', ...args]);
    assert.notEqual(result.status, 0);
    assert.equal(existsSync(join(execution, '.git/xeg-mutation/run')), false);
    assert.equal(existsSync(join(execution, 'fake-argv.json')), false);
  }
  maintainerUnchanged();
});

test('child failure and malformed or empty reports never create successful receipts', () => {
  for (const mode of ['fail', 'malformed', 'empty']) {
    const execution = prepared();
    const result = invoke(execution, ['run', 'fast'], { FAKE_MUTATION_MODE: mode });
    assert.notEqual(result.status, 0, mode);
    const receipt = runRecord(execution);
    assert.notEqual(receipt.status, 'completed', mode);
    assert.equal(receipt.exitCode, mode === 'fail' ? 7 : 1);
    assert.equal(existsSync(join(execution, '.git/xeg-mutation/run/start.json')), true);
    assert.equal(existsSync(join(execution, '.git/xeg-mutation/run/child.log')), true);
    maintainerUnchanged();
  }
});

test('an active run owns its single-use claim and a second run refuses', async () => {
  const execution = prepared();
  const child = spawn(
    process.execPath,
    ['--experimental-strip-types', 'scripts/ci/mutation-workspace.ts', 'run', 'fast'],
    {
      cwd: execution,
      env: { ...process.env, FAKE_MUTATION_MODE: 'hold' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const completion = new Promise<number | null>((done) => child.once('close', done));
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });
  try {
    const deadline = Date.now() + 5000;
    while (
      !existsSync(join(execution, '.git/xeg-mutation/run/fake-started')) &&
      Date.now() < deadline
    ) {
      await new Promise((done) => setTimeout(done, 20));
    }
    assert.equal(existsSync(join(execution, '.git/xeg-mutation/run/fake-started')), true, stderr);
    assert.match(invoke(execution, ['run', 'fast']).stderr, /already claimed/);
  } finally {
    write(join(execution, 'fake-release'), 'release');
    const exit = await completion;
    assert.equal(exit, 0, stderr);
  }
  assert.equal(runRecord(execution).status, 'completed');
  maintainerUnchanged();
});

function hostedEnv(
  execution: string,
  commit = selected,
  workflow: 'release' | 'deep-checks' = 'release'
): Record<string, string> {
  return {
    MUTATION_WORKSPACE_CONTRACT: 'github-job-v1',
    MUTATION_SOURCE_SHA: commit,
    GITHUB_ACTIONS: 'true',
    RUNNER_ENVIRONMENT: 'github-hosted',
    RUNNER_OS: 'Linux',
    GITHUB_REPOSITORY: 'PiesP/xcom-enhanced-gallery',
    GITHUB_JOB: 'mutation',
    GITHUB_RUN_ID: '42',
    GITHUB_RUN_ATTEMPT: '1',
    GITHUB_WORKFLOW_REF: `PiesP/xcom-enhanced-gallery/.github/workflows/${workflow}.yaml@refs/heads/master`,
    GITHUB_WORKSPACE: execution,
    RUNNER_TEMP: runnerTemp,
    GITHUB_SHA: workflow === 'deep-checks' ? commit : 'f'.repeat(40),
  };
}

test('Deep admits only its restored success-marker path before a fresh mutation', () => {
  const execution = clone();
  const marker = join(execution, '.deep-check-cache/mutation.json');
  write(marker, '{"result":"previous successful analysis"}\n');
  const env = hostedEnv(execution, selected, 'deep-checks');
  assert.equal(invoke(execution, ['prepare-hosted'], env).status, 0);
  assert.equal(invoke(execution, ['run', 'fast'], env).status, 0);
  assert.equal(runRecord(execution).status, 'completed');
  assert.equal(readFileSync(marker, 'utf8'), '{"result":"previous successful analysis"}\n');

  const extra = clone();
  write(join(extra, '.deep-check-cache/mutation.json'), '{}\n');
  write(join(extra, '.deep-check-cache/other.json'), '{}\n');
  assert.notEqual(
    invoke(extra, ['prepare-hosted'], hostedEnv(extra, selected, 'deep-checks')).status,
    0
  );
  assert.equal(existsSync(join(extra, '.git/xeg-mutation')), false);

  const release = clone();
  write(join(release, '.deep-check-cache/mutation.json'), '{}\n');
  assert.notEqual(invoke(release, ['prepare-hosted'], hostedEnv(release)).status, 0);
  assert.equal(existsSync(join(release, '.git/xeg-mutation')), false);
  maintainerUnchanged();
});

test('hosted admission binds verified release commit independently of workflow SHA', () => {
  const execution = clone();
  const env = hostedEnv(execution);
  assert.equal(invoke(execution, ['prepare-hosted'], env).status, 0);
  assert.notEqual(invoke(execution, ['run', 'fast', '--dryRunOnly'], env).status, 0);
  assert.equal(invoke(execution, ['run', 'fast'], env).status, 0);
  assert.equal(runRecord(execution).status, 'completed');
  maintainerUnchanged();
});

test('CI=true alone and wrong hosted source cannot prepare a checkout', () => {
  const bare = clone();
  assert.notEqual(invoke(bare, ['prepare-hosted'], { CI: 'true' }).status, 0);
  assert.equal(existsSync(join(bare, '.git/xeg-mutation')), false);
  const wrong = clone();
  assert.notEqual(invoke(wrong, ['prepare-hosted'], hostedEnv(wrong, 'a'.repeat(40))).status, 0);
  assert.equal(existsSync(join(wrong, '.git/xeg-mutation')), false);
  maintainerUnchanged();
});
