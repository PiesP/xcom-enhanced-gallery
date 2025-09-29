/**
 * @fileoverview RED test guarding the removal of package-level Preact dependencies.
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

describe('package preact dependency scan (RED)', () => {
  it('fails while Preact packages remain in dependencies/devDependencies', () => {
    const pkgJson = readPackageJson();
    const dependencies = Object.keys((pkgJson.dependencies as Record<string, unknown>) ?? {});
    const devDependencies = Object.keys((pkgJson.devDependencies as Record<string, unknown>) ?? {});

    const offendingPackages = [...dependencies, ...devDependencies].filter(dependencyName =>
      PREACT_PACKAGE_PATTERN.test(dependencyName)
    );

    expect(offendingPackages).toEqual([]);
  });
});
