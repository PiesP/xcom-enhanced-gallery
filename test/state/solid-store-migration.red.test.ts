/**
 * @fileoverview RED test enforcing Solid store migration across shared state/services.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cwd } from 'node:process';

const TARGET_DIRECTORIES = [
  'src/shared/state',
  'src/shared/services',
  'src/shared/utils',
  'src/shared/components/ui/Toast',
];

function collectTypeScriptFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    results.push(fullPath);
  }

  return results;
}

describe('Solid store migration (RED)', () => {
  it('removes getPreactSignals usage from shared state/services', () => {
    const projectRoot = cwd();
    const offenders: string[] = [];

    for (const relativeDir of TARGET_DIRECTORIES) {
      const absoluteDir = resolve(projectRoot, relativeDir);

      try {
        statSync(absoluteDir);
      } catch {
        continue;
      }

      const files = collectTypeScriptFiles(absoluteDir);
      for (const file of files) {
        const contents = readFileSync(file, 'utf8');
        if (contents.includes('getPreactSignals')) {
          offenders.push(file.replace(projectRoot, ''));
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
