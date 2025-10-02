/**
 * @fileoverview Style System Consolidation Tests
 * @description CSS 중복 제거 및 design token 통합 검증
 */

/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readCSSFile(relativePath: string): string {
  const filePath = join(process.cwd(), 'src', relativePath);
  return readFileSync(filePath, 'utf-8');
}

describe('Style System Consolidation', () => {
  describe('Toolbar Button Style Consistency', () => {
    it('모든 toolbar 버튼이 디자인 토큰을 사용해야 함', () => {
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // border-radius는 --xeg-radius-* 또는 --radius-* 토큰 사용
      const radiusMatches = toolbarCSS.match(/border-radius:\s*[^;]+;/g) || [];
      const hardcodedRadius = radiusMatches.filter(
        match =>
          !match.includes('var(--xeg-radius') &&
          !match.includes('var(--radius-') &&
          !match.includes('inherit')
      );

      expect(hardcodedRadius).toEqual([]);
    });

    it('중복된 button 스타일 클래스가 없어야 함', () => {
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // .xeg-toolbar-button과 같은 레거시 클래스가 없어야 함
      expect(toolbarCSS).not.toMatch(/\.xeg-toolbar-button/);
    });
  });

  describe('CSS Module vs Global Style Consistency', () => {
    it('컴포넌트 스타일은 CSS Module을 사용해야 함', () => {
      const buttonCSS = readCSSFile('shared/components/ui/Button/Button.module.css');
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // CSS Module은 .module.css 확장자를 가짐
      expect(buttonCSS).toBeDefined();
      expect(toolbarCSS).toBeDefined();
    });
  });

  describe('Color Token Consistency', () => {
    it('같은 용도의 색상은 동일한 토큰을 사용해야 함', () => {
      const designTokens = readCSSFile('shared/styles/design-tokens.css');

      // primary 색상 토큰이 정의되어 있어야 함
      expect(designTokens).toMatch(/--xeg-color-primary/);
      expect(designTokens).toMatch(/--xeg-color-neutral/);
    });

    it('하드코딩된 색상값이 없어야 함', () => {
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // #으로 시작하는 hex 색상 코드가 없어야 함 (주석 제외)
      const lines = toolbarCSS
        .split('\n')
        .filter(line => !line.trim().startsWith('/*') && !line.trim().startsWith('*'));
      const cssWithoutComments = lines.join('\n');
      const hexColors = cssWithoutComments.match(/#[0-9a-fA-F]{3,6}(?![^{]*\*\/)/g) || [];

      expect(hexColors).toEqual([]);
    });
  });

  describe('Design Token Policy Compliance', () => {
    it('모든 spacing 값은 토큰을 사용해야 함', () => {
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // padding, margin은 var(--xeg-* 또는 var(--space-* 토큰 사용
      const paddingMatches = toolbarCSS.match(/padding[^:]*:\s*[^;]+;/g) || [];
      const hardcodedPadding = paddingMatches.filter(
        match => /\d+px/.test(match) && !match.includes('var(')
      );

      expect(hardcodedPadding.length).toBe(0);
    });
  });
});
