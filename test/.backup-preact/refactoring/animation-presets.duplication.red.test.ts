/**
 * @file Phase 2 RED: AnimationService transition 중복 패턴 감지
 * 목표: 동일 transition 선언(속성+duration+easing)이 2회 이상 반복되면 실패.
 * 이후 GREEN 단계에서 preset 토큰(var(--xeg-transition-preset-*)))으로 치환하여 중복 제거.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('Phase 2 (RED) — animation transition preset 추출', () => {
  it('AnimationService 내부 style 템플릿에 중복 transition 패턴이 없어야 한다 (preset 미사용)', () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    // test/refactoring/... → project root: ../../..
    const filePath = resolve(testDir, '../..', 'src', 'shared', 'services', 'AnimationService.ts');
    const content = readFileSync(filePath, 'utf-8');

    // style.textContent = ` ... ` 블록만 추출
    const styleBlockMatch = content.match(/style\.textContent\s*=\s*`([\s\S]*?)`/);
    expect(styleBlockMatch).toBeTruthy();
    const css = styleBlockMatch ? styleBlockMatch[1] : '';

    // preset 전(legacy) transition 선언: var(--xeg-transition-preset-*) 미포함 + transition: none 제외
    const transitionDecls = (css.match(/transition:[^;]+;/g) || []).filter(
      d => !/transition:\s*none/.test(d)
    );

    // 중복 패턴 그룹화 (preset 미사용만 대상)
    const legacy = transitionDecls.filter(d => !/var\(--xeg-transition-preset-/.test(d));
    const counts = legacy.reduce<Record<string, number>>((acc, decl) => {
      const norm = decl.replace(/\s+/g, ' ').trim();
      acc[norm] = (acc[norm] || 0) + 1;
      return acc;
    }, {});
    const duplicates = Object.entries(counts).filter(([, c]) => c > 1);

    // 현재 코드 상태에서는 fade-in / fade-out 2회 중복이 존재 → RED
    // 목표: GREEN 단계에서 해당 중복 0개
    expect(
      duplicates,
      `중복 transition 패턴이 preset으로 치환되어야 합니다: ${JSON.stringify(duplicates)}`
    ).toHaveLength(0);
  });
});
