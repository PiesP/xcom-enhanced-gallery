/**
 * @fileoverview A11Y Contrast Tokens Test
 * @description WCAG 대비율 토큰 정의 및 사용 검증
 */

/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readCSSFile(relativePath: string): string {
  const filePath = join(process.cwd(), 'src', relativePath);
  return readFileSync(filePath, 'utf-8');
}

describe('A11Y Contrast Tokens', () => {
  describe('Design token 대비 정의', () => {
    it('design-tokens.semantic.css는 텍스트/배경 색상 토큰을 정의해야 함', () => {
      const designTokens = readCSSFile('shared/styles/design-tokens.semantic.css');

      // 텍스트 색상 토큰
      expect(designTokens).toMatch(/--color-text-primary/);
      expect(designTokens).toMatch(/--color-text-secondary/);

      // 배경 색상 토큰
      expect(designTokens).toMatch(/--xeg-bg-|--color-bg-/);

      // 중립 색상 스케일 (대비 보장용)
      expect(designTokens).toMatch(/--xeg-color-neutral|--color-gray/);
    });

    it('prefers-contrast: high 미디어 쿼리가 존재해야 함', () => {
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // 고대비 모드 지원
      expect(toolbarCSS).toMatch(/@media\s*\(prefers-contrast:\s*high\)/);
    });
  });

  describe('Component 대비 정책', () => {
    it('Toolbar는 고대비 모드에서 테두리를 강화해야 함', () => {
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // prefers-contrast: high에서 border-width 2px
      const highContrastSection = toolbarCSS.match(
        /@media\s*\(prefers-contrast:\s*high\)[^}]*\{[^@]*\}/gs
      );

      expect(highContrastSection).toBeTruthy();
      if (highContrastSection && highContrastSection.length > 0) {
        const hasStrongBorder = highContrastSection.some(
          section => /border:\s*2px/.test(section) || /border-width:\s*2px/.test(section)
        );
        expect(hasStrongBorder).toBe(true);
      }
    });

    it('SettingsModal은 디자인 토큰 색상을 사용해야 함', () => {
      const modalCSS = readCSSFile('shared/components/ui/SettingsModal/SettingsModal.module.css');

      // 하드코딩된 hex 색상 없음
      const lines = modalCSS
        .split('\n')
        .filter(line => !line.trim().startsWith('/*') && !line.trim().startsWith('*'));
      const cssWithoutComments = lines.join('\n');
      const hexColors = cssWithoutComments.match(/#[0-9a-fA-F]{3,6}(?![^{]*\*\/)/g) || [];

      expect(hexColors.length).toBe(0);
    });

    it('Toast는 충분한 대비를 제공하는 토큰을 사용해야 함', () => {
      const toastCSS = readCSSFile('shared/components/ui/Toast/Toast.module.css');

      // 토큰 기반 색상 사용
      const colorVarMatches = toastCSS.match(/color:\s*var\(--/g) || [];
      const backgroundVarMatches = toastCSS.match(/background:\s*var\(--/g) || [];

      // 색상과 배경 모두 토큰 사용
      expect(colorVarMatches.length).toBeGreaterThan(0);
      expect(backgroundVarMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Focus ring 대비', () => {
    it('focus-ring 토큰은 충분한 대비를 보장해야 함', () => {
      const designTokens = readCSSFile('shared/styles/design-tokens.semantic.css');

      // focus-ring 정의 확인
      expect(designTokens).toMatch(/--xeg-focus-ring/);
      expect(designTokens).toMatch(/--xeg-focus-ring-offset/);

      // primary 색상 기반 (일반적으로 충분한 대비 제공)
      const focusRingMatch = designTokens.match(/--xeg-focus-ring:\s*[^;]+;/);
      if (focusRingMatch) {
        const focusRingValue = focusRingMatch[0];
        // primary 색상 사용하거나 solid 색상 사용
        expect(focusRingValue.includes('--color-primary') || focusRingValue.includes('solid')).toBe(
          true
        );
      }
    });
  });
});
