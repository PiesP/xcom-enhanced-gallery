import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { resolve } from 'node:path';
import { REPO_ROOT } from './paths';

function getVersionFromGit(): string | null {
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

  const gitVersion = getVersionFromGit();
  const pkgVersion = getVersionFromPackageJson();
  const baseVersion = gitVersion ?? pkgVersion ?? (isDev ? '0.0.0' : '1.0.0');

  if (isDev) {
    const commit = getGitCommitShort() ?? 'unknown';
    return `${baseVersion}-dev.${commit}`;
  }

  return baseVersion;
}
