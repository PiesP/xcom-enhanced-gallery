/**
 * @fileoverview Version resolution utilities for build configuration.
 *
 * Resolves application version from multiple sources in priority order:
 * BUILD_VERSION environment variable → exact git tag → package.json → nearest git tag.
 * In development mode, appends git commit hash to version string.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { resolve } from 'node:path';
import { REPO_ROOT } from './paths';

/**
 * Get version from exact git tag at HEAD.
 *
 * Parses git tag matching HEAD exactly, removing 'v' prefix if present.
 * Returns null if not on a tag or git command fails.
 *
 * @returns Version string from git tag or null
 * @internal
 */
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

/**
 * Get version from nearest ancestor git tag.
 *
 * Finds most recent tag reachable from HEAD, removing 'v' prefix if present.
 * Returns null if no tags exist or git command fails.
 *
 * @returns Version string from nearest tag or null
 * @internal
 */
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

/**
 * Get version from package.json version field.
 *
 * Reads package.json from repository root and extracts version property.
 * Returns null if file missing, invalid JSON, or version field is not a string.
 *
 * @returns Version string from package.json or null
 * @internal
 */
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

/**
 * Get current git commit hash (short form).
 *
 * Executes `git rev-parse --short HEAD` to retrieve 7-character commit hash.
 * Returns null if git command fails (e.g., not a git repository).
 *
 * @returns Short commit hash or null
 * @internal
 */
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

/**
 * Resolve application version for build output.
 *
 * Version resolution priority:
 * 1. BUILD_VERSION environment variable (if set)
 * 2. Exact git tag at HEAD (e.g., "1.0.0")
 * 3. package.json version field
 * 4. Nearest ancestor git tag
 * 5. Default: "0.0.0" (dev) or "1.0.0" (production)
 *
 * In development mode, appends git commit hash: "{version}-dev.{commit}"
 *
 * @param isDev - True for development build, false for production
 * @returns Resolved version string suitable for userscript header
 */
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
