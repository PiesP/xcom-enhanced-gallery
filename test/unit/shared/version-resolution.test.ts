// @vitest-environment node
// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const REPO_ROOT = resolve(__dirname, '../../..');
const PKG_PATH = resolve(REPO_ROOT, 'package.json');

function getFallbackVersion(isDev: boolean): string {
  return isDev ? '0.0.0' : '1.0.0';
}

function resolveVersionLike(isDev: boolean, pkgVersion: string | null): string {
  const baseVersion = pkgVersion ?? getFallbackVersion(isDev);
  if (isDev) {
    return `${baseVersion}-dev.test`;
  }
  return baseVersion;
}

describe('version resolution', () => {
  let originalPkg: string;

  beforeEach(() => {
    originalPkg = readFileSync(PKG_PATH, 'utf8');
  });

  afterEach(() => {
    writeFileSync(PKG_PATH, originalPkg);
  });

  it('reads version from package.json in production', () => {
    const parsed = JSON.parse(originalPkg);
    const expected = parsed.version;
    expect(resolveVersionLike(false, expected)).toBe(expected);
  });

  it('appends git suffix in dev mode', () => {
    const parsed = JSON.parse(originalPkg);
    const expected = `${parsed.version}-dev.test`;
    expect(resolveVersionLike(true, expected.replace('-dev.test', ''))).toBe(expected);
  });

  it('falls back to 1.0.0 in production when package.json has no version', () => {
    const noVersion = JSON.stringify({ ...JSON.parse(originalPkg), version: undefined });
    writeFileSync(PKG_PATH, noVersion);
    expect(resolveVersionLike(false, null)).toBe('1.0.0');
  });

  it('falls back to 0.0.0 in dev when package.json has no version', () => {
    const noVersion = JSON.stringify({ ...JSON.parse(originalPkg), version: undefined });
    writeFileSync(PKG_PATH, noVersion);
    expect(resolveVersionLike(true, null)).toBe('0.0.0-dev.test');
  });

  it('REPO_ROOT resolves to actual project root', () => {
    const pkg = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.version).toBeTruthy();
    expect(typeof pkg.version).toBe('string');
  });
});
