import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ReadApi = (path: string, asset?: boolean) => Promise<unknown>;
type Git = (args: string[]) => string;

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a GitHub release or source metadata object');
  }
  return value as Record<string, unknown>;
}

function version(tag: unknown): bigint[] {
  if (typeof tag !== 'string' || !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error('Expected a canonical stable release tag vX.Y.Z');
  }
  return tag
    .slice(1)
    .split('.')
    .map((part) => BigInt(part));
}

function compare(left: unknown, right: unknown): number {
  const a = version(left);
  const b = version(right);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return (a[index] ?? 0n) > (b[index] ?? 0n) ? 1 : -1;
  }
  return 0;
}

function sourceMetadata(value: unknown, tag: string, sha: string): void {
  const metadata = record(value);
  if (metadata.version !== tag.slice(1) || metadata.commit !== sha) {
    throw new Error('Release metadata does not match the verified tag and source');
  }
}

export async function verifyPublication(
  tag: string,
  sha: string,
  workflowSha: string,
  bundleMetadata: unknown,
  git: Git,
  readApi: ReadApi
): Promise<{ publish: boolean; makeLatest: boolean }> {
  version(tag);
  if (!/^[0-9a-f]{40}$/.test(sha) || !/^[0-9a-f]{40}$/.test(workflowSha)) {
    throw new Error('Release and workflow source must be full commit SHAs');
  }
  if (git(['rev-parse', 'HEAD']) !== workflowSha) {
    throw new Error('Publication guard must run from the protected workflow source');
  }
  git(['fetch', '--force', 'origin', `refs/tags/${tag}:refs/tags/${tag}`]);
  if (git(['rev-parse', '--verify', `${tag}^{commit}`]) !== sha) {
    throw new Error('Release tag identity changed after validation');
  }
  git(['merge-base', '--is-ancestor', sha, workflowSha]);
  const manifest = record(JSON.parse(git(['show', `${sha}:package.json`])));
  if (manifest.version !== tag.slice(1)) throw new Error('Tag and source version differ');
  sourceMetadata(bundleMetadata, tag, sha);

  const published: Record<string, unknown>[] = [];
  for (let page = 1; ; page++) {
    const releases = await readApi(`/releases?per_page=100&page=${page}`);
    if (!Array.isArray(releases)) throw new Error('Release listing is unavailable or malformed');
    for (const item of releases) {
      const release = record(item);
      if (typeof release.draft !== 'boolean' || typeof release.prerelease !== 'boolean') {
        throw new Error('Release state is malformed');
      }
      if (release.draft || release.prerelease) continue;
      version(release.tag_name);
      published.push(release);
    }
    if (releases.length < 100) break;
    if (page === 20) throw new Error('Release history exceeds the bounded publication check');
  }
  const latestValue = await readApi('/releases/latest');
  if (published.length === 0) {
    if (latestValue !== null) throw new Error('First-release state is conflicting');
  } else {
    const latest = record(latestValue);
    version(latest.tag_name);
    if (
      latest.draft !== false ||
      latest.prerelease !== false ||
      !published.some((item) => item.tag_name === latest.tag_name)
    ) {
      throw new Error('Latest release state is conflicting');
    }
    for (const release of published) {
      if (compare(tag, release.tag_name) < 0) throw new Error('Historical publication is refused');
    }
  }

  const targetValue = await readApi(`/releases/tags/${tag}`);
  const existing = published.filter((item) => item.tag_name === tag);
  if (targetValue === null) {
    if (existing.length !== 0) throw new Error('Requested release state changed during validation');
    return { publish: true, makeLatest: true };
  }
  const target = record(targetValue);
  if (
    existing.length !== 1 ||
    target.tag_name !== tag ||
    target.draft !== false ||
    target.prerelease !== false ||
    record(latestValue).tag_name !== tag
  ) {
    throw new Error('Existing draft, archive, or conflicting release requires maintainer review');
  }
  if (!Array.isArray(target.assets)) throw new Error('Existing release assets are unavailable');
  const assets = target.assets.map(record);
  for (const name of [
    'xcom-enhanced-gallery.user.js',
    'xcom-enhanced-gallery.meta.js',
    'xcom-enhanced-gallery-chrome.zip',
    'xcom-enhanced-gallery-firefox.zip',
    'checksums.txt',
    'metadata.json',
  ]) {
    const matches = assets.filter((asset) => asset.name === name);
    if (
      matches.length !== 1 ||
      typeof matches[0]?.size !== 'number' ||
      matches[0].size <= 0 ||
      matches[0].state !== 'uploaded'
    )
      throw new Error('Existing release is incomplete');
  }
  const metadata = assets.find((asset) => asset.name === 'metadata.json');
  if (!Number.isSafeInteger(metadata?.id) || Number(metadata?.id) <= 0) {
    throw new Error('Existing release metadata asset identity is invalid');
  }
  sourceMetadata(await readApi(`/releases/assets/${String(metadata?.id)}`, true), tag, sha);
  // A complete retry preserves the already published bytes and Latest selection.
  return { publish: false, makeLatest: false };
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const token = process.env.GH_TOKEN;
  const output = process.env.GITHUB_OUTPUT;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !token || !output) {
    throw new Error('Repository, read token and publication output are required');
  }
  const result = await verifyPublication(
    process.env.RELEASE_TAG ?? '',
    process.env.RELEASE_SHA ?? '',
    process.env.GITHUB_SHA ?? '',
    JSON.parse(readFileSync('release-bundle/release/metadata.json', 'utf8')),
    (args) =>
      execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(),
    async (path, asset) => {
      const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: asset ? 'application/octet-stream' : 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status === 404) return null;
      if (!response.ok)
        throw new Error(`GitHub publication state request failed: HTTP ${response.status}`);
      return response.json();
    }
  );
  appendFileSync(output, `publish=${result.publish}\nmake-latest=${result.makeLatest}\n`);
}
