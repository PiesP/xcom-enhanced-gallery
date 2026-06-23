// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Version resolution utilities for build configuration.
 *
 * Provides functions to resolve the application version from
 * environment variables, package.json, and git commit history.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../..');

/**
 * Get version from package.json version field.
 * @returns Version string or null if missing/invalid
 */
export function getVersionFromPackageJson(): string | null {
  try {
    const pkgPath = resolve(REPO_ROOT, 'package.json');
    const raw = readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    const version = parsed.version;
    return typeof version === 'string' && version.trim() ? version.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Get short git commit hash (7 chars).
 * @returns Commit hash or null if not in a git repo
 */
export function getGitCommitShort(): string | null {
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
 * Priority:
 * 1. BUILD_VERSION environment variable
 * 2. package.json version field
 * 3. Fallback: "0.0.0" (dev) or "1.0.0" (production)
 *
 * In dev mode, appends git commit hash: "{version}-dev.{commit}"
 */
export function resolveVersion(isDev: boolean): string {
  const envVersion = process.env.BUILD_VERSION;
  if (envVersion) return envVersion;

  const pkgVersion = getVersionFromPackageJson();
  const baseVersion = pkgVersion ?? (isDev ? '0.0.0' : '1.0.0');

  if (isDev) {
    const commit = getGitCommitShort() ?? 'unknown';
    return `${baseVersion}-dev.${commit}`;
  }

  return baseVersion;
}
