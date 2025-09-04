/**
 * @fileoverview RED 테스트: scroll-coordinator.ts에서 vendor getter 사용 강제
 * TDD Phase: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

declare const process: {
  cwd(): string;
};

describe('ScrollCoordinator Vendor Getter Usage (RED)', () => {
  it('should use vendor getter instead of direct signals import', async () => {
    const scrollCoordinatorPath = resolve(process.cwd(), 'src/shared/scroll/scroll-coordinator.ts');

    const content = await readFile(scrollCoordinatorPath, 'utf-8');

    // RED: 직접 signals import가 있으면 실패해야 함
    expect(content).not.toContain("from '@preact/signals'");
    expect(content).not.toContain('import { signal, computed } from');

    // GREEN: vendor getter 사용을 확인
    expect(content).toContain('getPreactSignalsSafe');
  });

  it('should not have any direct vendor imports in scroll module', async () => {
    const scrollModulePath = resolve(process.cwd(), 'src/shared/scroll');
    const files = ['scroll-coordinator.ts', 'types.ts'];

    for (const file of files) {
      const filePath = resolve(scrollModulePath, file);
      try {
        const content = await readFile(filePath, 'utf-8');

        // 모든 직접 vendor import 금지
        expect(content).not.toMatch(/import.*from\s+['"]@preact\/signals['"]/);
        expect(content).not.toMatch(/import.*from\s+['"]preact['"]/);
        expect(content).not.toMatch(/import.*from\s+['"]fflate['"]/);
      } catch (error) {
        // 파일이 없으면 스킵
        if (error.code !== 'ENOENT') throw error;
      }
    }
  });
});
