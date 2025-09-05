/**
 * @fileoverview 인터랙션 상태 표준화 테스트
 *
 * 모든 인터랙티브 요소의 호버/active/focus 상태가 일관된 시각적 피드백을 제공하는지 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Interaction State Standards', () => {
  function readCSSFile(fileName: string): string {
    const filePath = resolve(__dirname, '../../../src', fileName);
    return readFileSync(filePath, 'utf-8');
  }

  function extractTransformStates(css: string): string[] {
    // hover나 active 상태에서 transform 사용하는 부분들 추출
    const transformRegex = /:(?:hover|active)[^{]*{[^}]*transform:\s*([^;}]+)[;}]/g;
    const matches: string[] = [];
    let match;

    while ((match = transformRegex.exec(css)) !== null) {
      matches.push(match[1].trim());
    }

    return matches;
  }

  function extractHoverBoxShadows(css: string): string[] {
    // hover 상태에서 box-shadow 사용하는 부분들 추출
    const shadowRegex = /:hover[^{]*{[^}]*box-shadow:[^;}]*[;}]/g;
    return css.match(shadowRegex) || [];
  }

  it('should have consistent hover transform effects across interactive elements', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
      'shared/components/ui/Button/Button.module.css',
    ];

    const transformEffects: string[] = [];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);
      const transforms = extractTransformStates(css);
      transformEffects.push(...transforms);
    });

    // 표준화된 변환 값들만 사용해야 함
    const standardTransforms = [
      'translateY(-1px)',
      'translateY(0)',
      'translateY(var(--xeg-button-lift))',
      'translateY(var(--xeg-button-lift, -1px))', // 폴백 포함
      'translateY(-0.0625em)',
      'none',
    ];

    transformEffects.forEach(transform => {
      expect(standardTransforms).toContain(transform);
    });
  });

  it('should use semantic tokens for hover background colors', () => {
    const toolbarButtonCSS = readCSSFile('shared/components/ui/Toolbar/ToolbarButton.module.css');

    // 하드코딩된 rgba 값 대신 CSS 변수 사용 권장
    const hoverBackgrounds =
      toolbarButtonCSS.match(/:hover[^{]*{[^}]*background:[^;}]*rgba\([^)]+\)[^;}]*[;}]/g) || [];

    // 모든 rgba 값이 CSS 변수의 폴백으로만 사용되는지 확인
    hoverBackgrounds.forEach(hover => {
      expect(hover).toMatch(/var\([^,)]+,\s*rgba\([^)]+\)\)/);
    });
  });

  it('should have consistent box-shadow patterns for elevated states', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
    ];

    const shadowEffects: string[] = [];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);
      const shadows = extractHoverBoxShadows(css);
      shadowEffects.push(...shadows);
    });

    // 표준화된 그림자 토큰 사용 확인
    const standardShadows = ['var(--xeg-shadow-sm', 'var(--xeg-shadow-md', 'var(--xeg-shadow-lg'];

    shadowEffects.forEach(shadow => {
      const hasStandardShadow = standardShadows.some(standard => shadow.includes(standard));
      expect(hasStandardShadow).toBe(true);
    });
  });

  it('should have proper focus-visible styles for accessibility', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
      'shared/components/ui/Button/Button.module.css',
    ];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);

      // focus-visible 스타일이 있는지 확인
      expect(css).toMatch(/:focus-visible/);

      // outline 또는 box-shadow로 포커스 표시가 있는지 확인
      const focusStyles = css.match(/:focus-visible[^{]*{[^}]*}/g) || [];

      focusStyles.forEach(style => {
        const hasOutlineOrShadow =
          style.includes('outline:') || style.includes('box-shadow:') || style.includes('border:');
        expect(hasOutlineOrShadow).toBe(true);
      });
    });
  });

  it('should disable interactions properly for disabled states', () => {
    const cssFiles = [
      'shared/components/ui/primitive/IconButton.css',
      'shared/components/ui/Toolbar/ToolbarButton.module.css',
    ];

    cssFiles.forEach(fileName => {
      const css = readCSSFile(fileName);

      // disabled 상태 스타일이 있는지 확인
      expect(css).toMatch(/:disabled|:not\(:disabled\)/);

      // disabled 상태에서 커서와 투명도 처리
      if (css.includes(':disabled')) {
        expect(css).toMatch(/cursor:\s*not-allowed/);
        expect(css).toMatch(/opacity:/);
      }
    });
  });
});
