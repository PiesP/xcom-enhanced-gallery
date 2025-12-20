/**
 * Node-only config discovery utilities.
 *
 * This module uses Node built-ins (node:fs, node:path) and must never be
 * imported by browser/runtime code.
 */

import fs from 'node:fs';
import path from 'node:path';

// Node-only resolver for current working directory.
function getDefaultBase(): string {
  return process.cwd();
}

/**
 * Search upwards along the directory tree to find a config file.
 *
 * Search strategy:
 * - For each directory from base upward to the filesystem root:
 *   - Check <current>/<relative>
 *   - Check <current>/test/<relative>
 * - Return the first matching path.
 * - If none found, return path.resolve(base, relative).
 */
export function findConfigFilePath(relative: string, base?: string): string {
  const effectiveBase = base ?? getDefaultBase();
  let current = path.resolve(effectiveBase);
  const root = path.parse(current).root;

  while (true) {
    const candidates = [path.resolve(current, relative), path.resolve(current, 'test', relative)];

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return p;
      } catch {
        // ignore and continue up the tree
      }
    }

    if (current === root) break;
    current = path.resolve(current, '..');
  }

  return path.resolve(effectiveBase, relative);
}

export function findFirstConfigFilePath(candidates: readonly string[], base?: string): string {
  for (const name of candidates) {
    const p = findConfigFilePath(name, base);
    if (fs.existsSync(p)) return p;
  }

  const first = candidates[0];
  if (!first) {
    throw new Error('findFirstConfigFilePath requires at least one candidate');
  }

  return findConfigFilePath(first, base);
}
