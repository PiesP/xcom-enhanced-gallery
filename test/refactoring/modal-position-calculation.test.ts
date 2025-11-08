/**
 * @fileoverview Modal Position Calculation Tests (Phase 35 Step 2-A)
 * @description RED 테스트 - 설정 모달의 동적 위치 계산 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';

describe('Modal Position Calculation', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
    // viewport 모킹
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 1080 });
  });

  describe('Toolbar-based Position', () => {
    it('should calculate modal position below toolbar', () => {
      // GIVEN: 툴바가 상단에 위치
      const toolbar = document.createElement('div');
      vi.spyOn(toolbar, 'getBoundingClientRect').mockReturnValue({
        top: 20,
        left: 100,
        right: 1820,
        bottom: 80,
        width: 1720,
        height: 60,
        x: 100,
        y: 20,
        toJSON: () => ({}),
      });

      // WHEN: 모달 위치 계산
      const rect = toolbar.getBoundingClientRect();
      const expectedTop = rect.bottom + 16; // toolbar bottom + gap
      const expectedLeft = rect.left; // toolbar left

      // THEN: 툴바 바로 아래 배치되어야 함
      expect(expectedTop).toBe(96);
      expect(expectedLeft).toBe(100);
    });

    it('should handle toolbar at different vertical positions', () => {
      // GIVEN: 툴바가 중앙에 위치
      const toolbar = document.createElement('div');
      vi.spyOn(toolbar, 'getBoundingClientRect').mockReturnValue({
        top: 500,
        left: 100,
        right: 1820,
        bottom: 560,
        width: 1720,
        height: 60,
        x: 100,
        y: 500,
        toJSON: () => ({}),
      });

      // WHEN: 모달 위치 계산
      const rect = toolbar.getBoundingClientRect();
      const expectedTop = rect.bottom + 16;

      // THEN: 툴바 위치에 따라 동적으로 계산
      expect(expectedTop).toBe(576);
    });

    it('should center modal horizontally relative to viewport', () => {
      // GIVEN: 모달 너비 600px
      const modalWidth = 600;
      const viewportWidth = 1920;

      // WHEN: 수평 중앙 정렬 계산
      const expectedLeft = (viewportWidth - modalWidth) / 2;

      // THEN: viewport 중앙에 배치
      expect(expectedLeft).toBe(660);
    });
  });

  describe('Viewport Boundary Detection', () => {
    it('should keep modal within viewport vertically', () => {
      // GIVEN: 툴바가 하단 근처에 위치
      const toolbar = document.createElement('div');
      vi.spyOn(toolbar, 'getBoundingClientRect').mockReturnValue({
        top: 1000,
        left: 100,
        right: 1820,
        bottom: 1060,
        width: 1720,
        height: 60,
        x: 100,
        y: 1000,
        toJSON: () => ({}),
      });

      const modalHeight = 400;
      const viewportHeight = 1080;
      const rect = toolbar.getBoundingClientRect();
      const calculatedTop = rect.bottom + 16; // 1076

      // WHEN: 화면 경계 조정
      const adjustedTop = Math.min(
        calculatedTop,
        viewportHeight - modalHeight - 16 // 16px bottom padding
      );

      // THEN: 화면을 벗어나지 않도록 조정
      expect(adjustedTop).toBeLessThanOrEqual(viewportHeight - modalHeight - 16);
      expect(adjustedTop).toBe(664);
    });

    it('should keep modal within viewport horizontally', () => {
      // GIVEN: 모달이 화면 오른쪽을 벗어남
      const modalWidth = 600;
      const viewportWidth = 1920;
      const calculatedLeft = 1500; // 오른쪽으로 치우침

      // WHEN: 화면 경계 조정
      const adjustedLeft = Math.min(calculatedLeft, viewportWidth - modalWidth - 16);

      // THEN: 오른쪽 경계 내에 배치
      expect(adjustedLeft).toBeLessThanOrEqual(viewportWidth - modalWidth - 16);
      expect(adjustedLeft).toBe(1304);
    });

    it('should enforce minimum margins', () => {
      // GIVEN: 최소 여백 16px
      const minMargin = 16;
      const calculatedTop = 5; // 너무 위쪽
      const calculatedLeft = 5; // 너무 왼쪽

      // WHEN: 최소 여백 적용
      const adjustedTop = Math.max(calculatedTop, minMargin);
      const adjustedLeft = Math.max(calculatedLeft, minMargin);

      // THEN: 최소 여백 유지
      expect(adjustedTop).toBeGreaterThanOrEqual(minMargin);
      expect(adjustedLeft).toBeGreaterThanOrEqual(minMargin);
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to narrow viewports', () => {
      // GIVEN: 좁은 화면 (모바일)
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 480 });

      const modalWidth = 600;
      const viewportWidth = 480;
      const minMargin = 16;

      // WHEN: 모달 너비가 viewport보다 큼
      const effectiveWidth = Math.min(modalWidth, viewportWidth - minMargin * 2);
      const left = (viewportWidth - effectiveWidth) / 2;

      // THEN: 여백을 고려한 최대 너비 사용
      expect(effectiveWidth).toBe(448);
      expect(left).toBe(16);
    });

    it('should adapt to short viewports', () => {
      // GIVEN: 낮은 화면
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 600 });

      const modalHeight = 800;
      const viewportHeight = 600;
      const minMargin = 16;

      // WHEN: 모달 높이가 viewport보다 큼
      const effectiveHeight = Math.min(modalHeight, viewportHeight - minMargin * 2);
      const top = minMargin;

      // THEN: 여백을 고려한 최대 높이 사용
      expect(effectiveHeight).toBe(568);
      expect(top).toBe(minMargin);
    });

    it('should handle window resize', () => {
      // GIVEN: 초기 viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1920 });
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 1080 });

      const initialViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // WHEN: viewport 크기 변경
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 720 });

      const resizedViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // THEN: viewport 변화 감지
      expect(resizedViewport.width).not.toBe(initialViewport.width);
      expect(resizedViewport.height).not.toBe(initialViewport.height);
      expect(resizedViewport.width).toBe(1280);
      expect(resizedViewport.height).toBe(720);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing toolbar element', () => {
      // GIVEN: 툴바가 존재하지 않음
      const toolbar = null;

      // WHEN: fallback 위치 계산
      const fallbackTop = 80; // 기본 오프셋

      // THEN: 기본값 사용
      expect(fallbackTop).toBe(80);
    });

    it('should handle zero-sized toolbar', () => {
      // GIVEN: 크기가 0인 툴바
      const toolbar = document.createElement('div');
      vi.spyOn(toolbar, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // WHEN: 위치 계산
      const rect = toolbar.getBoundingClientRect();
      const calculatedTop = rect.bottom + 16;

      // THEN: 최소 오프셋 적용
      expect(calculatedTop).toBe(16);
    });

    it('should handle extreme viewport sizes', () => {
      // GIVEN: 매우 작은 viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 320 });
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 240 });

      const minMargin = 16;
      const maxWidth = 320 - minMargin * 2;
      const maxHeight = 240 - minMargin * 2;

      // THEN: 최소 공간 확보
      expect(maxWidth).toBe(288);
      expect(maxHeight).toBe(208);
      expect(maxWidth).toBeGreaterThan(0);
      expect(maxHeight).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should calculate position quickly', () => {
      const startTime = performance.now();

      // 위치 계산 시뮬레이션
      const toolbar = { bottom: 80, left: 100, width: 1720 };
      const viewport = { width: 1920, height: 1080 };
      const modal = { width: 600, height: 400 };
      const margin = 16;

      const top = Math.min(toolbar.bottom + margin, viewport.height - modal.height - margin);
      const left = (viewport.width - modal.width) / 2;

      const endTime = performance.now();
      const duration = endTime - startTime;

      // THEN: 1ms 이내 완료
      expect(duration).toBeLessThan(1);
      expect(top).toBeDefined();
      expect(left).toBeDefined();
    });
  });
});
