/**
 * Guard: Forbid direct timer usage (setTimeout/Interval/clear*) outside TimerManager/perf utils
 * Policy: Runtime src/** must not call global timers directly. Allowed files:
 *  - src/shared/utils/timer-management.ts (manager implementation)
 *  - src/shared/utils/performance/performance-utils.ts (Debouncer internals)
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

// Lightweight per-line stripper: remove line comments and basic block comments markers
function preprocessLines(src: string): string[] {
  // Fast path: avoid expensive global regex over entire file
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
        // skip until handled in next iterations/lines
        continue;
      }
      if (s[i] === '/' && s[i + 1] === '/') {
        break; // strip rest of line comments
      }
      // strip string literals ('...",`...`)
      if (s[i] === '"' || s[i] === "'" || s[i] === '`') {
        const quote = s[i];
        i++;
        while (i < s.length) {
          if (s[i] === '\\') {
            i += 2; // skip escaped char
            continue;
          }
          if (s[i] === quote) {
            break;
          }
          i++;
        }
        continue; // do not copy quote contents
      }
      out += s[i];
    }
    return out;
  });
}

describe('Guard: direct timer usage is forbidden (TimerManager only)', () => {
  it('src/** should not use setTimeout/Interval/clear* directly', () => {
    const ROOT = join(process.cwd(), 'src');
    expect(statSync(ROOT).isDirectory()).toBe(true);

    const ALLOWLIST = new Set<string>([
      'src/shared/utils/timer-management.ts',
      'src/shared/utils/performance/performance-utils.ts',
      // type declarations may reference names
      'src/shared/types/core/userscript.d.ts',
    ]);

    const offenders: { file: string; line: string }[] = [];
    // Match bare setTimeout/Interval/clear* not preceded by a dot/word, AND window.* variants explicitly
    const RE_BARE = /(^|[^.\w])(setTimeout|setInterval|clearTimeout|clearInterval)\s*\(/;
    const RE_WINDOW = /\bwindow\.(setTimeout|setInterval|clearTimeout|clearInterval)\s*\(/;

    for (const file of listFilesRecursive(ROOT)) {
      if (!/\.(ts|tsx|d\.ts)$/.test(file)) continue;
      const rel = relative(process.cwd(), file).replace(/\\/g, '/');
      if (ALLOWLIST.has(rel)) continue;

      const raw = readFileSync(file, 'utf8');
      const lines = preprocessLines(raw);
      for (const line of lines) {
        const trimmed = line.trim();
        // Allow usages through the centralized manager
        if (trimmed.includes('globalTimerManager.')) continue;
        if (RE_BARE.test(trimmed) || RE_WINDOW.test(trimmed)) {
          offenders.push({ file: rel, line: trimmed });
          break;
        }
      }
    }

    if (offenders.length > 0) {
      const details = offenders.map(o => `- ${o.file}: ${o.line}`).join('\n');
      throw new Error(
        `Direct timer usage detected. Use globalTimerManager/TimerManager instead. Offenders:\n${details}`
      );
    }
  });
});
