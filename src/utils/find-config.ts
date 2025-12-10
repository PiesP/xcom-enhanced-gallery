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

// Cross-environment resolver for current working directory. Prefer the
// explicit `base` argument when provided, otherwise fall back to the
// environment-appropriate CWD: Node `process.cwd()` or Deno `Deno.cwd()`.
function getDefaultBase(): string {
  // Node's process environment (when present) exposes cwd()
  if (typeof process !== 'undefined') {
    const p = process as unknown as { cwd?: () => string };
    if (typeof p.cwd === 'function') return p.cwd();
  }
  // Deno environment via Deno.cwd()
  if (typeof Deno !== 'undefined') {
    const d = Deno as unknown as { cwd?: () => string };
    if (typeof d.cwd === 'function') return d.cwd();
  }
  return '.';
}

export function findConfig(relative: string, base?: string): string {
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

export default findConfig;
