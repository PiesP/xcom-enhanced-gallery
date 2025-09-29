/**
 * @fileoverview Guard test ensuring package.json no longer declares Preact dependencies.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json');
const PREACT_PACKAGE_PATTERN = /^(?:@preact\/.*|preact)$/;

function readPackageJson(): Record<string, unknown> {
  const raw = readFileSync(PACKAGE_JSON_PATH, 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

describe('package preact dependency scan', () => {
  it('does not list any Preact packages in dependencies/devDependencies', () => {
    const pkgJson = readPackageJson();
    const dependencies = Object.keys((pkgJson.dependencies as Record<string, unknown>) ?? {});
    const devDependencies = Object.keys((pkgJson.devDependencies as Record<string, unknown>) ?? {});

    const offendingPackages = [...dependencies, ...devDependencies].filter(dependencyName =>
      PREACT_PACKAGE_PATTERN.test(dependencyName)
    );

    const errorMessage = offendingPackages.map(name => `- ${name}`).join('\n');

    expect(
      offendingPackages.length,
      `preact packages detected in package.json:\n${errorMessage}`
    ).toBe(0);
  });
});
