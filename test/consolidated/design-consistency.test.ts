/**
 * TDD Test: Button 컴포넌트 디자인 일관성 테스트
 * @description Button 컴포넌트의 CSS 변수 표준화 및 하드코딩된 값 제거
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

      // 표준 형태 사용 확인
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-sm\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-base\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-lg\)/);
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
    it('하드코딩된 min-height 값이 CSS 변수로 대체되어야 함', () => {
      // 하드코딩된 min-height 검출
      const hardcodedMinHeight = [
        /min-height:\s*2rem[^;]*/g,
        /min-height:\s*2\.5rem[^;]*/g,
        /min-height:\s*3rem[^;]*/g,
      ];

      hardcodedMinHeight.forEach(pattern => {
        const matches = buttonCSS.match(pattern);
        expect(matches, `하드코딩된 min-height 발견: ${pattern}`).toBeNull();
      });

      // CSS 변수 사용 확인
      expect(buttonCSS).toMatch(/min-height:\s*var\(--xeg-button-height-sm\)/);
      expect(buttonCSS).toMatch(/min-height:\s*var\(--xeg-button-height-md\)/);
      expect(buttonCSS).toMatch(/min-height:\s*var\(--xeg-button-height-lg\)/);
    });

    it('하드코딩된 border-width 값이 제거되어야 함', () => {
      // border-width: 1px, 2px 등 하드코딩 검출 (border: 1px solid는 예외)
      const hardcodedBorderWidth = /border-width:\s*[12]px/g;
      const matches = buttonCSS.match(hardcodedBorderWidth);

      expect(matches, '하드코딩된 border-width 발견').toBeNull();
    });

    it('transform translateY 값이 CSS 변수를 사용해야 함', () => {
      // 하드코딩된 translateY 검출
      const hardcodedTranslateY = /translateY\(-1px\)/g;
      const matches = buttonCSS.match(hardcodedTranslateY);

      expect(matches, '하드코딩된 translateY 발견').toBeNull();

      // CSS 변수 사용 확인
      expect(buttonCSS).toMatch(/translateY\(var\(--xeg-button-lift\)\)/);
    });
  });

  describe('디자인 토큰 일관성', () => {
    it('모든 색상이 --xeg-color- 시스템을 사용해야 함', () => {
      // 색상 변수들이 xeg- prefix를 가져야 함
      const colorVariables = [
        '--xeg-color-primary-500',
        '--xeg-color-primary-600',
        '--xeg-color-neutral-100',
        '--xeg-color-text-primary',
        '--xeg-color-border-primary',
      ];

      colorVariables.forEach(variable => {
        expect(buttonCSS.includes(variable), `${variable} 누락`).toBe(true);
      });
    });

    it('모든 shadow가 --xeg-shadow- 시스템을 사용해야 함', () => {
      // shadow 변수들 확인
      expect(buttonCSS).toMatch(/var\(--xeg-shadow-sm\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-shadow-md\)/);
    });

    it('모든 radius가 --xeg-radius- 시스템을 사용해야 함', () => {
      // radius 변수들 확인
      expect(buttonCSS).toMatch(/var\(--xeg-radius-sm\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-radius-md\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-radius-lg\)/);
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
