/**
 * P3: AppContainer scope redefinition
 * - Forbid importing AppContainer/createAppContainer in runtime code except allowlisted files
 * - Allow type-only imports (e.g., import type { ISettingsService } from './AppContainer')
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...listFilesRecursive(p));
    else files.push(p);
  }
  return files;
}

describe('P3: AppContainer import scope (runtime ban)', () => {
  it('Runtime code must not import AppContainer/createAppContainer (type-only/import in allowlist is OK)', () => {
    const ROOT = join(process.cwd(), 'src');
    expect(statSync(ROOT).isDirectory()).toBe(true);

    // Allowlist is intentionally empty: type-only imports are allowed globally
    // and no runtime files should import AppContainer/createAppContainer.
    const ALLOWLIST_PATHS = new Set<string>();

    const offenders: { file: string; line: string }[] = [];
    for (const f of listFilesRecursive(ROOT)) {
      if (!/\.(ts|tsx)$/.test(f)) continue;
      const rel = relative(process.cwd(), f).replace(/\\/g, '/');
      const text = readFileSync(f, 'utf8');

      // Skip allowlisted files entirely
      if (ALLOWLIST_PATHS.has(rel)) continue;

      // Look for imports of AppContainer or createAppContainer
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const hasAppContainer = /\bimport\s+(type\s+)?\{[^}]*\bAppContainer\b[^}]*\}\s+from/.test(
          line
        );
        const hasCreateApp = /\bimport\s+\{[^}]*\bcreateAppContainer\b[^}]*\}\s+from/.test(line);
        if (!hasAppContainer && !hasCreateApp) continue;

        // Allow type-only imports (import type { AppContainer } from ...)
        const isTypeOnly = /^\s*import\s+type\b/.test(line);
        if (isTypeOnly) continue;

        offenders.push({ file: rel, line: line.trim() });
      }
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        `Runtime import of AppContainer/createAppContainer is forbidden. Offenders:\n${details}`
      );
    }
  });
});
