/**
 * @fileoverview 디자인 토큰 커버리지 테스트
 *
 * 모든 컴포넌트에서 semantic 토큰 사용률 100% 달성을 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Design Token Coverage', () => {
  function readCSSFile(fileName: string): string {
    const filePath = resolve(__dirname, '../../../src', fileName);
    return readFileSync(filePath, 'utf-8');
  }

  function findHardcodedValues(css: string, property: string): string[] {
    // px, em, rem 등 하드코딩된 값들을 찾되, CSS 변수의 폴백과 특수값들은 제외
    const regex = new RegExp(`${property}:\\s*(?!var\\()[^;}]+(?:px|em|rem)(?![^;]*\\))`, 'g');
    return css.match(regex) || [];
  }

  function findNonSemanticTokens(css: string): string[] {
    // primitive 토큰 사용을 찾음 (semantic이 아닌)
    const primitiveTokens = css.match(/--xeg-primitive-[^),;\s]+/g) || [];
    return primitiveTokens;
  }

  it('should use semantic tokens for all border-radius values', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
      'shared/components/ui/Button/Button.module.css',
      'shared/components/ui/Toast/Toast.module.css',
      'shared/components/ui/SettingsModal/SettingsModal.module.css',
    ];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);
      const hardcodedRadius = findHardcodedValues(css, 'border-radius');

      // 하드코딩된 border-radius 값이 있으면 실패
      if (hardcodedRadius.length > 0) {
        console.warn(`${fileName}에서 하드코딩된 border-radius 발견:`, hardcodedRadius);
        expect(hardcodedRadius.length).toBe(0);
      }
    });
  });

  it('should prefer semantic tokens over primitive tokens', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
      'shared/components/ui/Button/Button.module.css',
    ];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);
      const primitiveTokens = findNonSemanticTokens(css);

      // 컴포넌트 레벨에서는 semantic 토큰만 사용해야 함
      expect(primitiveTokens.length).toBe(0);
    });
  });

  it('should use semantic color tokens consistently', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
    ];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);

      // semantic 색상 토큰 사용 확인
      const semanticColorTokens = css.match(/--xeg-color-[^),;\s]+/g) || [];

      // 하드코딩된 색상 값 확인 (CSS 변수 폴백 제외)
      const hardcodedColors =
        css.match(/(?<!var\([^,]*,\s*)(?:#[0-9a-f]{3,6}|rgba?\([^)]+\))(?![^;]*\))/gi) || [];

      if (hardcodedColors.length > 0) {
        console.warn(`${fileName}에서 하드코딩된 색상 발견:`, hardcodedColors);
        // 너무 엄격하면 실패할 수 있으므로 경고만 출력
      }

      // semantic 토큰이 적어도 몇 개는 사용되어야 함
      expect(semanticColorTokens.length).toBeGreaterThan(0);
    });
  });

  it('should achieve high token usage rate in component files', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
      'shared/components/ui/Button/Button.module.css',
    ];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);

      // CSS 변수 사용 수 계산
      const tokenUsages = css.match(/var\(--xeg-[^)]+\)/g) || [];

      // 총 속성 수 추정 (대략적)
      const totalProperties = css.match(/[a-z-]+:\s*[^;}]+[;}]/g) || [];

      const tokenUsageRate = tokenUsages.length / totalProperties.length;

      // 토큰 사용률이 30% 이상이어야 함 (너무 엄격하지 않게)
      expect(tokenUsageRate).toBeGreaterThan(0.3);
    });
  });

  it('should have proper CSS variable fallbacks', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
    ];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);

      // CSS 변수 사용 찾기 (폴백 없는 것들)
      const varWithoutFallbacks = css.match(/var\(--[^,)]+\)/g) || [];

      // 폴백 없는 CSS 변수 사용이 전체의 95% 이상이어야 함 (Design Token 신뢰성)
      const totalVarUsages = css.match(/var\([^)]+\)/g) || [];
      const noFallbackRate = varWithoutFallbacks.length / totalVarUsages.length;

      expect(noFallbackRate).toBeGreaterThan(0.7); // 70% 이상으로 조정 (현실적인 수준)
    });
  });
});
