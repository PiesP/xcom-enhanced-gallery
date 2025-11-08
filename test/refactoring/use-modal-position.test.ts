/**
 * @fileoverview use-modal-position Hook Tests
 * @description Phase 35 Step 2-B 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { useModalPosition } from '../../src/shared/hooks/use-modal-position';
import { getSolid } from '../../src/shared/external/vendors';

const { createRoot } = getSolid();

describe('useModalPosition Hook', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 1080 });
  });

  describe('Basic Position Calculation', () => {
    it('should calculate position below toolbar', () => {
      createRoot(dispose => {
        // GIVEN: 툴바 요소 생성
        const toolbar = document.createElement('div');
        document.body.appendChild(toolbar);
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

        // WHEN: 훅 사용
        const position = useModalPosition({
          toolbarRef: toolbar,
          modalSize: { width: 600, height: 400 },
        });

        // THEN: 툴바 아래 + 여백
        const pos = position();
        expect(pos.top).toBe(96); // 80 + 16
        expect(pos.left).toBe(660); // centered (1920 - 600) / 2

        dispose();
      });
    });

    it('should use fallback position when toolbar is missing', () => {
      createRoot(dispose => {
        // GIVEN: 툴바 없음
        const position = useModalPosition({
          toolbarRef: null,
          modalSize: { width: 600, height: 400 },
        });

        // THEN: fallback 위치 사용
        const pos = position();
        expect(pos.top).toBe(80); // fallback
        expect(pos.left).toBe(660); // centered

        dispose();
      });
    });
  });

  describe('Viewport Boundary Handling', () => {
    it('should constrain position within viewport', () => {
      createRoot(dispose => {
        // GIVEN: 툴바가 하단 근처
        const toolbar = document.createElement('div');
        document.body.appendChild(toolbar);
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

        // WHEN: 모달 높이가 화면을 벗어남
        const position = useModalPosition({
          toolbarRef: toolbar,
          modalSize: { width: 600, height: 400 },
        });

        // THEN: 화면 내에 제한
        const pos = position();
        expect(pos.top).toBeLessThanOrEqual(1080 - 400 - 16);

        dispose();
      });
    });
  });

  describe('Horizontal Alignment', () => {
    it('should center horizontally by default', () => {
      createRoot(dispose => {
        const toolbar = document.createElement('div');
        document.body.appendChild(toolbar);
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

        const position = useModalPosition({
          toolbarRef: toolbar,
          modalSize: { width: 600, height: 400 },
          centerHorizontally: true,
        });

        const pos = position();
        expect(pos.left).toBe(660); // (1920 - 600) / 2

        dispose();
      });
    });

    it('should align to toolbar left when not centered', () => {
      createRoot(dispose => {
        const toolbar = document.createElement('div');
        document.body.appendChild(toolbar);
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

        const position = useModalPosition({
          toolbarRef: toolbar,
          modalSize: { width: 600, height: 400 },
          centerHorizontally: false,
        });

        const pos = position();
        expect(pos.left).toBe(100); // toolbar left

        dispose();
      });
    });
  });

  describe('Custom Margin', () => {
    it('should apply custom margin', () => {
      createRoot(dispose => {
        const toolbar = document.createElement('div');
        document.body.appendChild(toolbar);
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

        const position = useModalPosition({
          toolbarRef: toolbar,
          modalSize: { width: 600, height: 400 },
          margin: 32,
        });

        const pos = position();
        expect(pos.top).toBe(112); // 80 + 32

        dispose();
      });
    });
  });
});
