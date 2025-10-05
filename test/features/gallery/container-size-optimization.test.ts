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
    it('should calculate available viewport height excluding toolbar', () => {
      const dimensions = calculateViewportDimensions(true);

      const expectedAvailableHeight = window.innerHeight - DEFAULT_TOOLBAR_HEIGHT;

      expect(dimensions.availableHeight).toBe(expectedAvailableHeight);
      expect(dimensions.toolbarHeight).toBe(DEFAULT_TOOLBAR_HEIGHT);
      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
    });

    it('should respect minimum media height for small screens', () => {
      // 작은 화면 시뮬레이션
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const dimensions = calculateViewportDimensions(true);

      // 툴바가 있어도 최소 400px 미디어 영역 확보
      expect(dimensions.availableHeight).toBeGreaterThanOrEqual(MIN_MEDIA_HEIGHT);
    });

    it('should adjust toolbar height based on visibility', () => {
      // 툴바 표시 상태
      const visibleDimensions = calculateViewportDimensions(true);

      // 툴바 숨김 상태
      const hiddenDimensions = calculateViewportDimensions(false);

      // 툴바 표시 시 가용 높이 감소
      expect(visibleDimensions.availableHeight).toBe(1000); // 1080 - 80
      expect(visibleDimensions.toolbarHeight).toBe(DEFAULT_TOOLBAR_HEIGHT);

      // 툴바 숨김 시 전체 높이 사용
      expect(hiddenDimensions.availableHeight).toBe(1080);
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
      expect(dimensions.availableHeight).toBe(1000); // 1080 - 80
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
      expect(dimensions.availableHeight).toBeGreaterThanOrEqual(MIN_MEDIA_HEIGHT);
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

      // 작은 화면에서도 최소 미디어 영역 확보
      expect(dimensions.availableHeight).toBeGreaterThanOrEqual(MIN_MEDIA_HEIGHT);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle zero or negative toolbar height gracefully', () => {
      document.documentElement.style.setProperty('--xeg-toolbar-height', '0px');

      const dimensions = calculateViewportDimensions(true);

      // 0px 툴바는 기본값 사용
      expect(dimensions.availableHeight).toBe(1080);
      expect(dimensions.toolbarHeight).toBe(0);
    });

    it('should clamp available height to positive values', () => {
      // 비정상적으로 큰 툴바 높이
      document.documentElement.style.setProperty('--xeg-toolbar-height', '2000px');

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const dimensions = calculateViewportDimensions(true);

      // 음수가 되더라도 최소 높이 보장
      expect(dimensions.availableHeight).toBeGreaterThanOrEqual(MIN_MEDIA_HEIGHT);
    });

    it('should use default toolbar height if CSS variable is invalid', () => {
      document.documentElement.style.setProperty('--xeg-toolbar-height', 'invalid');

      const dimensions = calculateViewportDimensions(true);

      expect(dimensions.toolbarHeight).toBe(DEFAULT_TOOLBAR_HEIGHT);
    });
  });
});
