/**
 * P4: SERVICE_KEYS direct usage reduction
 * - Forbid importing or referencing SERVICE_KEYS outside of approved modules.
 * Approved: constants.ts, shared/container/service-accessors.ts, shared/services/service-initialization.ts,
 *           shared/services/service-diagnostics.ts, shared/container/service-bridge.ts (indirect, not referencing keys),
 *           (runtime createAppContainer implementation removed; test harness only)
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

describe('P4: SERVICE_KEYS direct usage scan', () => {
  it('Only approved modules may reference SERVICE_KEYS', () => {
    const SRC = join(process.cwd(), 'src');
    expect(statSync(SRC).isDirectory()).toBe(true);

    const APPROVED = new Set(
      [
        'src/constants.ts',
        'src/shared/container/service-accessors.ts',
        'src/shared/services/service-initialization.ts',
        'src/shared/services/service-diagnostics.ts',
        // runtime createAppContainer removed — keep allowlist minimal
      ].map(p => p.replace(/\\/g, '/'))
    );

    const offenders: { file: string; line: string }[] = [];
    for (const f of listFilesRecursive(SRC)) {
      if (!/\.(ts|tsx)$/.test(f)) continue;
      const rel = relative(process.cwd(), f).replace(/\\/g, '/');
      const text = readFileSync(f, 'utf8');
      if (!/SERVICE_KEYS/.test(text)) continue;

      if (APPROVED.has(rel)) continue;

      const firstLine =
        text
          .split(/\r?\n/)
          .find(l => l.includes('SERVICE_KEYS'))
          ?.trim() ?? '';
      offenders.push({ file: rel, line: firstLine });
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        `Direct usage of SERVICE_KEYS is forbidden outside approved modules. Offenders:\n${details}`
      );
    }
  });
});
