import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ScannerPins = {
  osv: { version: string; image: string };
  semgrep: { version: string; image: string };
};

const coolingHours = 24;
const digest = '[0-9a-f]{64}';
const manifestMediaTypes = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
];

type CheckObservation = {
  id: 'osv_release' | 'osv_digest' | 'semgrep_release';
  status: 'match' | 'different' | 'incomplete';
  source: string;
  pinned: string;
  observed?: string;
  publishedAt?: string;
  observationWindow?: 'eligible' | 'wait';
  pendingRelease?: { version: string; publishedAt: string };
  platformScope?: string;
  reason?: string;
};

class DigestMismatch extends Error {
  readonly observed: string;
  constructor(version: string, pinned: string, observed: string) {
    super(
      `::error title=osv-scanner digest mismatch::Pinned digest ${pinned}; v${version} resolves to ${observed}.`
    );
    this.observed = observed;
  }
}

class NoMatureRelease extends Error {
  readonly pendingRelease: { version: string; publishedAt: string } | undefined;
  constructor(pendingRelease?: { version: string; publishedAt: string }, repository?: string) {
    super(`No stable ${repository} release older than ${coolingHours} hours was found.`);
    this.pendingRelease = pendingRelease;
  }
}

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

function matureRelease(
  repository: string,
  now: number
): {
  version: string;
  publishedAt: string;
  pendingRelease?: { version: string; publishedAt: string };
} {
  const releases = json(
    command('gh', ['api', `repos/${repository}/releases?per_page=100`]),
    repository
  );
  if (!Array.isArray(releases)) throw new Error(`Invalid ${repository} releases response`);
  const cutoff = now - coolingHours * 60 * 60 * 1000;
  let pendingRelease: { version: string; publishedAt: string } | undefined;
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
    if (published <= cutoff)
      return {
        version: release.tag_name.replace(/^v/u, ''),
        publishedAt: release.published_at,
        ...(pendingRelease ? { pendingRelease } : {}),
      };
    pendingRelease ??= {
      version: release.tag_name.replace(/^v/u, ''),
      publishedAt: release.published_at,
    };
  }
  throw new NoMatureRelease(pendingRelease, repository);
}

function checkRelease(
  id: 'osv_release' | 'semgrep_release',
  name: string,
  current: string,
  repository: string,
  now: number,
  emit: boolean
): CheckObservation {
  const expected = matureRelease(repository, now);
  const status = current === expected.version ? 'match' : 'different';
  if (emit) {
    if (status === 'different')
      console.log(
        `::warning title=${name} update available::Pinned ${current}; latest stable release older than ${coolingHours}h is ${expected.version}. Review and update the pin when ready.`
      );
    else console.log(`✓ ${name} ${current} is current after the ${coolingHours}h cooling window.`);
  }
  return {
    id,
    status,
    source: `https://github.com/${repository}/releases`,
    pinned: current,
    observed: expected.version,
    publishedAt: expected.publishedAt,
    observationWindow: expected.pendingRelease ? 'wait' : 'eligible',
    ...(expected.pendingRelease ? { pendingRelease: expected.pendingRelease } : {}),
  };
}

function checkOsvDigest(version: string, image: string, emit: boolean): CheckObservation {
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
    `Accept: ${manifestMediaTypes.join(', ')}`,
    `https://ghcr.io/v2/google/osv-scanner-action/manifests/v${version}`,
  ]);
  const actual = headers
    .split(/\r?\n/u)
    .filter((line) => /^docker-content-digest:/iu.test(line))
    .map((line) => line.slice(line.indexOf(':') + 1).trim());
  const contentTypes = headers
    .split(/\r?\n/u)
    .filter((line) => /^content-type:/iu.test(line))
    .map((line) =>
      line
        .slice(line.indexOf(':') + 1)
        .split(';')[0]
        ?.trim()
        .toLowerCase()
    );
  const expected = image.slice(image.indexOf('@') + 1);
  if (contentTypes.length !== 1 || !manifestMediaTypes.some((type) => type === contentTypes[0]))
    throw new Error('Invalid OSV manifest Content-Type');
  if (actual.length !== 1 || !/^sha256:[0-9a-f]{64}$/u.test(actual[0]!))
    throw new Error(
      `::error title=osv-scanner digest mismatch::Pinned digest ${expected}; v${version} resolves to unknown.`
    );
  if (actual[0] !== expected) throw new DigestMismatch(version, expected, actual[0]!);
  if (emit) console.log(`✓ osv-scanner v${version} runtime digest matches GHCR.`);
  return {
    id: 'osv_digest',
    status: 'match',
    source: `https://ghcr.io/v2/google/osv-scanner-action/manifests/v${version}`,
    pinned: expected,
    observed: actual[0],
    platformScope: 'multiarch-tag',
  };
}

function runChecks(pins: ScannerPins, now: number, emit: boolean): CheckObservation[] {
  const observations: CheckObservation[] = [];
  for (const { id, source, pinned, check } of [
    {
      id: 'osv_release' as const,
      source: 'https://github.com/google/osv-scanner/releases',
      pinned: pins.osv.version,
      check: () =>
        checkRelease(
          'osv_release',
          'osv-scanner',
          pins.osv.version,
          'google/osv-scanner',
          now,
          emit
        ),
    },
    {
      id: 'osv_digest' as const,
      source: `https://ghcr.io/v2/google/osv-scanner-action/manifests/v${pins.osv.version}`,
      pinned: pins.osv.image.slice(pins.osv.image.indexOf('@') + 1),
      check: () => checkOsvDigest(pins.osv.version, pins.osv.image, emit),
    },
    {
      id: 'semgrep_release' as const,
      source: 'https://github.com/semgrep/semgrep/releases',
      pinned: pins.semgrep.version,
      check: () =>
        checkRelease(
          'semgrep_release',
          'semgrep',
          pins.semgrep.version,
          'semgrep/semgrep',
          now,
          emit
        ),
    },
  ]) {
    try {
      observations.push(check());
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (emit) console.error(`check-pinned-tools: ${reason}`);
      observations.push({
        id,
        status: error instanceof DigestMismatch ? 'different' : 'incomplete',
        source,
        pinned,
        ...(id === 'osv_digest' ? { platformScope: 'multiarch-tag' } : {}),
        ...(error instanceof DigestMismatch ? { observed: error.observed } : { reason }),
        ...(error instanceof NoMatureRelease && error.pendingRelease
          ? {
              observationWindow: 'wait' as const,
              pendingRelease: error.pendingRelease,
            }
          : {}),
      });
    }
  }
  return observations;
}

export function checkPins(pins: ScannerPins, now = Date.now()): boolean {
  return !runChecks(pins, now, true).some(
    (item) =>
      item.status === 'incomplete' || (item.id === 'osv_digest' && item.status === 'different')
  );
}

export function observePins(pins: ScannerPins, now = Date.now()): object {
  const checks = runChecks(pins, now, false);
  return {
    schemaVersion: 1,
    observedAt: new Date(now).toISOString(),
    coolingHours,
    pinsSha256: createHash('sha256').update(JSON.stringify(pins)).digest('hex'),
    helperSha256: createHash('sha256')
      .update(readFileSync(fileURLToPath(import.meta.url)))
      .digest('hex'),
    checks,
    semgrepDigest: {
      status: 'not_checked',
      pinned: pins.semgrep.image.slice(pins.semgrep.image.indexOf('@') + 1),
    },
    ok: !checks.some(
      (item) =>
        item.status === 'incomplete' || (item.id === 'osv_digest' && item.status === 'different')
    ),
  };
}

export function main(args: readonly string[], now = Date.now()): number {
  const mode = args[0];
  const structured = mode === 'check' && args[1] === '--json';
  try {
    if ((mode !== 'env' && mode !== 'check') || args.length !== (structured ? 3 : 2))
      throw new Error('Usage: scanner-pins.ts <env|check> [--json] ABSOLUTE_METADATA_PATH');
    if (mode === 'env' && !process.env.GITHUB_ENV) throw new Error('GITHUB_ENV is required');
    if (mode === 'check' && !process.env.GH_TOKEN) throw new Error('GH_TOKEN is required');
    const pins = readPins(args[structured ? 2 : 1]!);
    if (mode === 'env') {
      appendFileSync(
        process.env.GITHUB_ENV!,
        `OSV_SCANNER_IMAGE=${pins.osv.image}\nSEMGREP_IMAGE=${pins.semgrep.image}\n`
      );
      return 0;
    }
    if (structured) {
      const observation = observePins(pins, now) as { ok: boolean };
      console.log(JSON.stringify(observation));
      return observation.ok ? 0 : 1;
    }
    return checkPins(pins, now) ? 0 : 1;
  } catch (error) {
    const prefix = mode === 'check' ? 'check-pinned-tools' : 'pinned-tools';
    const reason = error instanceof Error ? error.message : String(error);
    if (structured)
      console.log(
        JSON.stringify({
          schemaVersion: 1,
          observedAt: new Date(now).toISOString(),
          status: 'incomplete',
          reason,
          checks: [],
          ok: false,
        })
      );
    else console.error(`${prefix}: ${reason}`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2));
