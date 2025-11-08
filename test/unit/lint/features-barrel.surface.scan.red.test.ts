/**
 * Scan test: Harden features barrels public surface (F1)
 *
 * Rule:
 *  - features barrels (e.g., src/features/<feature>/index.ts) must not re-export modules from outside their feature folder
 *    especially from shared layer (../../shared/**) or absolute alias '@shared/**'.
 *  - Allowed: re-exports of sibling files within the same feature package (relative './', './subdir')
 *
 * Rationale:
 *  - Keep public API minimal; avoid making shared services available via features barrels.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { resolve, relative, sep } from 'path';

function toPosix(p: string): string {
  return p.split(sep).join('/');
}

function listFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (/\b(node_modules|dist|coverage)\b/.test(full)) continue;
      listFiles(full, out);
    } else if (/index\.ts$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe('lint: features barrel surface hardening (F1)', () => {
  setupGlobalTestIsolation();

  it('features /**/index.ts must not re-export from shared or outside feature folder', () => {
    const repoRoot = resolve(process.cwd());
    const featuresRoot = resolve(repoRoot, 'src/features');

    const files = listFiles(featuresRoot);
    const violations: { file: string; line: number; snippet: string }[] = [];

    const forbiddenRe = /export\s+\{[^}]*\}\s+from\s+['"](?:@shared\/|\.\.\/\.\.\/)\S+['"];?/;
    const stripComments = (code: string): string =>
      code
        // strip block comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // strip line comments
        .replace(/\/\/.*$/gm, '');

    for (const file of files) {
      const rel = toPosix(relative(repoRoot, file));
      const raw = readFileSync(file, 'utf8');
      const content = stripComments(raw);
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (forbiddenRe.test(line)) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
        }
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => ` - ${v.file}:${v.line} -> ${v.snippet}`).join('\n');
      throw new Error(
        [
          'Features barrels must not re-export from @shared or ../../shared (public surface minimalism):',
          details,
        ].join('\n')
      );
    }
  });
});
