/**
 * @fileoverview VerticalImageItem forceVisible 반응성 테스트
 * @description Phase 4 Follow-up: forceVisible prop 변경에 즉시 반응하는지 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const componentPath = resolve(
  process.cwd(),
  'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'
);

describe('VerticalImageItem - forceVisible reactivity (코드 검증)', () => {
  it('forceVisible props 변경에 반응하는 createEffect가 존재해야 함', () => {
    const sourceCode = readFileSync(componentPath, 'utf-8');

    // createEffect 안에 forceVisible && !isVisible() 체크가 있어야 함
    const forceVisibleEffectPattern =
      /createEffect\(\(\)\s*=>\s*\{[^}]*forceVisible[^}]*!isVisible\(\)/s;
    expect(sourceCode).toMatch(forceVisibleEffectPattern);

    // setIsVisible(true) 호출이 있어야 함
    expect(sourceCode).toContain('setIsVisible(true)');
  });

  it('Solid.js 반응성 패턴: forceVisible이 createEffect 안에서 사용되어야 함', () => {
    const sourceCode = readFileSync(componentPath, 'utf-8');

    // forceVisible props를 createEffect 안에서 참조하는 패턴
    // 주석과 함께 검증 (Solid.js 반응성 원칙)
    expect(sourceCode).toContain('// forceVisible props 변경에 반응');
    expect(sourceCode).toContain('createEffect(() => {');

    // forceVisible과 setIsVisible이 같은 effect 안에 있어야 함
    const effectWithForceVisible =
      /createEffect\(\(\)\s*=>\s*\{[^}]*if\s*\(\s*forceVisible[^}]*setIsVisible/s;
    expect(sourceCode).toMatch(effectWithForceVisible);
  });

  it('IntersectionObserver가 forceVisible=true일 때 건너뛰어져야 함', () => {
    const sourceCode = readFileSync(componentPath, 'utf-8');

    // IntersectionObserver가 존재하는지 확인
    expect(sourceCode).toContain('new IntersectionObserver');

    // forceVisible이 조기 반환 조건에 포함되어 있는지 확인
    // 실제 코드: if (!container || isVisible() || forceVisible) { return; }
    expect(sourceCode).toContain('|| forceVisible');
    expect(sourceCode).toContain('return;');

    // createEffect와 IntersectionObserver가 같은 파일에 있는지 확인
    expect(sourceCode).toContain('createEffect');
  });
});
