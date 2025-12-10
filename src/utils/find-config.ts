// Simple Deno-forward fallback implementation; tests run the Node-based
// version under `test/src/utils/find-config.ts` which performs real file
// existence checks and upward directory traversal. This fallback ensures
// a compile-safe symbol exists for environments where `Deno` is available.

/**
 * findConfig - Search upwards along the directory tree to find a config file.
 *
 * This helper is used by test utilities to resolve configuration files when
 * running tests from nested CWDs (e.g., `test/test`, coverage runner, etc.).
 *
 * Search strategy:
 * - For each directory from base upward to the filesystem root:
 *    - Check <current>/<relative>
 *    - Check <current>/test/<relative>
 * - Return the first matching path.
 * - If none found, return path.resolve(base, relative).
 */
import fs from 'node:fs';
import path from 'node:path';

export function findConfig(relative: string, base = process.cwd()): string {
  let current = path.resolve(base);
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
  return path.resolve(base, relative);
}

export default findConfig;
