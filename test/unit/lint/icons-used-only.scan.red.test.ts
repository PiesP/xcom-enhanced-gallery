/**
 * @fileoverview I2 — ICONS-TRIM-USED-ONLY guard
 * Export된 아이콘(alias)이 실제 코드에서 사용되지 않으면 RED가 됩니다.
 * - 기준 파일: src/shared/components/ui/Icon/index.ts
 * - 사용 탐지: \b(h\()?<IconName>\b (JSX/h 호출), import 별칭 사용
 * - 주석은 제거 후 검사(오탐 방지)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

function readFileSafe(file: string): string {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function stripComments(code: string): string {
  // Remove block and line comments
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
    .trim();
}

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const result: string[] = [];
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      // skip build/test outputs
      if (/^(dist|node_modules|coverage)$/i.test(name)) continue;
      result.push(...collectFiles(full));
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(name)) {
      result.push(full);
    }
  }
  return result;
}

describe('I2 — icons exported are used somewhere', () => {
  it('should not export unused icons from Icon barrel', () => {
    const repoRoot = resolve(process.cwd());
    const iconIndexPath = resolve(repoRoot, 'src/shared/components/ui/Icon/index.ts');
    const iconIndexRaw = readFileSafe(iconIndexPath);
    expect(iconIndexRaw).toBeTruthy();

    const iconIndex = stripComments(iconIndexRaw);

    // Capture alias names from lines like: export { HeroX as X } from '...';
    const exportAliasRe =
      /export\s+\{[^}]*?\bas\s+([A-Za-z_][A-Za-z0-9_]*)[^}]*?}\s+from\s+['"][^'"]+['"];?/g;
    const exportedNames = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = exportAliasRe.exec(iconIndex))) {
      const name = m[1];
      if (name) exportedNames.add(name);
    }

    // Also include direct named exports of components if any appear as `export { Name } from` (no alias)
    const exportDirectRe = /export\s+\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}\s+from\s+['"][^'"]+['"];?/g;
    while ((m = exportDirectRe.exec(iconIndex))) {
      const name = m[1];
      if (name && name !== 'Icon' && name !== 'IconProps') exportedNames.add(name);
    }

    // Sanity
    expect(exportedNames.size).toBeGreaterThan(0);

    // Gather all source files
    const srcRoot = resolve(repoRoot, 'src');
    const files = collectFiles(srcRoot);

    // Read and strip comments for each file, then check usage patterns
    const unused: string[] = [];
    outer: for (const name of exportedNames) {
      const patterns = [
        new RegExp(`\\b${name}\\b`), // generic token (covers import usage and h(Name,...)
        new RegExp(`<${name}\\b`), // JSX usage
        new RegExp(`h\\s*\\(\\s*${name}\\b`), // h(Name,
      ];
      for (const file of files) {
        const code = stripComments(readFileSafe(file));
        if (!code) continue;
        if (patterns.some(re => re.test(code))) {
          continue outer;
        }
      }
      unused.push(name);
    }

    // Allowlist: Some exports may be planned but not yet wired — add here if needed
    const allowlist = new Set<string>([]);
    const trulyUnused = unused.filter(n => !allowlist.has(n));

    // Expect no unused icons exported
    if (trulyUnused.length > 0) {
      console.error('Unused icon exports detected:', trulyUnused.join(', '));
    }
    expect(trulyUnused).toEqual([]);
  });
});
