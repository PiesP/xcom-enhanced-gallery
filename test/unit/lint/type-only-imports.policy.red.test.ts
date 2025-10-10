/**
 * P14: Type-only import exception policy (hardening)
 * - Goal: Make sure VNode/ComponentChildren are imported with the type qualifier
 *   when sourced from the vendors barrel ("@/shared/external/vendors" or relative variants).
 * - Allowed patterns:
 *   - import type { VNode } from '.../external/vendors';
 *   - import { getSolid, type VNode } from '.../external/vendors';
 * - Forbidden pattern (examples):
 *   - import { VNode } from '.../external/vendors';
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

describe('P14: type-only import policy (vendors types)', () => {
  it('VNode/ComponentChildren must use type-qualified imports from vendors barrel', () => {
    const ROOT = join(process.cwd(), 'src');
    expect(statSync(ROOT).isDirectory()).toBe(true);

    const offenders: { file: string; line: string }[] = [];
    const VENDOR_BARREL_RE = /external\/vendors(?:\/index\.ts)?$/;

    for (const f of listFilesRecursive(ROOT)) {
      const rel = relative(process.cwd(), f).replace(/\\/g, '/');
      const text = readFileSync(f, 'utf8');
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        // Consider only import statements that reference the vendors barrel
        if (!/^\s*import\s+.*from\s+['"][^'"]+['"]\s*;?\s*$/.test(line)) continue;
        const m = line.match(/from\s+['"]([^'"]+)['"]/);
        if (!m) continue;
        const fromPath = m[1];
        if (!/external\/vendors/.test(fromPath)) continue;

        // If VNode or ComponentChildren are imported, they must be type-qualified
        const importsVNode = /\b\{[^}]*\bVNode\b[^}]*\}/.test(line);
        const importsChildren = /\b\{[^}]*\bComponentChildren\b[^}]*\}/.test(line);
        if (!importsVNode && !importsChildren) continue;

        // Allowed: `import type { ... }` or `{ ..., type VNode }` in the specifier
        const isAllTypeOnly = /^\s*import\s+type\b/.test(line);
        const hasTypeQualifier =
          /\{[^}]*\btype\s+VNode\b[^}]*\}/.test(line) ||
          /\{[^}]*\btype\s+ComponentChildren\b[^}]*\}/.test(line);

        if (!isAllTypeOnly && !hasTypeQualifier) {
          offenders.push({ file: rel, line: line.trim() });
        }
      }
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        `VNode/ComponentChildren must be imported with 'type' from vendors barrel. Offenders:\n${details}`
      );
    }
  });
});
