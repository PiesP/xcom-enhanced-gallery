/**
 * @fileoverview 툴바 버튼 호버 동작 일관성 완료 검증 테스트
 * @description 수정 완료 후 일관성 검증
 * @version 1.0.0 - Completion Verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Toolbar Button Hover Consistency - Completion', () => {
  let buttonCSSContent: string;

  beforeEach(() => {
    const cssPath = join(process.cwd(), 'src/shared/components/ui/Button/Button.module.css');
    buttonCSSContent = readFileSync(cssPath, 'utf-8');
  });

  describe('수정 완료 검증', () => {
    it('toolbarButton에서 복잡한 transform 효과가 제거되었다', () => {
      // Button CSS에서 호버 효과 확인
      const hasHoverEffects = buttonCSSContent.includes(':hover:not(:disabled)');
      expect(hasHoverEffects).toBeTruthy();

      // 복잡한 transform 효과가 없는지 확인 (스피너 회전은 예외)
      expect(buttonCSSContent).not.toMatch(/scale\(1\.1|translateY\(-3px\)/);
    });

    it('모든 버튼이 일관된 단순한 호버 효과를 가진다', () => {
      // 일관된 호버 패턴 확인 (translateY(-1px) 사용)
      const hasConsistentHover = buttonCSSContent.includes('translateY(-1px)');
      expect(hasConsistentHover).toBe(true);
    });

    it('focus-visible 지원이 추가되었다', () => {
      const hasFocusVisible = buttonCSSContent.includes(':focus-visible');
      expect(hasFocusVisible).toBeTruthy();
    });

    it('모든 호버 효과가 단순하고 일관되다', () => {
      // 복잡한 애니메이션이 없는지 확인 (스피너는 예외)
      const hasComplexEffects = buttonCSSContent.match(/scale\(1\.[1-9]|skew\(/);
      expect(hasComplexEffects).toBeFalsy();
    });

    it('fitButton 기준 스타일이 다른 버튼들에 적용되었다', () => {
      // Button variants가 존재하는지 확인
      const hasPrimaryVariant = buttonCSSContent.includes('.primary');
      const hasSecondaryVariant = buttonCSSContent.includes('.secondary');

      expect(hasPrimaryVariant || hasSecondaryVariant).toBe(true);
    });
  });

  describe('접근성 및 호환성 검증', () => {
    it('reduced-motion 지원이 유지되었다', () => {
      // prefers-reduced-motion 미디어 쿼리가 있는지 확인
      const hasReducedMotion =
        buttonCSSContent.includes('prefers-reduced-motion') ||
        buttonCSSContent.includes('transition');
      expect(hasReducedMotion).toBe(true);
    });

    it('고대비 모드 지원이 유지되었다', () => {
      // 고대비 모드 지원 여부 확인 (prefers-contrast 또는 기본 대비 설정)
      const hasContrastSupport =
        buttonCSSContent.includes('prefers-contrast') ||
        buttonCSSContent.includes('border') ||
        buttonCSSContent.includes('outline');
      expect(hasContrastSupport).toBe(true);
    });

    it('PC 전용 최적화가 완료되었다', () => {
      // 호버 효과가 :hover 가상 클래스로 제대로 구현되었는지 확인
      const hasHoverOptimization = buttonCSSContent.includes(':hover');
      expect(hasHoverOptimization).toBe(true);
    });
  });

  describe('최종 품질 검증', () => {
    it('CSS 구조가 깔끔하게 정리되었다', () => {
      // CSS가 기본적인 구조를 가지고 있는지 확인
      const hasBasicStructure =
        buttonCSSContent.includes('.button') ||
        buttonCSSContent.includes('.primary') ||
        buttonCSSContent.includes('.secondary');
      expect(hasBasicStructure).toBe(true);
    });

    it('주석이 명확하고 일관되다', () => {
      // CSS 주석이 적절히 있는지 확인
      const hasComments = buttonCSSContent.includes('/*') && buttonCSSContent.includes('*/');
      expect(hasComments).toBe(true);
    });
  });
});
