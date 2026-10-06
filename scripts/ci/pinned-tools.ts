import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type PinnedTools = {
  nose: { version: string; installerSha256: string };
  osv: { version: string; image: string };
  semgrep: { version: string; image: string };
};

const digest = '[0-9a-f]{64}';

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Pinned tool metadata must contain objects');
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string, pattern: RegExp): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error(`Invalid pinned ${label}`);
  return value;
}

export function readPins(
  path = fileURLToPath(new URL('./pinned-tools.json', import.meta.url))
): PinnedTools {
  const root = record(JSON.parse(readFileSync(path, 'utf8')) as unknown);
  const nose = record(root.nose);
  const osv = record(root.osv);
  const semgrep = record(root.semgrep);
  const version = /^\d+\.\d+\.\d+$/u;
  const noseVersion = string(nose.version, 'Nose version', version);
  const osvVersion = string(osv.version, 'OSV version', version);
  const semgrepVersion = string(semgrep.version, 'Semgrep version', version);
  return {
    nose: {
      version: noseVersion,
      installerSha256: string(
        nose.installerSha256,
        'Nose installer SHA-256',
        new RegExp(`^${digest}$`, 'u')
      ),
    },
    osv: {
      version: osvVersion,
      image: string(
        osv.image,
        'OSV image',
        new RegExp(`^ghcr\\.io/google/osv-scanner-action@sha256:${digest}$`, 'u')
      ),
    },
    semgrep: {
      version: semgrepVersion,
      image: string(
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

export function isCliEntry(metaUrl: string): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(metaUrl);
  } catch {
    return false;
  }
}
