/**
 * ARCHIVED: Lint Guard - No mediabunny static imports (Deprecated)
 *
 * 목적: mediabunny를 정적으로 import 하지 않음 (현재 미사용).
 * 상태: RED 테스트 (현재 구현 없음, 미래 계획)
 * 이유: 전체 파일시스템 스캔으로 비효율, mediabunny 라이브러리 사용 미정
 *
 * 이동: test/unit/deps/mediabunny.not-imported.scan.red.test.ts
 * 이동일: Phase 180 (2025-10-25)
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

/**
 * 파일 시스템 재귀 순회 (비효율 주의).
 * 대규모 프로젝트에서는 성능 문제 가능성 있음.
 * 필요시 focused scan으로 대체 권장.
 */
function walkSourceTree(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walkSourceTree(fullPath, acc);
    } else if (/\.(ts|tsx|js|jsx|cjs|mjs)$/.test(entry)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

describe.skip('ARCHIVED: Lint Guard - No mediabunny static imports', () => {
  it.skip('src 내 소스 코드에서 mediabunny를 정적으로 import 하지 않는다', () => {
    const sourceFiles = walkSourceTree(join(process.cwd(), 'src'));
    const violations: string[] = [];

    const importRegex = /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      let match: RegExpExecArray | null;

      // Reset regex state
      importRegex.lastIndex = 0;

      while ((match = importRegex.exec(content))) {
        const specifier = match[1] || match[2];
        if (!specifier) continue;

        if (/mediabunny/i.test(specifier)) {
          violations.push(`${file} → ${specifier}`);
        }
      }
    }

    expect(
      violations,
      `Static mediabunny import violations:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
});
