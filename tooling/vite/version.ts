// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Version resolution for build configuration.
 *
 * Priority: BUILD_VERSION env → package.json → fallback.
 * In development mode, appends git commit hash to version string.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../..');

/**
 * Get version from package.json version field.
 *
 * @returns Version string or null if missing/invalid
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
 * Get short git commit hash (7 chars).
 *
 * @returns Commit hash or null if not in a git repo
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
 * Priority:
 * 1. BUILD_VERSION environment variable
 * 2. package.json version field
 * 3. Fallback: "0.0.0" (dev) or "1.0.0" (production)
 *
 * In dev mode, appends git commit hash: "{version}-dev.{commit}"
 *
 * @param isDev - True for development build, false for production
 * @returns Resolved version string
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
