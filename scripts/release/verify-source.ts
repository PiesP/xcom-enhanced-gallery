#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const stableTag = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
const commitSha = /^[0-9a-f]{40}$/;
const exactNodeVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/;

function matchesExactly(pattern: RegExp, value: string): boolean {
  return pattern.exec(value)?.[0] === value;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function taggedNodeVersion(sha: string, releaseVersion: string): string {
  const manifest = JSON.parse(git(['show', `${sha}:package.json`])) as unknown;
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    throw new Error('Invalid release source manifest');
  const volta = (manifest as { volta?: unknown }).volta;
  const version =
    volta && typeof volta === 'object' && !Array.isArray(volta)
      ? (volta as { node?: unknown }).node
      : undefined;
  if (typeof version !== 'string' || !matchesExactly(exactNodeVersion, version))
    throw new Error('Release source must declare an exact volta.node pin');
  const sourceVersion = (manifest as { version?: unknown }).version;
  if (sourceVersion !== releaseVersion)
    throw new Error(
      `Tag version ${releaseVersion} does not match package.json ${String(sourceVersion)}`
    );
  return version;
}

export function verifySource(): void {
  const tag = required('RELEASE_TAG');
  if (!matchesExactly(stableTag, tag))
    throw new Error(`Invalid release tag: ${tag} (expected vX.Y.Z)`);
  const protectedSha = required('GITHUB_SHA');
  if (!matchesExactly(commitSha, protectedSha)) throw new Error('Invalid protected workflow SHA');
  const output = required('GITHUB_OUTPUT');

  git(['fetch', '--force', 'origin', `refs/tags/${tag}:refs/tags/${tag}`]);
  const releaseSha = git(['rev-parse', '--verify', `${tag}^{commit}`]);
  if (!matchesExactly(commitSha, releaseSha)) throw new Error('Invalid resolved release commit');
  try {
    git(['merge-base', '--is-ancestor', releaseSha, protectedSha]);
  } catch {
    throw new Error(`Release tag ${tag} is not contained in protected master ${protectedSha}`);
  }

  const nodeVersion = taggedNodeVersion(releaseSha, tag.slice(1));
  appendFileSync(
    output,
    `node-version=${nodeVersion}\nrelease-sha=${releaseSha}\nversion=${tag.slice(1)}\n`
  );
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
    verifySource();
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
