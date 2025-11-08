/**
 * @fileoverview 색상 토큰 일관성 테스트
 * @description 하드코딩된 색상 사용 금지 및 의미론적(semantic) 토큰 활용 검증
 *
 * Phase 171A: 현대화
 * - 파일 시스템 기반 가드 테스트로 유지
 * - 색상 토큰 정책 준수 검증
 * - TypeScript strict 모드 지원
 */

import { readFileSync } from 'fs';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../..');

describe('Color Token Consistency', () => {
  setupGlobalTestIsolation();

  describe('Hard-coded Color Prevention', () => {
    it('갤러리 CSS에서 Twitter 색상 하드코딩을 금지한다', () => {
      const cssPath = resolve(projectRoot, 'src/features/gallery/styles/gallery-global.css');
      const cssContent = readFileSync(cssPath, 'utf8');

      // Twitter 브랜드 색상 하드코딩 금지
      expect(cssContent).not.toMatch(/#1d9bf0/i);
      expect(cssContent).not.toMatch(/#1570b8/i);
      expect(cssContent).not.toMatch(/#1a8cd8/i);
    });

    it('glass-surface에서 rgba 색상 하드코딩을 금지한다', () => {
      const cssPath = resolve(projectRoot, 'src/features/gallery/styles/gallery-global.css');
      const cssContent = readFileSync(cssPath, 'utf8');

      // glass-surface 클래스 내 rgba 하드코딩 검증
      const glassSurfaceSection = cssContent.match(/\.glass-surface\s*{[^}]+}/gs);
      if (glassSurfaceSection) {
        for (const section of glassSurfaceSection) {
          expect(section).not.toMatch(/rgba\(29,\s*155,\s*240/i);
          expect(section).not.toMatch(/rgba\(21,\s*32,\s*43/i);
        }
      }
    });
  });

  describe('Semantic Token Usage', () => {
    it('툴바 배경에 semantic 토큰을 사용한다', () => {
      const toolbarCssPath = resolve(
        projectRoot,
        'src/shared/components/ui/Toolbar/Toolbar.module.css'
      );
      const toolbarCss = readFileSync(toolbarCssPath, 'utf8');

      expect(toolbarCss).toMatch(/background:\s*var\(--xeg-bg-toolbar\)/);
      expect(toolbarCss).not.toMatch(/--xeg-comp-toolbar-bg/);
    });

    it('모달 배경에 semantic 토큰을 사용한다', () => {
      const modalCssPath = resolve(
        projectRoot,
        'src/shared/components/ui/SettingsModal/SettingsModal.module.css'
      );
      const modalCss = readFileSync(modalCssPath, 'utf8');

      expect(modalCss).toMatch(/background:\s*var\(--xeg-modal-bg\)/);
    });
  });

  describe('Theme-specific Token Definition', () => {
    it('semantic 토큰이 정의되어 있다', () => {
      const semanticTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.semantic.css'
      );
      const semanticTokens = readFileSync(semanticTokensPath, 'utf8');

      expect(semanticTokens).toMatch(/--xeg-bg-toolbar:/);
      expect(semanticTokens).toMatch(/@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/);
    });

    it('glass effect 토큰이 정의되어 있다', () => {
      const semanticTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.semantic.css'
      );
      const semanticTokens = readFileSync(semanticTokensPath, 'utf8');

      expect(semanticTokens).toMatch(/--xeg-surface-glass-bg/);
      expect(semanticTokens).toMatch(/--xeg-surface-glass-border/);
    });
  });

  describe('Accessibility Token Support', () => {
    it('고대비 모드 미디어 쿼리를 지원한다', () => {
      const semanticTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.semantic.css'
      );
      const semanticTokens = readFileSync(semanticTokensPath, 'utf8');

      expect(semanticTokens).toMatch(/@media\s*\(\s*prefers-contrast:\s*high\s*\)/);
    });

    it('감소된 투명도 미디어 쿼리를 지원한다', () => {
      const componentTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.component.css'
      );
      const componentTokens = readFileSync(componentTokensPath, 'utf8');

      expect(componentTokens).toMatch(/@media\s*\(\s*prefers-reduced-transparency:\s*reduce\s*\)/);
    });
  });
});
