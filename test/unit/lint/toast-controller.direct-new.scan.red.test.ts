/**
 * Guard: Forbid direct `new ToastController()` usage outside allowed service files.
 * Allowed only in:
 *  - src/shared/services/ToastController.ts (definition/default instance)
 *  - src/shared/services/service-initialization.ts (container registration)
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
  // Strip comments and string literals per line to avoid false positives
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
      // strip string/template literals
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

describe('Guard: direct `new ToastController()` is forbidden (container-only)', () => {
  it('Runtime code must not instantiate ToastController directly outside allowed files', () => {
    const ROOT = join(process.cwd(), 'src');
    expect(statSync(ROOT).isDirectory()).toBe(true);

    const ALLOWLIST = new Set<string>([
      'src/shared/services/ToastController.ts',
      'src/shared/services/service-initialization.ts',
    ]);

    const offenders: { file: string; line: string }[] = [];

    for (const file of listFilesRecursive(ROOT)) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      const rel = relative(process.cwd(), file).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;

      const raw = readFileSync(file, 'utf8');
      const lines = preprocessLines(raw);

      for (const line of lines) {
        if (/\bnew\s+ToastController\s*\(/.test(line)) {
          offenders.push({ file: rel, line: line.trim() });
          break; // one hit per file is sufficient
        }
      }
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        'Direct `new ToastController()` is forbidden. Use container accessor (`getToastController`) instead. Offenders:\n' +
          details
      );
    }
  });
});
