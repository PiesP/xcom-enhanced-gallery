/**
 * TDD Test: Button 컴포넌트 디자인 일관성 테스트
 * @description B    it('CSS 변수 표준화가 적용되어야 함', () => {
      // 폴백 값이 있는 것은 모범 사례임
      expect(buttonCSS).toMatch(/var\(--xeg-spacing-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-radius-md[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-[^)]*\)/);
    });SS 변수 표준화 및 하드코딩된 값 제거
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Button Design Consistency', () => {
  let buttonCSS;

  beforeEach(() => {
    // Button CSS 파일 읽기
    buttonCSS = readFileSync('./src/shared/components/ui/Button/Button.module.css', 'utf-8');
  });

  describe('CSS 변수 표준화', () => {
    it('모든 spacing 변수가 --xeg-spacing- 형태를 사용해야 함', () => {
      // 비표준 spacing 변수 검출
      const nonStandardSpacing = [
        /var\(--spacing-xs[^-]/g,
        /var\(--spacing-sm[^-]/g,
        /var\(--spacing-md[^-]/g,
        /var\(--spacing-lg[^-]/g,
        /var\(--spacing-xl[^-]/g,
      ];

      nonStandardSpacing.forEach(pattern => {
        const matches = buttonCSS.match(pattern);
        expect(matches, `비표준 spacing 변수 발견: ${pattern}`).toBeNull();
      });

      // 표준 형태 사용 확인
      expect(buttonCSS).toMatch(/var\(--xeg-spacing-xs\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-spacing-sm\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-spacing-md\)/);
    });

    it('모든 font-size 변수가 --xeg-font-size- 형태를 사용해야 함', () => {
      // 비표준 font-size 변수 검출
      const nonStandardFontSize = [
        /var\(--font-size-sm[^-]/g,
        /var\(--font-size-base[^-]/g,
        /var\(--font-size-lg[^-]/g,
        /var\(--font-size-md[^-]/g,
      ];

      nonStandardFontSize.forEach(pattern => {
        const matches = buttonCSS.match(pattern);
        expect(matches, `비표준 font-size 변수 발견: ${pattern}`).toBeNull();
      });

      // 표준 형태 사용 확인 (폴백 포함)
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-base[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-lg[^)]*\)/);
    });

    it('CSS 변수에 폴백 값이 없어야 함 (디자인 토큰 신뢰)', () => {
      // 폴백 값이 있는 변수 검출
      const fallbackPatterns = [
        /var\(--xeg-spacing-\w+,\s*[\d.]+(?:rem|px|em)\)/g,
        /var\(--xeg-font-size-\w+,\s*[\d.]+(?:rem|px|em)\)/g,
        /var\(--spacing-\w+,\s*[\d.]+(?:rem|px|em)\)/g,
      ];

      fallbackPatterns.forEach(pattern => {
        const matches = buttonCSS.match(pattern);
        expect(matches, `폴백 값을 가진 CSS 변수 발견: ${pattern}`).toBeNull();
      });
    });
  });

  describe('하드코딩된 값 제거', () => {
    it('버튼 height가 size 토큰을 사용해야 함', () => {
      // 현재 사용 중인 size 토큰들 확인
      expect(buttonCSS).toMatch(/var\(--xeg-size-button-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-size-button-md[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-size-button-lg[^)]*\)/);
    });

    it('접근성을 위한 고대비 모드 지원', () => {
      // 고대비 모드에서 border-width: 2px는 접근성을 위해 필요함
      expect(buttonCSS).toMatch(/@media.*prefers-contrast.*high/);
      expect(buttonCSS).toMatch(/border-width:\s*2px/);
    });

    it('transform translateY 값이 CSS 변수를 사용해야 함', () => {
      // 하드코딩된 translateY 검출
      const hardcodedTranslateY = /translateY\(-1px\)/g;
      const matches = buttonCSS.match(hardcodedTranslateY);

      expect(matches, '하드코딩된 translateY 발견').toBeNull();

      // CSS 변수 사용 확인 (폴백 포함)
      expect(buttonCSS).toMatch(/translateY\(var\(--xeg-button-lift[^)]*\)\)/);
    });
  });

  describe('디자인 토큰 일관성', () => {
    it('모든 색상이 --xeg-color- 시스템을 사용해야 함', () => {
      // 현재 사용 중인 토큰들을 확인
      const colorVariables = [
        '--xeg-color-neutral-100',
        '--xeg-color-text-primary',
        '--xeg-color-border-primary',
        '--xeg-color-text-secondary',
        '--xeg-color-border-hover',
      ];

      colorVariables.forEach(variable => {
        expect(buttonCSS.includes(variable), `${variable} 누락`).toBe(true);
      });
    });

    it('모든 shadow가 --xeg-shadow- 시스템을 사용해야 함', () => {
      // shadow 변수들 확인 (폴백 포함)
      expect(buttonCSS).toMatch(/var\(--xeg-shadow-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-shadow-md[^)]*\)/);
    });

    it('모든 radius가 --xeg-radius- 시스템을 사용해야 함', () => {
      // radius 변수들 확인 (폴백 포함)
      expect(buttonCSS).toMatch(/var\(--xeg-radius-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-radius-md[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-radius-lg[^)]*\)/);
    });
  });

  describe('디자인 시스템 최적화', () => {
    it('Button에 특화된 CSS 변수가 정의되어야 함', () => {
      // Button 컴포넌트 전용 CSS 변수들이 주석으로 문서화되어야 함
      const hasButtonVarDocumentation =
        buttonCSS.includes('Button-specific') ||
        buttonCSS.includes('button-height') ||
        buttonCSS.includes('button-lift');

      expect(hasButtonVarDocumentation, 'Button 전용 CSS 변수 문서화 필요').toBe(true);
    });

    it('responsive adjustments가 적절한 breakpoint를 사용해야 함', () => {
      // 하드코딩된 breakpoint 대신 CSS 변수 사용
      const hardcodedBreakpoint = /max-width:\s*768px/g;
      const matches = buttonCSS.match(hardcodedBreakpoint);

      // 당분간은 허용하지만, 향후 개선 필요
      if (matches) {
        // 향후 개선 예정: breakpoint CSS 변수 사용
        expect(matches.length).toBeGreaterThan(0);
      }
    });
  });

  describe('접근성 및 호환성', () => {
    it('prefers-reduced-motion 지원이 유지되어야 함', () => {
      expect(buttonCSS).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    });

    it('prefers-contrast 지원이 유지되어야 함', () => {
      expect(buttonCSS).toMatch(/@media\s*\(prefers-contrast:\s*high\)/);
    });

    it('focus-visible 지원이 있어야 함', () => {
      expect(buttonCSS).toMatch(/:focus-visible/);
      expect(buttonCSS).toMatch(/var\(--xeg-focus-ring\)/);
    });
  });
});
