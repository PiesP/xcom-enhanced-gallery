#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const shaPattern = /^[0-9a-f]{40}$/;
const branch = 'automation/update-browser-core';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function run(file: string, args: string[]): string {
  return execFileSync(file, args, { encoding: 'utf8' }).trim();
}

function succeeds(file: string, args: string[]): boolean {
  try {
    run(file, args);
    return true;
  } catch {
    return false;
  }
}

function output(name: 'GITHUB_OUTPUT' | 'GITHUB_ENV' | 'GITHUB_STEP_SUMMARY', value: string): void {
  appendFileSync(required(name), value);
}

function sha(value: string, label: string): string {
  if (!shaPattern.test(value)) throw new Error(`Invalid ${label} SHA: ${value}`);
  return value;
}

function sameRepoPr(repository: string): string {
  const raw = JSON.parse(
    run('gh', [
      'pr',
      'list',
      '--repo',
      repository,
      '--state',
      'open',
      '--base',
      'master',
      '--head',
      branch,
      '--json',
      'number,headRepository,isCrossRepository',
    ])
  ) as unknown;
  if (!Array.isArray(raw)) throw new Error('Invalid pull request list');
  for (const item of raw) {
    if (!item || typeof item !== 'object') throw new Error('Invalid pull request');
    const pr = item as {
      number?: unknown;
      headRepository?: { nameWithOwner?: unknown };
      isCrossRepository?: unknown;
    };
    if (pr.isCrossRepository === false && pr.headRepository?.nameWithOwner === repository) {
      if (!Number.isSafeInteger(pr.number) || Number(pr.number) < 1)
        throw new Error('Invalid pull request number');
      return String(pr.number);
    }
  }
  return '';
}

function prepare(): void {
  const coreRepository = required('CORE_REPOSITORY');
  const eventSha = process.env.EVENT_CORE_SHA ?? '';
  const inputSha = process.env.INPUT_CORE_SHA ?? '';
  let coreSha: string;
  if (eventSha) {
    if (process.env.EVENT_CORE_REPOSITORY !== coreRepository)
      throw new Error('Unexpected core repository');
    coreSha = eventSha;
  } else if (inputSha) coreSha = inputSha;
  else
    coreSha =
      run('git', [
        'ls-remote',
        `https://github.com/${coreRepository}.git`,
        'refs/heads/master',
      ]).split(/\s+/)[0] ?? '';
  sha(coreSha, 'browser-core');
  const remoteRaw = run('git', ['ls-remote', '--heads', 'origin', branch]);
  const remoteBranchSha = remoteRaw
    ? sha(remoteRaw.split(/\s+/)[0] ?? '', 'automation branch')
    : '';
  const repository = required('GITHUB_REPOSITORY');
  const openPr = sameRepoPr(repository);
  if (process.env.GITHUB_EVENT_NAME === 'push' && !openPr) {
    console.log('No open browser-core update PR requires rebasing after this master push.');
    output('GITHUB_OUTPUT', 'ready=false\n');
    output(
      'GITHUB_STEP_SUMMARY',
      'No open browser-core update PR; skipping classification and publication.\n'
    );
    return;
  }

  run('git', ['fetch', 'origin', 'master']);
  run('git', ['switch', '-C', branch, 'origin/master']);
  run('git', ['config', 'user.name', 'github-actions[bot]']);
  run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  const currentCoreSha = sha(
    run('git', ['rev-parse', 'origin/master:packages/core']),
    'current gitlink'
  );
  run('git', [
    'clone',
    '--filter=blob:none',
    '--no-checkout',
    `https://github.com/${coreRepository}.git`,
    'packages/core',
  ]);
  run('git', ['-C', 'packages/core', 'fetch', '--no-tags', 'origin', 'master']);
  if (!succeeds('git', ['-C', 'packages/core', 'cat-file', '-e', `${coreSha}^{commit}`]))
    throw new Error(`browser-core commit does not exist: ${coreSha}`);
  if (
    !succeeds('git', [
      '-C',
      'packages/core',
      'merge-base',
      '--is-ancestor',
      coreSha,
      'origin/master',
    ])
  )
    throw new Error(`browser-core commit is not reachable from origin/master: ${coreSha}`);
  if (
    succeeds('git', ['-C', 'packages/core', 'cat-file', '-e', `${currentCoreSha}^{commit}`]) &&
    !succeeds('git', [
      '-C',
      'packages/core',
      'merge-base',
      '--is-ancestor',
      currentCoreSha,
      coreSha,
    ])
  )
    throw new Error(
      `browser-core update would downgrade or diverge: ${currentCoreSha} -> ${coreSha}`
    );

  output(
    'GITHUB_ENV',
    `${[
      `CORE_SHA=${coreSha}`,
      `CURRENT_CORE_SHA=${currentCoreSha}`,
      `SHORT_SHA=${coreSha.slice(0, 12)}`,
      `BRANCH=${branch}`,
      `REMOTE_BRANCH_SHA=${remoteBranchSha}`,
      `OPEN_PR=${openPr}`,
    ].join('\n')}\n`
  );
  output('GITHUB_OUTPUT', `ready=true\nbase=${currentCoreSha}\nhead=${coreSha}\n`);
}

function closeStale(pr: string, dryRun: boolean, comment: string): void {
  if (!pr) return;
  if (dryRun) console.log(`Dry run: would close stale browser-core update PR #${pr}.`);
  else run('gh', ['pr', 'close', pr, '--comment', comment]);
}

function publish(): void {
  const coreSha = sha(required('CORE_SHA'), 'target core');
  const currentCoreSha = sha(required('CURRENT_CORE_SHA'), 'current gitlink');
  const classifiedBase = process.env.CLASSIFIED_BASE_SHA;
  const classifiedCore = process.env.CLASSIFIED_CORE_SHA;
  if (classifiedBase !== undefined || classifiedCore !== undefined) {
    if (
      sha(classifiedBase ?? '', 'classified base') !== currentCoreSha ||
      sha(classifiedCore ?? '', 'classified target') !== coreSha
    )
      throw new Error('browser-core revisions changed after read-only classification');
  }
  const shortSha = coreSha.slice(0, 12);
  const remoteBranchSha = process.env.REMOTE_BRANCH_SHA ?? '';
  if (remoteBranchSha) sha(remoteBranchSha, 'automation branch');
  const openPr = process.env.OPEN_PR ?? '';
  if (openPr && !/^[1-9][0-9]*$/.test(openPr)) throw new Error('Invalid open pull request number');
  const repository = required('GITHUB_REPOSITORY');
  const impact = process.env.CONSUMER_IMPACT;
  const dryRun = process.env.DRY_RUN === 'true';
  output(
    'GITHUB_STEP_SUMMARY',
    `${[
      '### browser-core update classification',
      `Consumer impact: ${impact ?? ''}`,
      '',
      `Current gitlink: ${currentCoreSha}`,
      '',
      `Target core: ${coreSha}`,
      '',
      `Automation branch: ${branch} at ${remoteBranchSha || 'absent'}`,
      '',
      `Open same-repository PR: ${openPr || 'absent'}`,
      '',
      `Dry run: ${process.env.DRY_RUN || 'false'}`,
    ].join('\n')}\n`
  );
  if (impact !== 'true' && impact !== 'false')
    throw new Error(`Invalid consumer impact result: ${impact}`);
  if (impact === 'false') {
    closeStale(
      openPr,
      dryRun,
      `Closing this stale update PR because browser-core ${shortSha} has no consumer-facing changes.`
    );
    console.log(`browser-core ${shortSha} has no consumer-facing changes.`);
    return;
  }
  run('git', ['-C', 'packages/core', 'checkout', '--detach', coreSha]);
  if (succeeds('git', ['diff', '--quiet', '--', 'packages/core'])) {
    closeStale(
      openPr,
      dryRun,
      `Closing this stale update PR because master already contains browser-core ${shortSha}.`
    );
    console.log(`browser-core is already at ${shortSha}.`);
    return;
  }
  if (dryRun) {
    console.log(`Dry run: would update the packages/core gitlink to ${coreSha}.`);
    return;
  }
  run('git', ['add', 'packages/core']);
  run('git', ['commit', '-m', `chore(deps): update browser-core to ${shortSha}`]);
  const expectedHead = sha(run('git', ['rev-parse', 'HEAD']), 'generated head');
  const changed = run('git', ['diff', '--name-only', 'origin/master...HEAD'])
    .split('\n')
    .filter(Boolean);
  if (changed.length !== 1 || changed[0] !== 'packages/core')
    throw new Error(`Refusing to publish non-gitlink changes: ${changed.join(', ')}`);
  // Credentials are resolved only for this push; checkout retains no token.
  run('git', [
    '-c',
    'credential.helper=',
    '-c',
    'credential.https://github.com.helper=!gh auth git-credential',
    'push',
    '--set-upstream',
    'origin',
    branch,
    ...(remoteBranchSha ? [`--force-with-lease=refs/heads/${branch}:${remoteBranchSha}`] : []),
  ]);
  const title = `chore(deps): update browser-core to ${shortSha}`;
  const body = `This PR updates the packages/core git submodule to browser-core commit ${coreSha}.\n\nThe repository's pull-request CI and security workflows provide the required checks.\nBecause this PR uses GITHUB_TOKEN, GitHub may hold their initial runs for approval.\n\nGenerated by the browser-core update workflow.`;
  let prNumber: string;
  if (openPr) {
    prNumber = openPr;
    run('gh', ['pr', 'edit', prNumber, '--title', title, '--body', body]);
    console.log(`Updated browser-core PR #${prNumber} to ${shortSha} on top of current master.`);
  } else {
    const url = run('gh', [
      'pr',
      'create',
      '--base',
      'master',
      '--head',
      branch,
      '--title',
      title,
      '--body',
      body,
    ]);
    prNumber = url.split('/').at(-1) ?? '';
    if (!/^[1-9][0-9]*$/.test(prNumber)) throw new Error(`Invalid created PR URL: ${url}`);
    console.log(`Created browser-core update PR #${prNumber}.`);
  }
  const view = JSON.parse(
    run('gh', ['pr', 'view', prNumber, '--repo', repository, '--json', 'headRefOid'])
  ) as { headRefOid?: unknown };
  if (view.headRefOid !== expectedHead)
    throw new Error(
      `PR head changed before handoff: expected ${expectedHead}, found ${String(view.headRefOid)}`
    );
  if (process.env.PREFLIGHT === 'true') {
    for (const workflow of ['🏗️ CI', '🔒 Security Scanning']) {
      if (!succeeds('gh', ['workflow', 'run', workflow, '--repo', repository, '--ref', branch]))
        console.warn(`Optional ${workflow} preflight dispatch failed`);
    }
  }
  console.log(
    `PR #${prNumber} is open at ${expectedHead}. Approve its pull-request workflows to run the required checks, then review the exact head.`
  );
}

function main(): void {
  switch (process.argv[2]) {
    case 'prepare':
      prepare();
      break;
    case 'publish':
      publish();
      break;
    default:
      throw new Error('Expected prepare or publish');
  }
}

function isCliEntry(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isCliEntry()) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    const failure = error as { status?: number; signal?: string };
    process.exitCode =
      failure.signal === 'SIGINT'
        ? 130
        : failure.signal === 'SIGTERM'
          ? 143
          : (failure.status ?? 1);
  }
}
