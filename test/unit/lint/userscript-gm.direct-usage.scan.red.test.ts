/**
 * Guard: Forbid direct GM_* usage outside official userscript adapter/types
 * - Allowed only in:
 *   - src/shared/external/userscript/adapter.ts
 *   - src/shared/types/core/userscript.d.ts
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function stripCommentsAndStrings(src: string): string {
  // crude stripper to reduce false positives from comments/strings
  // remove /* */ comments
  let text = src.replace(/\/\*[\s\S]*?\*\//g, '');
  // remove // comments
  text = text.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '$1');
  // remove string literals ('...', "...", `...`)
  text = text.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '');
  return text;
}

describe('Guard: direct GM_* usage is forbidden (adapter-only)', () => {
  it('Runtime code must not reference GM_* outside adapter/types', () => {
    const ROOT = join(process.cwd(), 'src');
    expect(statSync(ROOT).isDirectory()).toBe(true);

    const ALLOWLIST = new Set<string>([
      'src/shared/external/userscript/adapter.ts',
      'src/shared/types/core/userscript.d.ts',
    ]);

    const offenders: { file: string; line: string }[] = [];

    for (const file of listFilesRecursive(ROOT)) {
      if (!/\.(ts|tsx|d\.ts)$/.test(file)) continue;
      const rel = relative(process.cwd(), file).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;

      const raw = readFileSync(file, 'utf8');
      const text = stripCommentsAndStrings(raw);
      const lines = text.split(/\r?\n/);

      for (const line of lines) {
        if (/\bGM_[A-Za-z0-9_]+/.test(line)) {
          offenders.push({ file: rel, line: line.trim() });
          break; // one hit per file is enough
        }
      }
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        `Direct GM_* usage is forbidden outside userscript adapter/types. Offenders:\n${details}`
      );
    }
  });
});
