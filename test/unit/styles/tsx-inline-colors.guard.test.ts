import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guard: Forbid raw color literals in TSX inline style props.
// Scope: src/**/*.tsx
// Allowed: CSS variable tokens (var(--xeg-*/--color-*)), and specific system keywords.
// Rationale: Colors must use design tokens; inline styles should not hardcode colors.

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
const ROOT = join(__dirname_local, '..', '..', '..', 'src');

function listFiles(dir: string, acc: string[] = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) listFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe('TSX inline style color guard', () => {
  it('should not contain raw color literals in inline style props', () => {
    const files = listFiles(ROOT).filter(f => /\.tsx$/.test(f));

    const violations: { file: string; line: number; snippet: string }[] = [];

    // Heuristics
    const STYLE_HINT = /\bstyle\s*=|\bstyle\s*:\s*\{/; // inline style presence on a line
    const COLOR_PROPS =
      /(\bcolor\b|\bbackgroundColor\b|\bbackground\b|\bborder(Color|TopColor|RightColor|BottomColor|LeftColor)\b|\boutlineColor\b|\bfill\b|\bstroke\b|\bcaretColor\b)/;
    // Color literal patterns similar to CSS guard
    const COLOR_LITERAL =
      /#(?:[0-9a-fA-F]{3,8})\b|\b(?:rgb|rgba|hsl|hsla|oklch|color-mix)\s*\(|\b(?:white|black)\b/;
    const ALLOWED_KEYWORDS = /\b(?:transparent|currentColor|Canvas|CanvasText|HighlightText)\b/i;
    const TOKEN_VAR = /var\s*\(\s*--(?:(?:xeg|color)-[a-z0-9-]+)\s*\)/i;

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (!content.includes('style')) continue;
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (!(STYLE_HINT.test(line) && COLOR_PROPS.test(line))) return;
        // extract quoted string segments on the line (single/double/backtick)
        const matches = line.match(/(['"`])([^'"`]*?)\1/g) || [];
        for (const quoted of matches) {
          const val = quoted.slice(1, -1).trim();
          if (!val) continue;
          if (TOKEN_VAR.test(val) || ALLOWED_KEYWORDS.test(val)) continue;
          if (COLOR_LITERAL.test(val)) {
            violations.push({ file, line: idx + 1, snippet: line.trim() });
            break; // one per line is enough
          }
        }
      });
    }

    const formatted = violations.map(v => `- ${v.file}:${v.line} -> ${v.snippet}`).join('\n');
    const help = [
      'Found raw color literal in inline style props. Use CSS Modules with design tokens (var(--xeg-*)/var(--color-*)).',
      'Allowed inline values: var(--xeg-*/--color-*), transparent, currentColor, Canvas, CanvasText, HighlightText.',
    ].join('\n');

    expect({ count: violations.length, details: formatted, help }).toEqual({
      count: 0,
      details: '',
      help,
    });
  });
});
