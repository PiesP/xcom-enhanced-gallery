/**
 * Scan test: forbid any runtime import of legacy dynamic vendor-manager.ts
 *
 * Scope:
 *  - Scan src/** (tests are excluded)
 *  - Flag any import that references shared/external/vendors/vendor-manager
 *    via alias or relative path
 *  - Allow the file itself (not scanned) and test files (not scanned here)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { resolve, relative, sep } from 'node:path';

function toPosix(p: string) {
  return p.split(sep).join('/');
}

function listFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Skip typical non-source directories
      if (/\b(node_modules|dist|coverage)\b/.test(full)) continue;
      listFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe('lint: legacy vendor-manager runtime imports are forbidden', () => {
  setupGlobalTestIsolation();

  it('src/** must not import vendor-manager.ts (dynamic manager) — use static getters instead', () => {
    const repoRoot = resolve(process.cwd());
    const srcRoot = resolve(repoRoot, 'src');

    const files = listFiles(srcRoot);
    const violations: { file: string; line: number; snippet: string }[] = [];

    // Match common import patterns pointing to vendor-manager (alias or relative)
    const vendorManagerMatchers = [
      /from\s+['"](?:@shared\/external\/vendors\/vendor-manager|@shared\/external\/vendors\/vendor-manager\.ts)['"];?/,
      /from\s+['"](?:\.\.?\/.*\/vendor-manager|\.\.?\/.*\/vendor-manager\.ts)['"];?/,
      /require\(\s*['"](?:@shared\/external\/vendors\/vendor-manager|\.\.?\/.*\/vendor-manager)(?:\.ts)?['"]\s*\)/,
    ];

    for (const file of files) {
      const filePosix = toPosix(file);
      // Only scan runtime sources under src/** — this suite does not scan tests
      const rel = toPosix(relative(repoRoot, file));
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (vendorManagerMatchers.some(re => re.test(line))) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
        }
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => ` - ${v.file}:${v.line} -> ${v.snippet}`).join('\n');
      throw new Error(
        [
          'Forbidden vendor-manager.ts imports found (use @shared/external/vendors static getters):',
          details,
        ].join('\n')
      );
    }
  });
});
