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

function preprocessLines(src: string): string[] {
  // Efficient comment stripping per line; preserves code shape for token scanning
  const lines = src.split(/\r?\n/);
  let inBlock = false;
  return lines.map(line => {
    let s = line;
    if (inBlock) {
      const end = s.indexOf('*/');
      if (end >= 0) {
        s = s.slice(end + 2);
        inBlock = false;
      } else {
        return '';
      }
    }
    let out = '';
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '/' && s[i + 1] === '*') {
        inBlock = true;
        i++;
        continue;
      }
      if (s[i] === '/' && s[i + 1] === '/') {
        break;
      }
      // strip string literals
      if (s[i] === '"' || s[i] === "'" || s[i] === '`') {
        const quote = s[i];
        i++;
        while (i < s.length) {
          if (s[i] === '\\') {
            i += 2;
            continue;
          }
          if (s[i] === quote) break;
          i++;
        }
        continue;
      }
      out += s[i];
    }
    return out;
  });
}

describe('Guard: direct GM_* usage is forbidden (adapter-only)', () => {
  it('Runtime code must not reference GM_* outside adapter/types', () => {
    const ROOT = join(process.cwd(), 'src');
    expect(statSync(ROOT).isDirectory()).toBe(true);

    const ALLOWLIST = new Set<string>([
      'src/shared/external/userscript/adapter.ts',
      'src/shared/types/core/userscript.d.ts',
      // logger may probe environment via bracket access without calling GM_*
      'src/shared/logging/logger.ts',
    ]);

    const offenders: { file: string; line: string }[] = [];

    for (const file of listFilesRecursive(ROOT)) {
      if (!/\.(ts|tsx|d\.ts)$/.test(file)) continue;
      const rel = relative(process.cwd(), file).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;

      const raw = readFileSync(file, 'utf8');
      const lines = preprocessLines(raw);

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
