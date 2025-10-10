import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guard: Forbid raw px spacing in TS/TSX source.
// Scope: src/** (ts|tsx)
// Allowed: specific utility files that generate CSS strings for animations.
// Rationale: Spacing must use CSS tokens and classes, not inline styles or raw px in TS/TSX.

// Resolve repo root from this test file URL: test/unit/styles -> repo
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
const ROOT = join(__dirname_local, '..', '..', '..', 'src');

function listFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) listFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe('Spacing scale guard (TSX inline styles only)', () => {
  it('should not use px values in inline style props within TSX components', () => {
    const files = listFiles(ROOT).filter(f => /\.(tsx)$/.test(f));

    const violations: Array<{ file: string; line: number; snippet: string }> = [];

    // Heuristics: only lines that look like inline style usage
    const STYLE_LINE = /(\bstyle\s*=|\bstyle\s*:\s*\{|\bstyle\s*:\s*\()/;
    const PX_RE = /\b\d+(?:\.\d+)?px\b/; // e.g., 4px, 0.5px

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (!content.includes('style')) continue;
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (STYLE_LINE.test(line) && PX_RE.test(line)) {
          violations.push({ file, line: idx + 1, snippet: line.trim() });
        }
      });
    }

    const formatted = violations.map(v => `- ${v.file}:${v.line} -> ${v.snippet}`).join('\n');

    const help = [
      'Found px in inline style props. Move spacing to CSS Modules and use design tokens (var(--xeg-space-*)).',
    ].join('\n');

    expect({ count: violations.length, details: formatted, help }).toEqual({
      count: 0,
      details: '',
      help,
    });
  });
});
