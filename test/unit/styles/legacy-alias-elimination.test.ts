/**
 * Policy: Eliminate legacy token aliases from src/features/**
 * - Allowed: canonical semantic tokens (e.g., --xeg-color-*, --color-*)
 * - Disallowed (legacy aliases): --xeg-text-button, --xeg-text-button-navigation, --xeg-shadow-toolbar,
 *   --xeg-neutral-100/200/300/400
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const FEATURES_DIR = join(process.cwd(), 'src', 'features');

const LEGACY_TOKENS = [
  '--xeg-text-button',
  '--xeg-text-button-navigation',
  '--xeg-shadow-toolbar',
  '--xeg-neutral-100',
  '--xeg-neutral-200',
  '--xeg-neutral-300',
  '--xeg-neutral-400',
];

function collectCssFiles(dir: string, out: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectCssFiles(full, out);
    } else if (st.isFile() && extname(full) === '.css') {
      out.push(full);
    }
  }
  return out;
}

describe('Legacy token alias elimination policy (src/features/**)', () => {
  it('should not include legacy alias tokens in any CSS under src/features/**', () => {
    const files = collectCssFiles(FEATURES_DIR);
    const violations: Array<{ file: string; token: string; line: number }> = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        for (const token of LEGACY_TOKENS) {
          if (line.includes(token)) {
            violations.push({ file, token, line: idx + 1 });
          }
        }
      });
    }

    if (violations.length) {
      const msg = violations
        .map(v => `${v.file}:${v.line} contains legacy token ${v.token}`)
        .join('\n');
      expect.fail(`Found legacy alias tokens in features CSS:\n${msg}`);
    }

    expect(violations.length).toBe(0);
  });
});
