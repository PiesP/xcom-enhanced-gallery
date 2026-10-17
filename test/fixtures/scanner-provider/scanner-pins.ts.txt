import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';

export type ScannerPins = {
  osv: { version: string; image: string };
  semgrep: { version: string; image: string };
};

const coolingHours = 24;
const digest = '[0-9a-f]{64}';

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Invalid ${label} response`);
  return value as Record<string, unknown>;
}

function pinnedString(value: unknown, label: string, pattern: RegExp): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error(`Invalid pinned ${label}`);
  return value;
}

export function readPins(path: string): ScannerPins {
  if (!isAbsolute(path)) throw new Error('Pinned tool metadata path must be absolute');
  const root = object(JSON.parse(readFileSync(path, 'utf8')) as unknown, 'pinned tool metadata');
  const osv = object(root.osv, 'pinned tool metadata');
  const semgrep = object(root.semgrep, 'pinned tool metadata');
  const version = /^\d+\.\d+\.\d+$/u;
  const osvVersion = pinnedString(osv.version, 'OSV version', version);
  const semgrepVersion = pinnedString(semgrep.version, 'Semgrep version', version);
  return {
    osv: {
      version: osvVersion,
      image: pinnedString(
        osv.image,
        'OSV image',
        new RegExp(`^ghcr\\.io/google/osv-scanner-action@sha256:${digest}$`, 'u')
      ),
    },
    semgrep: {
      version: semgrepVersion,
      image: pinnedString(
        semgrep.image,
        'Semgrep image',
        new RegExp(
          `^semgrep/semgrep:${semgrepVersion.replaceAll('.', '\\.')}@sha256:${digest}$`,
          'u'
        )
      ),
    },
  };
}

function command(file: string, args: string[]): string {
  try {
    return execFileSync(file, args, {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? error.status : undefined;
    // curl's Authorization argv contains a short-lived GHCR token. Never
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

export function checkPins(pins: ScannerPins, now = Date.now()): boolean {
  let failed = false;
  for (const check of [
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
  return !failed;
}

export function main(args: readonly string[], now = Date.now()): number {
  const mode = args[0];
  try {
    if (args.length !== 2 || (mode !== 'env' && mode !== 'check'))
      throw new Error('Usage: scanner-pins.ts <env|check> ABSOLUTE_METADATA_PATH');
    if (mode === 'env' && !process.env.GITHUB_ENV) throw new Error('GITHUB_ENV is required');
    if (mode === 'check' && !process.env.GH_TOKEN) throw new Error('GH_TOKEN is required');
    const pins = readPins(args[1]!);
    if (mode === 'env') {
      appendFileSync(
        process.env.GITHUB_ENV!,
        `OSV_SCANNER_IMAGE=${pins.osv.image}\nSEMGREP_IMAGE=${pins.semgrep.image}\n`
      );
      return 0;
    }
    return checkPins(pins, now) ? 0 : 1;
  } catch (error) {
    const prefix = mode === 'check' ? 'check-pinned-tools' : 'pinned-tools';
    console.error(`${prefix}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2));
