/**
 * @fileoverview TDD Phase: RED - useToolbar 중복 구현 제거 검증
 * 목표:
 * 1) 코드베이스에 useToolbar 함수 정의는 단 하나여야 한다 (features는 재export만 허용)
 * 2) features 경로의 use-toolbar는 shared 훅을 그대로 재export해야 한다 (동일 참조)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'c:/git/xcom-enhanced-gallery';

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('TDD: useToolbar 중복 제거', () => {
  it('🔴 RED: 코드 내 useToolbar 함수 정의는 단 하나여야 한다', () => {
    const filesToCheck = [
      join(ROOT, 'src/shared/hooks/useToolbar.ts'),
      join(ROOT, 'src/features/gallery/hooks/use-toolbar.ts'),
    ];

    const definitionRegex = /export\s+function\s+useToolbar\s*\(/g;
    const definitionCounts = filesToCheck.map(f =>
      existsSync(f) ? read(f).match(definitionRegex)?.length || 0 : 0
    );
    const totalDefinitions = definitionCounts.reduce((a, b) => a + b, 0);

    // 기대: shared에만 정의 1회, features는 0회(재export)
    // 현재 상태에서는 2회일 수 있음 → 실패(Red)
    expect({ filesToCheck, definitionCounts, totalDefinitions }).toMatchObject({
      totalDefinitions: 1,
    });
  });

  it('🔴 RED: features/hooks/use-toolbar 는 파일 수준에서 shared/hooks/useToolbar 를 재export해야 한다', () => {
    const filePath = join(ROOT, 'src/features/gallery/hooks/use-toolbar.ts');
    const content = read(filePath);
    expect(content).toMatch(
      /export\s*\{\s*useToolbar\s*\}\s*from\s*['"]@shared\/hooks\/useToolbar['"];?/
    );
  });

  it('🔴 RED: 데드 코드 사용 금지 - use-simple-toolbar.ts 에 함수 정의가 없어야 한다(없거나 재export 스텁)', () => {
    const deadFile = join(ROOT, 'src/features/gallery/hooks/use-simple-toolbar.ts');
    if (!existsSync(deadFile)) {
      expect(true).toBe(true);
      return;
    }
    const content = read(deadFile);
    // 함수 정의가 없어야 함
    expect(/export\s+function\s+useToolbar\s*\(/.test(content)).toBe(false);
    // 재export 스텁을 허용
    expect(/export\s*\{\s*useToolbar\s*\}/.test(content)).toBe(true);
  });
});
