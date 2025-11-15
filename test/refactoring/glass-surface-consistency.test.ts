/**
 * @fileoverview Glass Surface 디자인 일관성 테스트 (분리된 glassmorphism 클래스)
 * @description TDD로 개발된 glassmorphism 스타일의 일관성과 중복 제거를 검증합니다.
 * - Toolbar: 어두운 glassmorphism (xeg-glass-surface-dark)
 * - SettingsModal: 밝은 glassmorphism (xeg-glass-surface-light)
 * @version 6.1.0 - 분리된 glassmorphism 클래스 지원
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'fs';
import path from 'path';
import process from 'node:process';

/**
 * 파일을 읽는 헬퍼 함수
 */
function readFile(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), relativePath);
  return readFileSync(fullPath, 'utf-8');
}

function extractGlassSurfaceBlock(cssContent: string, variant: 'light' | 'dark'): string {
  const selector = `:where(.xeg-glass-surface-${variant}`;
  const start = cssContent.indexOf(selector);
  expect(start).toBeGreaterThan(-1);
  const end = cssContent.indexOf('}', start);
  expect(end).toBeGreaterThan(start);
  return cssContent.substring(start, end);
}

describe('Glass Surface 디자인 일관성 - TDD GREEN Phase (분리된 클래스)', () => {
  setupGlobalTestIsolation();

  describe('분리된 Glass Surface 클래스 요구사항', () => {
    it('gallery-global.css에 glass-surface-light 클래스가 정의되어야 함', () => {
      const globalCSS = readFile('src/features/gallery/styles/gallery-global.css');

      // xeg-glass-surface-light 클래스 존재 여부 확인
      expect(globalCSS.includes('.xeg-glass-surface-light')).toBe(true);
    });

    it('gallery-global.css에 glass-surface-dark 클래스가 정의되어야 함', () => {
      const globalCSS = readFile('src/features/gallery/styles/gallery-global.css');

      // xeg-glass-surface-dark 클래스 존재 여부 확인
      expect(globalCSS.includes('.xeg-glass-surface-dark')).toBe(true);
    });

    it('glass-surface-light 클래스가 밝은 glassmorphism 속성을 포함해야 함', () => {
      const globalCSS = readFile('src/features/gallery/styles/gallery-global.css');

      const glassSurfaceLightContent = extractGlassSurfaceBlock(globalCSS, 'light');

      // 필수 glassmorphism 속성들이 포함되어야 함
      const requiredStyles = ['background:', 'backdrop-filter:', 'box-shadow:', 'border:'];

      requiredStyles.forEach(style => {
        expect(glassSurfaceLightContent.includes(style)).toBe(true);
      });

      expect(glassSurfaceLightContent).toMatch(/var\(--xeg-surface-glass-bg-light\)/);
    });

    it('glass-surface-dark 클래스가 어두운 glassmorphism 속성을 포함해야 함', () => {
      const globalCSS = readFile('src/features/gallery/styles/gallery-global.css');

      const glassSurfaceDarkContent = extractGlassSurfaceBlock(globalCSS, 'dark');

      // 필수 glassmorphism 속성들이 포함되어야 함
      const requiredStyles = ['background:', 'backdrop-filter:', 'box-shadow:', 'border:'];

      requiredStyles.forEach(style => {
        expect(glassSurfaceDarkContent.includes(style)).toBe(true);
      });

      // 어두운 배경이 semantic 토큰을 사용하고 있는지 확인
      expect(glassSurfaceDarkContent).toMatch(/var\(--xeg-surface-glass-bg-dark\)/);
    });
  });

  describe('Toolbar 스타일 리팩토링 요구사항', () => {
    it('Toolbar.module.css에서 중복 glassmorphism 스타일이 제거되어야 함', () => {
      const toolbarCSS = readFile('src/shared/components/ui/Toolbar/Toolbar.module.css');

      // 제거되어야 할 중복 glassmorphism 스타일들
      const duplicateStyles = [
        'backdrop-filter: blur(',
        '-webkit-backdrop-filter: blur(',
        'background: rgba(255, 255, 255, 0.8)',
        'background: rgba(0, 0, 0, 0.8)',
      ];

      // 이 스타일들이 .galleryToolbar 클래스에서 제거되어야 함
      duplicateStyles.forEach(style => {
        const toolbarSection = toolbarCSS.substring(
          toolbarCSS.indexOf('.galleryToolbar {'),
          toolbarCSS.indexOf('.toolbarContent') !== -1
            ? toolbarCSS.indexOf('.toolbarContent')
            : toolbarCSS.length
        );
        expect(toolbarSection.includes(style)).toBe(false);
      });
    });
  });

  describe('SettingsModal 스타일 리팩토링 요구사항', () => {
    it('SettingsModal.module.css에서 중복 glassmorphism 스타일이 제거되어야 함', () => {
      const modalCSS = readFile('src/shared/components/ui/SettingsModal/SettingsModal.module.css');

      // 제거되어야 할 중복 glassmorphism 스타일들
      const duplicateStyles = [
        'backdrop-filter: blur(',
        '-webkit-backdrop-filter: blur(',
        'background: rgba(255, 255, 255, 0.9)',
        'background: rgba(0, 0, 0, 0.9)',
      ];

      // 이 스타일들이 .modal 클래스에서 제거되어야 함
      duplicateStyles.forEach(style => {
        const modalSection = modalCSS.substring(
          modalCSS.indexOf('.modal {'),
          modalCSS.indexOf('.header') !== -1 ? modalCSS.indexOf('.header') : modalCSS.length
        );
        expect(modalSection.includes(style)).toBe(false);
      });
    });
  });

  describe('컴포넌트 토큰 기반 아키텍처 사용 요구사항', () => {
    it('Toolbar 컴포넌트 TSX 파일이 glass-surface 클래스를 제거하고 semantic CSS 토큰을 사용해야 함', () => {
      const toolbarTSX = readFile('src/shared/components/ui/Toolbar/Toolbar.tsx');
      const toolbarCSS = readFile('src/shared/components/ui/Toolbar/Toolbar.module.css');

      // Toolbar TSX 파일에서 glass-surface 클래스 제거 확인
      expect(toolbarTSX.includes("'glass-surface'")).toBe(false);

      // CSS에서 semantic 토큰 사용 확인 (alias 제거)
      expect(toolbarCSS.includes('var(--xeg-bg-toolbar)')).toBe(true);
      expect(toolbarCSS.includes('--xeg-comp-toolbar-bg')).toBe(false);
    });

    it('SettingsModal 컴포넌트 TSX 파일이 glass-surface 클래스를 제거하고 CSS 시맨틱 토큰을 사용해야 함', () => {
      const modalTSX = readFile('src/shared/components/ui/SettingsModal/SettingsModal.tsx');
      const modalCSS = readFile('src/shared/components/ui/SettingsModal/SettingsModal.module.css');

      // SettingsModal TSX 파일에서 glass-surface 클래스 제거 확인
      expect(modalTSX.includes('glass-surface')).toBe(false);

      // CSS에서 시맨틱 토큰 사용 확인
      expect(modalCSS.includes('var(--xeg-modal-bg)')).toBe(true);
    });
  });
});
