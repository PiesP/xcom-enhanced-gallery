#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const stableTag = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
const commitSha = /^[0-9a-f]{40}$/;
const exactNodeVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/;

function matchesExactly(pattern: RegExp, value: string): boolean {
  return pattern.exec(value)?.[0] === value;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function taggedNodeVersion(sha: string, releaseVersion: string): string {
  const manifest = JSON.parse(git(['show', `${sha}:package.json`])) as unknown;
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Invalid release source manifest');
  }
  const scripts = (manifest as { scripts?: unknown }).scripts;
  if (
    !scripts ||
    typeof scripts !== 'object' ||
    Array.isArray(scripts) ||
    Object.values(scripts).some((value) => typeof value !== 'string')
  ) {
    throw new Error('Invalid release source scripts');
  }
  if (Object.hasOwn(scripts, 'quality:nose')) {
    throw new Error('Release source still declares retired quality:nose script');
  }
  const scriptMap = scripts as Record<string, string>;
  const requiredReleaseScripts = [
    'quality:coverage-owned',
    'test:cov',
    'build:e2e',
    'test:e2e:all',
    'build:all:ci',
    'release:prepare',
  ];
  const missingScripts = requiredReleaseScripts.filter((name) => !scriptMap[name]?.trim());
  if (missingScripts.length > 0) {
    throw new Error(
      `Release source lacks current workflow entrypoints: ${missingScripts.join(', ')}`
    );
  }
  const nodeVersionEntry = git(['ls-tree', sha, '--', '.node-version']);
  const volta = (manifest as { volta?: unknown }).volta;
  let version: string;
  if (nodeVersionEntry) {
    if (!/^100644 blob [0-9a-f]{40}\t\.node-version$/.test(nodeVersionEntry)) {
      throw new Error('Release source .node-version must be a regular file');
    }
    if (volta !== undefined) {
      throw new Error('Release source declares competing Node runtime pins');
    }
    const pin = execFileSync('git', ['show', `${sha}:.node-version`], { encoding: 'utf8' });
    if (!/^[0-9]+\.[0-9]+\.[0-9]+\n?$/.test(pin)) {
      throw new Error('Release source must declare an exact .node-version pin');
    }
    version = pin.trimEnd();
  } else {
    // Older tagged sources selected Node through Volta; the protected workflow passes this pin
    // into the reviewed Vite+ provider's numeric compatibility override.
    const historicalVersion =
      volta && typeof volta === 'object' && !Array.isArray(volta)
        ? (volta as { node?: unknown }).node
        : undefined;
    if (
      typeof historicalVersion !== 'string' ||
      !matchesExactly(exactNodeVersion, historicalVersion)
    ) {
      throw new Error('Historical release source must declare an exact volta.node pin');
    }
    version = historicalVersion;
  }
  const sourceVersion = (manifest as { version?: unknown }).version;
  if (sourceVersion !== releaseVersion) {
    throw new Error(
      `Tag version ${releaseVersion} does not match package.json ${String(sourceVersion)}`
    );
  }
  return version;
}

export function verifySource(): void {
  const tag = required('RELEASE_TAG');
  if (!matchesExactly(stableTag, tag)) {
    throw new Error(`Invalid release tag: ${tag} (expected vX.Y.Z)`);
  }
  const protectedSha = required('GITHUB_SHA');
  if (!matchesExactly(commitSha, protectedSha)) {
    throw new Error('Invalid protected workflow SHA');
  }
  const output = required('GITHUB_OUTPUT');

  git(['fetch', '--force', 'origin', `refs/tags/${tag}:refs/tags/${tag}`]);
  const releaseSha = git(['rev-parse', '--verify', `${tag}^{commit}`]);
  if (!matchesExactly(commitSha, releaseSha)) {
    throw new Error('Invalid resolved release commit');
  }
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

if (import.meta.main) {
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
