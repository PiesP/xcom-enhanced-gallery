/**
 * Container Size Optimization Tests
 * Sub-Epic 2: CONTAINER-SIZE-OPTIMIZATION
 *
 * 목표: 갤러리 컨테이너 사이즈를 최적화하여 더 많은 이미지 영역 확보
 *
 * TDD Phase: GREEN
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  calculateViewportDimensions,
  applyViewportVariables,
  updateViewportForToolbar,
  MIN_MEDIA_HEIGHT,
  DEFAULT_TOOLBAR_HEIGHT,
  calculateHoverZoneHeight,
  type ViewportDimensions,
} from '@shared/utils/viewport/viewport-calculator';

describe('Container Size Optimization', () => {
  let originalInnerHeight: number;
  let originalInnerWidth: number;

  beforeEach(() => {
    // 원본 window 크기 저장
    originalInnerHeight = window.innerHeight;
    originalInnerWidth = window.innerWidth;

    // 기본 viewport 크기 설정 (데스크톱)
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    // CSS 변수 초기화
    document.documentElement.style.setProperty('--xeg-toolbar-height', '80px');
    document.documentElement.style.setProperty('--xeg-spacing-gallery', '16px');
  });

  afterEach(() => {
    // window 크기 복원
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });

    // CSS 변수 초기화
    document.documentElement.style.removeProperty('--xeg-toolbar-height');
    document.documentElement.style.removeProperty('--xeg-spacing-gallery');
    document.documentElement.style.removeProperty('--xeg-media-max-height');
    document.documentElement.style.removeProperty('--xeg-viewport-height-constrained');
  });

  describe('Viewport Calculation', () => {
    it('should calculate available viewport height excluding toolbar and padding', () => {
      const dimensions = calculateViewportDimensions(true);

      // 1080 - 80(toolbar) - 16(padding) = 984px
      const expectedAvailableHeight = window.innerHeight - DEFAULT_TOOLBAR_HEIGHT - 16;

      expect(dimensions.availableHeight).toBe(expectedAvailableHeight);
      expect(dimensions.toolbarHeight).toBe(DEFAULT_TOOLBAR_HEIGHT);
      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
    });

    it('should respect adaptive minimum height for small screens', () => {
      // 작은 화면 시뮬레이션
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const dimensions = calculateViewportDimensions(true);

      // 600 * 0.6 = 360px (적응형 최소)
      // 600 - 80(toolbar) - 16(padding) = 504px > 360px
      // 따라서 504px 반환
      expect(dimensions.availableHeight).toBe(504);
    });

    it('should adjust toolbar height based on visibility', () => {
      // 툴바 표시 상태
      const visibleDimensions = calculateViewportDimensions(true);

      // 툴바 숨김 상태
      const hiddenDimensions = calculateViewportDimensions(false);

      // 툴바 표시 시 가용 높이 감소: 1080 - 80 - 16 = 984px
      expect(visibleDimensions.availableHeight).toBe(984);
      expect(visibleDimensions.toolbarHeight).toBe(DEFAULT_TOOLBAR_HEIGHT);

      // 툴바 숨김 시: 1080 - 0 - 16 = 1064px
      expect(hiddenDimensions.availableHeight).toBe(1064);
      expect(hiddenDimensions.toolbarHeight).toBe(0);
    });
  });

  describe('CSS Variable Integration', () => {
    it('should update --xeg-media-max-height when toolbar visibility changes', () => {
      // 툴바 표시 상태
      updateViewportForToolbar(true);

      let maxHeight = document.documentElement.style.getPropertyValue('--xeg-media-max-height');
      expect(maxHeight).toContain('calc(100vh - 80px)');

      // 툴바 숨김 상태
      updateViewportForToolbar(false);

      maxHeight = document.documentElement.style.getPropertyValue('--xeg-media-max-height');
      expect(maxHeight).toBe('100vh');
    });

    it('should maintain minimum padding for touch targets', () => {
      const MIN_PADDING = 16;

      const padding = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-spacing-gallery');

      expect(parseInt(padding)).toBeGreaterThanOrEqual(MIN_PADDING);
    });

    it('should set --xeg-viewport-height-constrained for vertical gallery', () => {
      updateViewportForToolbar(true);

      const actualValue = document.documentElement.style.getPropertyValue(
        '--xeg-viewport-height-constrained'
      );

      expect(actualValue).toContain('calc(100vh - 80px)');
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle large desktop screens (1920x1080)', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      });
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const dimensions = calculateViewportDimensions(true);

      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
      // 1080 - 80(toolbar) - 16(padding) = 984px
      expect(dimensions.availableHeight).toBe(984);
    });

    it('should handle tablet screens (768x1024)', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const dimensions = calculateViewportDimensions(true);

      expect(dimensions.width).toBe(768);
      expect(dimensions.height).toBe(1024);
      // 1024 * 0.6 = 614.4px (적응형 최소)
      // 1024 - 80 - 16 = 928px > 614px
      expect(dimensions.availableHeight).toBe(928);
    });

    it('should handle small mobile screens (375x667)', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const dimensions = calculateViewportDimensions(true);

      // 667 * 0.6 = 400.2px (적응형 최소)
      // 667 - 80 - 16 = 571px > 400px
      // 따라서 571px 반환
      expect(dimensions.availableHeight).toBe(571);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle zero or negative toolbar height gracefully', () => {
      document.documentElement.style.setProperty('--xeg-toolbar-height', '0px');

      const dimensions = calculateViewportDimensions(true);

      // 1080 - 0(toolbar) - 16(padding) = 1064px
      expect(dimensions.availableHeight).toBe(1064);
      expect(dimensions.toolbarHeight).toBe(0);
    });

    it('should clamp available height to adaptive minimum', () => {
      // 비정상적으로 큰 툴바 높이
      document.documentElement.style.setProperty('--xeg-toolbar-height', '2000px');

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const dimensions = calculateViewportDimensions(true);

      // 600 * 0.6 = 360px (적응형 최소)
      // 600 - 2000 - 16 = -1416px → 360px로 클램핑
      expect(dimensions.availableHeight).toBe(360);
    });

    it('should use default toolbar height if CSS variable is invalid', () => {
      document.documentElement.style.setProperty('--xeg-toolbar-height', 'invalid');

      const dimensions = calculateViewportDimensions(true);

      expect(dimensions.toolbarHeight).toBe(DEFAULT_TOOLBAR_HEIGHT);
    });
  });

  describe('Adaptive Minimum Height (Sub-Epic 2)', () => {
    it('should account for bottom padding (16px) in height calculation', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      });

      const dimensions = calculateViewportDimensions(true);

      // 하단 패딩 16px 고려:
      // 1080 - 80(toolbar) - 16(padding) = 984px 예상
      // 현재 구현은 1000px를 반환하므로 이 테스트는 실패해야 함
      expect(dimensions.availableHeight).toBe(984);
    });

    it('should enforce absolute minimum of 300px for tiny screens', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 350,
      });

      const dimensions = calculateViewportDimensions(true);

      // 350 * 0.6 = 210px < 300px → 300px 절대 최소 적용
      // 350 - 80(toolbar) - 16(padding) = 254px < 300px
      // 따라서 300px가 보장되어야 함
      expect(dimensions.availableHeight).toBe(300);
    });

    it('should respect 60% adaptive minimum for 800px viewport', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const dimensions = calculateViewportDimensions(true);

      // 800 * 0.6 = 480px (적응형 최소값)
      // 800 - 80(toolbar) - 16(padding) = 704px
      // 480px < 704px이므로 704px 반환 예상
      expect(dimensions.availableHeight).toBe(704);
    });
  });

  describe('Hover Zone Height (Sub-Epic 3)', () => {
    it('should calculate 15% of viewport height for 1080p desktop', () => {
      // 1080 * 0.15 = 162px
      const hoverHeight = calculateHoverZoneHeight(1080);
      expect(hoverHeight).toBe(162);
    });

    it('should enforce minimum of 80px for small screens', () => {
      // 400 * 0.15 = 60px < 80px → 80px
      const hoverHeight = calculateHoverZoneHeight(400);
      expect(hoverHeight).toBe(80);
    });

    it('should enforce maximum of 200px for large screens', () => {
      // 2000 * 0.15 = 300px > 200px → 200px
      const hoverHeight = calculateHoverZoneHeight(2000);
      expect(hoverHeight).toBe(200);
    });

    it('should handle tablet viewport (768px)', () => {
      // 768 * 0.15 = 115.2px → 115px
      const hoverHeight = calculateHoverZoneHeight(768);
      expect(hoverHeight).toBe(115);
    });

    it('should handle mobile viewport (667px)', () => {
      // 667 * 0.15 = 100.05px → 100px
      const hoverHeight = calculateHoverZoneHeight(667);
      expect(hoverHeight).toBe(100);
    });

    it('should clamp between 80px and 200px range', () => {
      expect(calculateHoverZoneHeight(500)).toBeGreaterThanOrEqual(80);
      expect(calculateHoverZoneHeight(500)).toBeLessThanOrEqual(200);

      expect(calculateHoverZoneHeight(1500)).toBeGreaterThanOrEqual(80);
      expect(calculateHoverZoneHeight(1500)).toBeLessThanOrEqual(200);
    });
  });
});
