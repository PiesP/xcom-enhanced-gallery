import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { resolve } from 'node:path';
import { REPO_ROOT } from './paths';

function getVersionFromExactGitTag(): string | null {
  try {
    const stdout = execSync('git describe --tags --exact-match', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return stdout.startsWith('v') ? stdout.slice(1) : stdout;
  } catch {
    return null;
  }
}

function getVersionFromNearestGitTag(): string | null {
  try {
    const stdout = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return stdout.startsWith('v') ? stdout.slice(1) : stdout;
  } catch {
    return null;
  }
}

function getVersionFromPackageJson(): string | null {
  try {
    const pkgPath = resolve(REPO_ROOT, 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    const version = parsed.version;
    return typeof version === 'string' && version.trim() ? version.trim() : null;
  } catch {
    return null;
  }
}

function getGitCommitShort(): string | null {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

export function resolveVersion(isDev: boolean): string {
  const envVersion = process.env.BUILD_VERSION;
  if (envVersion) return envVersion;

  const pkgVersion = getVersionFromPackageJson();
  const exactTagVersion = getVersionFromExactGitTag();
  const nearestTagVersion = getVersionFromNearestGitTag();

  // Important: When working on release-prep commits, the nearest tag is still the
  // previous release. Prefer the package.json version unless HEAD is exactly on a tag.
  const baseVersion =
    exactTagVersion ?? pkgVersion ?? nearestTagVersion ?? (isDev ? '0.0.0' : '1.0.0');

  if (isDev) {
    const commit = getGitCommitShort() ?? 'unknown';
    return `${baseVersion}-dev.${commit}`;
  }

  return baseVersion;
}
