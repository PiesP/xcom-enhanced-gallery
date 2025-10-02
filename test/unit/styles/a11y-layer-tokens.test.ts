/**
 * @fileoverview A11Y Layer Tokens Test
 * @description z-index 레이어 관리 토큰 일관성 검증
 */

/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readCSSFile(relativePath: string): string {
  const filePath = join(process.cwd(), 'src', relativePath);
  return readFileSync(filePath, 'utf-8');
}

describe('A11Y Layer Tokens (z-index)', () => {
  describe('Semantic z-index tokens definition', () => {
    it('design-tokens.semantic.css는 모든 레이어 토큰을 정의해야 함', () => {
      const designTokens = readCSSFile('shared/styles/design-tokens.semantic.css');

      // z-index 토큰 정의 확인
      expect(designTokens).toMatch(/--xeg-z-modal:\s*\d+/);
      expect(designTokens).toMatch(/--xeg-z-toolbar:\s*\d+/);
      expect(designTokens).toMatch(/--xeg-z-overlay:\s*\d+/);
      expect(designTokens).toMatch(/--xeg-z-toast:\s*\d+/);
      expect(designTokens).toMatch(/--xeg-z-gallery:/);
      expect(designTokens).toMatch(/--xeg-z-root:\s*\d+/);

      // layer 별칭 토큰 정의 확인
      expect(designTokens).toMatch(/--xeg-layer-toolbar:/);
      expect(designTokens).toMatch(/--xeg-layer-modal:/);
      expect(designTokens).toMatch(/--xeg-layer-overlay:/);
      expect(designTokens).toMatch(/--xeg-layer-toast:/);
    });

    it('z-index 값은 논리적 계층 순서를 유지해야 함', () => {
      const designTokens = readCSSFile('shared/styles/design-tokens.semantic.css');

      // z-index 값 추출
      const zIndexMatch = (token: string) => {
        const match = designTokens.match(new RegExp(`${token}:\\s*(\\d+)`));
        return match ? parseInt(match[1], 10) : -1;
      };

      const overlay = zIndexMatch('--xeg-z-overlay');
      const modal = zIndexMatch('--xeg-z-modal');
      const toolbar = zIndexMatch('--xeg-z-toolbar');
      const toast = zIndexMatch('--xeg-z-toast');
      const root = zIndexMatch('--xeg-z-root');

      // 논리적 순서: overlay < modal < toolbar < toast < root
      expect(overlay).toBeGreaterThan(0);
      expect(modal).toBeGreaterThan(overlay);
      expect(toolbar).toBeGreaterThan(modal);
      expect(toast).toBeGreaterThan(toolbar);
      expect(root).toBeGreaterThan(toast);
    });
  });

  describe('Component z-index usage', () => {
    it('Toolbar는 z-index 토큰을 사용해야 함', () => {
      const toolbarCSS = readCSSFile('shared/components/ui/Toolbar/Toolbar.module.css');

      // z-index는 토큰 사용
      const zIndexMatches = toolbarCSS.match(/z-index:\s*[^;]+;/g) || [];
      const hardcodedZIndex = zIndexMatches.filter(
        match => /z-index:\s*\d+/.test(match) && !match.includes('var(')
      );

      expect(hardcodedZIndex.length).toBe(0);
    });

    it('SettingsModal은 z-index 토큰을 사용해야 함', () => {
      const modalCSS = readCSSFile('shared/components/ui/SettingsModal/SettingsModal.module.css');

      // z-index는 토큰 사용
      const zIndexMatches = modalCSS.match(/z-index:\s*[^;]+;/g) || [];
      const hardcodedZIndex = zIndexMatches.filter(
        match => /z-index:\s*\d+/.test(match) && !match.includes('var(')
      );

      expect(hardcodedZIndex.length).toBe(0);
    });

    it('Toast는 z-index 토큰을 사용해야 함', () => {
      const toastCSS = readCSSFile('shared/components/ui/Toast/Toast.module.css');

      // z-index는 토큰 사용
      const zIndexMatches = toastCSS.match(/z-index:\s*[^;]+;/g) || [];
      const hardcodedZIndex = zIndexMatches.filter(
        match => /z-index:\s*\d+/.test(match) && !match.includes('var(')
      );

      expect(hardcodedZIndex.length).toBe(0);
    });
  });
});
