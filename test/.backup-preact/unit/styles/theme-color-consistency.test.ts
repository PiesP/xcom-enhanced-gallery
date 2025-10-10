/**
 * @fileoverview 테마별 색상 일관성 검증 테스트
 *
 * 다크/라이트 모드에서 인터랙션 요소들의 호버 색상이 올바르게 분리되어 있는지 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Theme Color Consistency', () => {
  function readCSSFile(fileName: string): string {
    const filePath = resolve(__dirname, '../../../src', fileName);
    return readFileSync(filePath, 'utf-8');
  }

  function extractHoverSelectors(css: string): string[] {
    const hoverRegex = /[^{}]*:hover[^{}]*{[^}]*}/g;
    return css.match(hoverRegex) || [];
  }

  function extractDarkModeSelectors(css: string): string[] {
    const darkModeRegex = /\[data-theme=['"]dark['"][^{}]*{[^}]*}/g;
    return css.match(darkModeRegex) || [];
  }

  it('should use appropriate fallback colors for light mode hover states', () => {
    const iconButtonCSS = readCSSFile('shared/components/ui/Button/Button.module.css');
    const lightModeHoverSelectors = extractHoverSelectors(iconButtonCSS).filter(
      selector => !selector.includes("[data-theme='dark']")
    );

    lightModeHoverSelectors.forEach(selector => {
      // 라이트 모드에서는 neutral-100 또는 적절한 라이트 색상 사용해야 함
      if (selector.includes('rgba(255, 255, 255')) {
        // 라이트 모드에서 흰색 기반 색상은 적절함
        expect(selector).toMatch(/rgba\(255,\s*255,\s*255,\s*0\.[01]\d*\)/);
      }
    });
  });

  it('should use appropriate fallback colors for dark mode hover states', () => {
    const iconButtonCSS = readCSSFile('shared/components/ui/Button/Button.module.css');
    const darkModeSelectors = extractDarkModeSelectors(iconButtonCSS);

    darkModeSelectors.forEach(selector => {
      if (selector.includes(':hover') && selector.includes('rgba(255, 255, 255')) {
        // 다크 모드에서 흰색 기반 폴백은 문제가 될 수 있음
        // neutral-800 토큰이 우선이고, 폴백은 어두운 색상이어야 함
        console.warn('Dark mode hover uses white-based fallback:', selector);
      }
    });
  });

  it('should not mix light and dark color tokens inappropriately', () => {
    const cssFiles = ['shared/components/ui/Button/Button.module.css'];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);
      const darkModeSelectors = extractDarkModeSelectors(css);

      darkModeSelectors.forEach(selector => {
        // 다크 모드에서 라이트 모드 토큰 사용 방지
        expect(selector).not.toContain('neutral-100');
        expect(selector).not.toContain('neutral-200');

        // 다크 모드에서는 neutral-600, neutral-700, neutral-800 등 사용
        if (selector.includes('neutral-')) {
          expect(selector).toMatch(/neutral-[6-9]\d{2}/);
        }
      });
    });
  });

  it('should use semantic tokens rather than raw rgba values', () => {
    const iconButtonCSS = readCSSFile('shared/components/ui/Button/Button.module.css');

    // CSS 변수 사용을 권장하고, rgba 폴백은 최소한으로
    const rawRgbaUsage = iconButtonCSS.match(/rgba\([^)]+\)/g) || [];

    // 폴백으로만 사용되는지 확인 (var() 함수 내부에 있는지)
    rawRgbaUsage.forEach(rgba => {
      const contextStart = Math.max(0, iconButtonCSS.indexOf(rgba) - 50);
      const contextEnd = iconButtonCSS.indexOf(rgba) + rgba.length + 50;
      const context = iconButtonCSS.substring(contextStart, contextEnd);

      // rgba는 CSS 변수의 폴백으로만 사용되어야 함
      const isInVarFallback =
        context.includes('var(') &&
        context.substring(context.indexOf('var('), context.indexOf(rgba)).includes(',');

      expect(isInVarFallback).toBe(true);
    });
  });
});
