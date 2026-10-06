import { execFileSync } from 'node:child_process';

import { isCliEntry, readPins } from './pinned-tools.ts';

const coolingHours = 24;

function command(file: string, args: string[]): string {
  try {
    return execFileSync(file, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? error.status : undefined;
    // curl's Authorization argv contains a short-lived GHCR token. Do not
    // stringify an ExecFileError or its command line into the workflow log.
    throw new Error(
      `${file} request failed${typeof status === 'number' ? ` (exit ${status})` : ''}`
    );
  }
}

function json(text: string, label: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Invalid ${label} JSON response`);
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Invalid ${label} response`);
  return value as Record<string, unknown>;
}

function matureRelease(repository: string, now: number): string {
  const releases = json(
    command('gh', ['api', `repos/${repository}/releases?per_page=100`]),
    repository
  );
  if (!Array.isArray(releases)) throw new Error(`Invalid ${repository} releases response`);
  const cutoff = now - coolingHours * 60 * 60 * 1000;
  for (const item of releases) {
    const release = object(item, `${repository} release`);
    if (typeof release.draft !== 'boolean' || typeof release.prerelease !== 'boolean')
      throw new Error(`Invalid ${repository} release flags`);
    if (release.draft || release.prerelease) continue;
    if (
      typeof release.tag_name !== 'string' ||
      !/^v?\d+\.\d+\.\d+$/u.test(release.tag_name) ||
      typeof release.published_at !== 'string'
    )
      throw new Error(`Invalid ${repository} stable release`);
    const published = Date.parse(release.published_at);
    if (!Number.isFinite(published)) throw new Error(`Invalid ${repository} publish time`);
    if (published <= cutoff) return release.tag_name.replace(/^v/u, '');
  }
  throw new Error(`No stable ${repository} release older than ${coolingHours} hours was found.`);
}

function checkRelease(name: string, current: string, repository: string, now: number): void {
  const expected = matureRelease(repository, now);
  if (current !== expected) {
    console.log(
      `::warning title=${name} update available::Pinned ${current}; latest stable release older than ${coolingHours}h is ${expected}. Review and update the pin when ready.`
    );
  } else {
    console.log(`✓ ${name} ${current} is current after the ${coolingHours}h cooling window.`);
  }
}

function checkInstallerDigest(version: string, expected: string): void {
  const release = object(
    json(command('gh', ['api', `repos/corca-ai/nose/releases/tags/v${version}`]), 'Nose release'),
    'Nose release'
  );
  if (!Array.isArray(release.assets)) throw new Error('Invalid Nose release assets');
  const assets = release.assets.map((asset) => object(asset, 'Nose asset'));
  const matches = assets.filter((asset) => asset.name === 'nose-cli-installer.sh');
  const actual = matches.length === 1 ? matches[0]?.digest : undefined;
  if (actual !== `sha256:${expected}`)
    throw new Error(
      `::error title=nose-installer digest mismatch::Pinned digest ${expected}; v${version} asset resolves to ${typeof actual === 'string' ? actual : 'unknown'}.`
    );
  console.log(`✓ nose-installer v${version} installer digest matches the pinned SHA-256.`);
}

function checkOsvDigest(version: string, image: string): void {
  const token = object(
    json(
      command('curl', [
        '--fail',
        '--silent',
        '--show-error',
        'https://ghcr.io/token?scope=repository:google/osv-scanner-action:pull',
      ]),
      'GHCR token'
    ),
    'GHCR token'
  ).token;
  if (typeof token !== 'string' || !token) throw new Error('Invalid GHCR token response');
  const headers = command('curl', [
    '--fail',
    '--silent',
    '--show-error',
    '--dump-header',
    '-',
    '--output',
    '/dev/null',
    '--header',
    `Authorization: Bearer ${token}`,
    '--header',
    'Accept: application/vnd.docker.distribution.manifest.v2+json',
    `https://ghcr.io/v2/google/osv-scanner-action/manifests/v${version}`,
  ]);
  const actual = headers
    .split(/\r?\n/u)
    .filter((line) => /^docker-content-digest:/iu.test(line))
    .map((line) => line.slice(line.indexOf(':') + 1).trim());
  const expected = image.slice(image.indexOf('@') + 1);
  if (actual.length !== 1 || actual[0] !== expected)
    throw new Error(
      `::error title=osv-scanner digest mismatch::Pinned digest ${expected}; v${version} resolves to ${actual[0] ?? 'unknown'}.`
    );
  console.log(`✓ osv-scanner v${version} runtime digest matches GHCR.`);
}

export function main(args: readonly string[], now = Date.now()): number {
  try {
    if (args.length !== 0) throw new Error('check-pinned-tools takes no arguments');
    if (!process.env.GH_TOKEN) throw new Error('GH_TOKEN is required');
    const pins = readPins();
    let failed = false;
    for (const check of [
      () => checkRelease('nose', pins.nose.version, 'corca-ai/nose', now),
      () => checkInstallerDigest(pins.nose.version, pins.nose.installerSha256),
      () => checkRelease('osv-scanner', pins.osv.version, 'google/osv-scanner', now),
      () => checkOsvDigest(pins.osv.version, pins.osv.image),
      () => checkRelease('semgrep', pins.semgrep.version, 'semgrep/semgrep', now),
    ]) {
      try {
        check();
      } catch (error) {
        console.error(
          `check-pinned-tools: ${error instanceof Error ? error.message : String(error)}`
        );
        failed = true;
      }
    }
    return failed ? 1 : 0;
  } catch (error) {
    console.error(`check-pinned-tools: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (isCliEntry(import.meta.url)) process.exitCode = main(process.argv.slice(2));
