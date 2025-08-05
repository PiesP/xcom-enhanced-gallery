/**
 * @import { ZIndexManager } from "../src/shared/utils/z-index-manager";ileoverview 디자인 시스템 통합 테스트
 * @description TDD로 구현한 디자인 시스템 개선사항들을 검증
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// 우리가 구현한 모듈들
import { ZIndexManager } from '../src/shared/utils/z-index-manager';
import {
  generateZIndexCSS,
  getZIndex,
  injectZIndexStyles,
} from '../src/shared/styles/z-index-system';
import {
  generateGlassmorphismCSS,
  createOptimizedGlassClasses,
  injectGlassmorphismStyles,
} from '../src/shared/styles/glassmorphism-system';

describe('🎨 디자인 시스템 통합 테스트', () => {
  describe('Z-Index 관리 시스템', () => {
    let zIndexManager: ZIndexManager;

    beforeEach(() => {
      zIndexManager = ZIndexManager.getInstance();
      zIndexManager.reset();
    });

    it('ZIndexManager가 싱글톤으로 작동해야 함', () => {
      const instance1 = ZIndexManager.getInstance();
      const instance2 = ZIndexManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('기본 계층들의 Z-Index 값을 반환해야 함', () => {
      expect(zIndexManager.getZIndex('gallery')).toBe(2000);
      expect(zIndexManager.getZIndex('toolbar')).toBe(2500);
      expect(zIndexManager.getZIndex('modal')).toBe(3000);
      expect(zIndexManager.getZIndex('toast')).toBe(4000);
    });

    it('오프셋을 적용한 Z-Index 값을 반환해야 함', () => {
      expect(zIndexManager.getZIndex('gallery', 10)).toBe(2010);
      expect(zIndexManager.getZIndex('toolbar', -5)).toBe(2495);
    });

    it('CSS 변수를 생성해야 함', () => {
      const css = zIndexManager.generateCSSVariables();

      expect(css).toContain('--xeg-z-gallery: 2000;');
      expect(css).toContain('--xeg-z-toolbar: 2500;');
      expect(css).toContain('--xeg-z-modal: 3000;');
      expect(css).toContain('--xeg-z-toast: 4000;');
    });

    it('알 수 없는 계층에 대해 에러를 던져야 함', () => {
      expect(() => {
        zIndexManager.getZIndex('unknown' as any);
      }).toThrow('Unknown z-index layer: unknown');
    });

    it('헬퍼 함수가 정상 작동해야 함', () => {
      expect(getZIndex('gallery')).toBe(2000);
      expect(getZIndex('toolbar', 10)).toBe(2510);
    });

    it('CSS 생성 함수가 정상 작동해야 함', () => {
      const css = generateZIndexCSS();

      expect(css).toContain(':root {');
      expect(css).toContain('--xeg-z-gallery: 2000;');
      expect(css).toContain('#xeg-gallery-root {');
      expect(css).toContain('z-index: var(--xeg-z-gallery);');
    });
  });

  describe('글래스모피즘 시스템', () => {
    it('기본 글래스모피즘 CSS를 생성해야 함', () => {
      const css = generateGlassmorphismCSS();

      expect(css).toContain('background: rgba(255, 255, 255, 0.8)');
      expect(css).toContain('backdrop-filter: blur(12px)');
      expect(css).toContain('border: 1px solid rgba(255, 255, 255, 0.2)');
      expect(css).toContain('transform: translateZ(0)');
    });

    it('커스텀 옵션으로 글래스모피즘 CSS를 생성해야 함', () => {
      const css = generateGlassmorphismCSS({
        blur: 8,
        opacity: 0.6,
        borderOpacity: 0.1,
      });

      expect(css).toContain('background: rgba(255, 255, 255, 0.6)');
      expect(css).toContain('backdrop-filter: blur(8px)');
      expect(css).toContain('border: 1px solid rgba(255, 255, 255, 0.1)');
    });

    it('접근성 고려 옵션이 적용되어야 함', () => {
      const css = generateGlassmorphismCSS({ respectAccessibility: true });

      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
      expect(css).toContain('@media (prefers-reduced-transparency: reduce)');
      expect(css).toContain('@media (prefers-contrast: high)');
    });

    it('GPU 가속 옵션이 적용되어야 함', () => {
      const cssWithGPU = generateGlassmorphismCSS({ useGPUAcceleration: true });
      const cssWithoutGPU = generateGlassmorphismCSS({ useGPUAcceleration: false });

      expect(cssWithGPU).toContain('transform: translateZ(0)');
      expect(cssWithGPU).toContain('will-change: backdrop-filter');
      expect(cssWithoutGPU).not.toContain('transform: translateZ(0)');
    });

    it('최적화된 글래스 클래스들을 생성해야 함', () => {
      const css = createOptimizedGlassClasses();

      expect(css).toContain('.xeg-glass {');
      expect(css).toContain('.xeg-glass-light {');
      expect(css).toContain('.xeg-glass-heavy {');
      expect(css).toContain('.xeg-glass-toolbar {');
      expect(css).toContain('@supports not (backdrop-filter: blur(10px))');
      expect(css).toContain('@media (prefers-color-scheme: dark)');
    });
  });

  describe('스타일 주입 시스템', () => {
    beforeEach(() => {
      // JSDOM 환경 설정
      document.head.innerHTML = '';
    });

    afterEach(() => {
      // 정리
      document.head.innerHTML = '';
    });

    it('Z-Index 스타일을 DOM에 주입해야 함', () => {
      injectZIndexStyles();

      const styleElement = document.getElementById('xeg-zindex-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName).toBe('STYLE');
      expect(styleElement?.textContent).toContain('--xeg-z-gallery: 2000;');
    });

    it('글래스모피즘 스타일을 DOM에 주입해야 함', () => {
      injectGlassmorphismStyles();

      const styleElement = document.getElementById('xeg-glassmorphism-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName).toBe('STYLE');
      expect(styleElement?.textContent).toContain('.xeg-glass {');
    });

    it.skip('기존 스타일 요소를 교체해야 함', () => {
      // 첫 번째 주입
      injectZIndexStyles();
      const firstElement = document.getElementById('xeg-zindex-styles');

      // 두 번째 주입
      injectZIndexStyles();
      const secondElement = document.getElementById('xeg-zindex-styles');

      expect(firstElement).not.toBe(secondElement);
      expect(document.querySelectorAll('#xeg-zindex-styles')).toHaveLength(1);
    });
  });

  describe('계층별 충돌 방지', () => {
    it('모든 계층이 올바른 순서를 가져야 함', () => {
      const zIndexManager = ZIndexManager.getInstance();
      const layers = zIndexManager.getAllLayers();

      // Z-Index 값이 오름차순으로 정렬되어 있는지 확인
      for (let i = 1; i < layers.length; i++) {
        expect(layers[i].zIndex).toBeGreaterThan(layers[i - 1].zIndex);
      }
    });

    it('계층 간 충분한 간격이 있어야 함', () => {
      const zIndexManager = ZIndexManager.getInstance();

      const galleryZ = zIndexManager.getZIndex('gallery');
      const toolbarZ = zIndexManager.getZIndex('toolbar');
      const modalZ = zIndexManager.getZIndex('modal');
      const toastZ = zIndexManager.getZIndex('toast');

      expect(toolbarZ - galleryZ).toBeGreaterThanOrEqual(500);
      expect(modalZ - toolbarZ).toBeGreaterThanOrEqual(500);
      expect(toastZ - modalZ).toBeGreaterThanOrEqual(1000);
    });
  });
});
