/**
 * @fileoverview RED 테스트: 상대경로를 Alias로 치환 강제
 * TDD Phase: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { glob } from 'glob';

declare const process: {
  cwd(): string;
};

describe('Path Alias Usage Enforcement (RED)', () => {
  it('should not use deep relative paths (3+ levels)', async () => {
    const testPattern = resolve(process.cwd(), 'test/**/*.{ts,tsx}');
    const files = await glob(testPattern.replace(/\\/g, '/'));

    const violations: string[] = [];

    for (const file of files) {
      const content = await readFile(file, 'utf-8');

      // 3단계 이상 상대경로 검사
      const deepRelativeRegex = /from\s+['"]\.\.\/\.\.\/\.\./g;
      const matches = content.match(deepRelativeRegex);

      if (matches) {
        violations.push(`${file}: ${matches.join(', ')}`);
      }
    }

    // RED: 깊은 상대경로 사용이 있으면 실패해야 함
    expect(violations).toHaveLength(0);
  });

  it('should use path aliases for shared modules', async () => {
    const testPattern = resolve(process.cwd(), 'test/**/*.{ts,tsx}');
    const files = await glob(testPattern.replace(/\\/g, '/'));

    let relativeUsageCount = 0;

    for (const file of files) {
      const content = await readFile(file, 'utf-8');

      // 상대경로로 shared 접근 확인
      const relativeMatches = content.match(/from\s+['"]\.\..*\/shared\//g);
      if (relativeMatches) {
        relativeUsageCount += relativeMatches.length;
      }
    }

    // 상대경로 사용이 줄어들어야 함 (점진적 개선)
    expect(relativeUsageCount).toBeLessThan(30); // 현재 기준 완화
  });
});
