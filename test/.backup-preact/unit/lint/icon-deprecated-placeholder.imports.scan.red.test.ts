/**
 * @fileoverview ICON-DEPRECATED-PLACEHOLDER import guard (RED scan)
 * 특정 deprecated 아이콘 배럴 경로(src/shared/components/ui/Icon/icons/index.ts)
 * 를 소스 코드에서 import/require 하는 것을 금지합니다.
 * - 목적: placeholder는 유지하되, 런타임 소비를 방지하여 안전한 삭제/이관 준비
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'fs';
import { resolve, join, sep } from 'path';

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    // skip build/test outputs
    if (/^(dist|node_modules|coverage)$/i.test(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function toPosixPath(p: string): string {
  return p.split(sep).join('/');
}

describe('ICON-DEPRECATED-PLACEHOLDER import guard', () => {
  it('should not import deprecated icons placeholder barrel anywhere in src/**', () => {
    const repo = resolve(process.cwd());
    const srcRoot = resolve(repo, 'src');
    const targetPosix = 'src/shared/components/ui/Icon/icons/index.ts';

    const offenders: string[] = [];
    for (const file of collectFiles(srcRoot)) {
      // Skip the placeholder file itself
      if (toPosixPath(file).endsWith(targetPosix)) continue;
      const code = readFileSync(file, 'utf8');
      // Broad patterns to catch import/require from any relative path ending with Icon/icons/index.ts
      const patterns = [
        /from\s+['"][^'"]*Icon\/icons\/index\.ts['"];?/,
        /import\s*['"][^'"]*Icon\/icons\/index\.ts['"];?/,
        /require\(\s*['"][^'"]*Icon\/icons\/index\.ts['"]\s*\)/,
      ];
      if (patterns.some(re => re.test(code))) {
        offenders.push(toPosixPath(file));
      }
    }

    if (offenders.length > 0) {
      console.error('Found imports of deprecated icons placeholder:', offenders);
    }
    expect(offenders).toEqual([]);
  });
});
