/**
 * Scan test: forbid direct imports of vendor-api.ts in source code
 *
 * Allowlist:
 *  - src/shared/external/vendors/index.ts (barrel)
 *  - src/shared/external/vendors/vendor-api.ts (the file itself)
 *  - Anything under test/** (not scanned here)
 *
 * Rationale:
 *  - All vendor access must go through the safe barrel `@shared/external/vendors`
 *  - Legacy dynamic API in vendor-api.ts must not be referenced from app code
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { resolve, relative, sep } from 'path';

function toPosixPath(p: string): string {
  return p.split(sep).join('/');
}

function listFiles(dir: string, out: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const name of entries) {
    const full = resolve(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Skip common non-source folders just in case
      if (/\b(node_modules|dist|coverage)\b/.test(full)) continue;
      listFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe('lint: vendor-api direct imports are forbidden', () => {
  setupGlobalTestIsolation();

  it('src/** must not import vendor-api.ts directly (use barrel getters)', () => {
    const repoRoot = resolve(process.cwd());
    const srcRoot = resolve(repoRoot, 'src');

    const files = listFiles(srcRoot);
    const violations: { file: string; line: number; snippet: string }[] = [];

    const allowlist = new Set<string>([
      toPosixPath(resolve(srcRoot, 'shared/external/vendors/index.ts')),
      toPosixPath(resolve(srcRoot, 'shared/external/vendors/vendor-api.ts')),
    ]);

    const vendorApiMatchers = [
      /from\s+['"](?:@shared\/external\/vendors\/vendor-api|\.\.\/.*\/vendor-api|\.\/vendor-api)['"];?/,
      /require\(\s*['"](?:@shared\/external\/vendors\/vendor-api|\.\.\/.*\/vendor-api|\.\/vendor-api)['"]\s*\)/,
    ];

    for (const file of files) {
      const filePosix = toPosixPath(file);
      if (allowlist.has(filePosix)) continue; // ignore allowlist

      const rel = toPosixPath(relative(repoRoot, file));
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (vendorApiMatchers.some(re => re.test(line))) {
          violations.push({ file: rel, line: i + 1, snippet: line.trim() });
        }
      }
    }

    if (violations.length > 0) {
      const details = violations.map(v => ` - ${v.file}:${v.line} -> ${v.snippet}`).join('\n');
      throw new Error(
        [
          'Forbidden vendor-api.ts imports found (use @shared/external/vendors barrel getters):',
          details,
        ].join('\n')
      );
    }
  });
});
