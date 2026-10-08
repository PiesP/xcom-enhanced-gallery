#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Json = Record<string, unknown>;
const shaPattern = /^[0-9a-f]{40}$/;
const reasons = new Set([
  'maintainer review required for all dependency updates',
  'security update requires prioritized maintainer review',
]);

function requireAutomaticAdmission(): void {
  throw new Error('Automatic dependency admission is disabled; maintainer review required');
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function command(file: string, args: string[]): string {
  return execFileSync(file, args, { encoding: 'utf8' }).trim();
}

function api(path: string, paginate = false): unknown {
  return JSON.parse(command('gh', ['api', ...(paginate ? ['--paginate', '--slurp'] : []), path]));
}

function object(value: unknown): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid GitHub response');
  return value as Json;
}

function nested(value: unknown, ...keys: string[]): unknown {
  return keys.reduce<unknown>((current, key) => object(current)[key], value);
}

function identity(): { repository: string; number: string; head: string; base: string } {
  const repository = required('GITHUB_REPOSITORY');
  const number = required('PR_NUMBER');
  const head = required('HEAD_SHA');
  const base = required('BASE_REF');
  if (!/^[1-9][0-9]*$/.test(number) || !shaPattern.test(head) || !base) {
    throw new Error('Invalid validated pull request identity');
  }
  return { repository, number, head, base };
}

function livePull(id: ReturnType<typeof identity>): Json {
  return object(api(`repos/${id.repository}/pulls/${id.number}`));
}

function assertPull(pr: Json, id: ReturnType<typeof identity>, expectedBase: string): void {
  if (
    nested(pr, 'user', 'login') !== 'dependabot[bot]' ||
    nested(pr, 'head', 'repo', 'full_name') !== id.repository ||
    nested(pr, 'head', 'sha') !== id.head ||
    nested(pr, 'base', 'ref') !== expectedBase ||
    pr.draft !== false ||
    pr.state !== 'open'
  )
    throw new Error('Pull request changed after Dependabot validation');
}

export function parseGate(
  value: unknown,
  repository: string
): {
  eligible: boolean;
  number: string;
  head: string;
  base: string;
  reason: string;
} {
  const gate = object(value);
  const number = gate.pull_request_number;
  if (
    gate.schema_version !== 2 ||
    gate.policy_id !== 'maintainer-review-v1' ||
    gate.repository !== repository ||
    !Number.isSafeInteger(number) ||
    Number(number) < 1 ||
    typeof gate.head_sha !== 'string' ||
    !shaPattern.test(gate.head_sha) ||
    typeof gate.base_ref !== 'string' ||
    !gate.base_ref ||
    /[\r\n]/.test(gate.base_ref) ||
    gate.eligible !== false ||
    typeof gate.reason !== 'string' ||
    !reasons.has(gate.reason)
  )
    throw new Error('Invalid Dependabot gate result');
  return {
    eligible: gate.eligible as boolean,
    number: String(number),
    head: gate.head_sha,
    base: gate.base_ref,
    reason: gate.reason,
  };
}

function gate(): void {
  const result = parseGate(
    JSON.parse(readFileSync(required('GATE_PATH'), 'utf8')),
    required('GITHUB_REPOSITORY')
  );
  appendFileSync(
    required('GITHUB_OUTPUT'),
    `${[
      `eligible=${result.eligible}`,
      `pull_request_number=${result.number}`,
      `head_sha=${result.head}`,
      `base_ref=${result.base}`,
      `reason_base64=${Buffer.from(result.reason).toString('base64')}`,
    ].join('\n')}\n`
  );
}

function validate(): void {
  const id = identity();
  const defaultBranch = nested(api(`repos/${id.repository}`), 'default_branch');
  if (typeof defaultBranch !== 'string' || id.base !== defaultBranch)
    throw new Error('Gate base is not default branch');
  assertPull(livePull(id), id, defaultBranch);
  const pages = api(`repos/${id.repository}/pulls/${id.number}/commits`, true);
  if (!Array.isArray(pages)) throw new Error('Invalid commit pagination');
  let seenHead = false;
  for (const page of pages) {
    if (!Array.isArray(page)) throw new Error('Invalid commit page');
    for (const rawCommit of page) {
      const commit = object(rawCommit);
      if (
        nested(commit, 'author', 'login') !== 'dependabot[bot]' ||
        nested(commit, 'committer', 'login') !== 'web-flow' ||
        nested(commit, 'commit', 'verification', 'verified') !== true
      )
        throw new Error(`Unverified Dependabot commit ${String(commit.sha)}`);
      if (commit.sha === id.head) seenHead = true;
    }
  }
  if (!seenHead) throw new Error('Validated head absent from pull request commits');
  if (nested(livePull(id), 'head', 'sha') !== id.head)
    throw new Error('Head changed during provenance validation');
  console.log(`Revalidated Dependabot head ${id.head}.`);
}

function recheck(): void {
  const id = identity();
  assertPull(livePull(id), id, id.base);
}

function approve(): void {
  requireAutomaticAdmission();
  const id = identity();
  const pages = api(`repos/${id.repository}/pulls/${id.number}/reviews`, true);
  if (!Array.isArray(pages)) throw new Error('Invalid review pagination');
  const alreadyApproved = pages.some((page: unknown) => {
    if (!Array.isArray(page)) throw new Error('Invalid review page');
    return page.some((raw: unknown) => {
      const review = object(raw);
      return (
        nested(review, 'user', 'login') === 'github-actions[bot]' &&
        review.state === 'APPROVED' &&
        review.commit_id === id.head
      );
    });
  });
  if (alreadyApproved) {
    console.log(`Dependabot head ${id.head} is already approved.`);
    return;
  }
  command('gh', [
    'api',
    '--method',
    'POST',
    `repos/${id.repository}/pulls/${id.number}/reviews`,
    '--raw-field',
    `commit_id=${id.head}`,
    '--raw-field',
    'event=APPROVE',
    '--raw-field',
    'body=Approved by the validated Dependabot automation workflow.',
  ]);
  console.log(`Approved eligible Dependabot update at ${id.head}.`);
}

function reason(): string {
  const decoded = Buffer.from(required('REASON_BASE64'), 'base64').toString('utf8');
  if (!reasons.has(decoded)) throw new Error('Invalid validated decision reason');
  return decoded;
}

function merge(): void {
  requireAutomaticAdmission();
  const id = identity();
  command('gh', [
    'pr',
    'merge',
    id.number,
    '--repo',
    id.repository,
    '--match-head-commit',
    id.head,
    '--auto',
    '--squash',
  ]);
  console.log(`Auto-merge queued: ${reason()}`);
}

function main(): void {
  switch (process.argv[2]) {
    case 'gate':
      gate();
      break;
    case 'validate':
      validate();
      break;
    case 'recheck':
      recheck();
      break;
    case 'approve':
      approve();
      break;
    case 'merge':
      merge();
      break;
    case 'manual':
      console.log(`Manual review required\nReason: ${reason()}`);
      break;
    default:
      throw new Error('Expected gate, validate, recheck, approve, merge, or manual');
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
