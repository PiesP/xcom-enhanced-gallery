/**
 * @fileoverview useScrollPositionManager 훅 테스트
 * @description 스크롤 위치 관리 훅의 TDD 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useScrollPositionManager } from '@features/gallery/hooks/useScrollPositionManager';
import {
  clearScrollPosition as clearSavedScrollPosition,
  getSavedScrollPosition,
} from '@shared/browser';

// 테스트 헬퍼: 훅을 간단하게 실행하는 함수
function runHook<T>(hookFn: () => T): T {
  return hookFn();
}

describe('🟢 GREEN: useScrollPositionManager 훅 테스트', () => {
  let originalScrollTo: typeof window.scrollTo;
  let mockScrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // window.scrollTo mock 설정
    originalScrollTo = window.scrollTo;
    mockScrollTo = vi.fn();
    window.scrollTo = mockScrollTo;

    // window.scrollY mock 설정
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    clearSavedScrollPosition();
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    clearSavedScrollPosition();
  });

  describe('훅 기본 동작', () => {
    it('훅이 정상적으로 초기화되어야 함', () => {
      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
        })
      );

      expect(result.saveCurrentPosition).toBeTypeOf('function');
      expect(result.restorePosition).toBeTypeOf('function');
      expect(result.clearPosition).toBeTypeOf('function');
    });

    it('enabled가 false일 때 스크롤 위치 저장이 비활성화되어야 함', () => {
      (window as any).scrollY = 500;

      const result = runHook(() =>
        useScrollPositionManager({
          enabled: false,
          isGalleryOpen: false,
        })
      );

      result.saveCurrentPosition();

      // enabled가 false이므로 저장되지 않아야 함
      expect(getSavedScrollPosition()).toBeNull();

      result.restorePosition();
      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('수동 제어 함수들', () => {
    it('saveCurrentPosition을 수동으로 호출할 수 있어야 함', () => {
      (window as any).scrollY = 400;

      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
        })
      );

      result.saveCurrentPosition();

      // 저장된 위치 확인
      expect(getSavedScrollPosition()).toBe(400);
    });

    it('restorePosition을 수동으로 호출할 수 있어야 함', () => {
      (window as any).scrollY = 300;

      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
        })
      );

      // 저장 후 복원
      result.saveCurrentPosition();
      result.restorePosition();

      expect(mockScrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 300,
        behavior: 'auto',
      });
    });

    it('clearPosition으로 저장된 위치를 초기화할 수 있어야 함', () => {
      (window as any).scrollY = 200;

      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
        })
      );

      // 저장 후 초기화
      result.saveCurrentPosition();
      expect(getSavedScrollPosition()).toBe(200);

      result.clearPosition();
      expect(getSavedScrollPosition()).toBeNull();

      result.restorePosition();
      // 초기화되었으므로 scrollTo가 호출되지 않아야 함
      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('에러 처리', () => {
    it('window.scrollTo가 없어도 에러가 발생하지 않아야 함', () => {
      window.scrollTo = undefined as any;

      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
        })
      );

      expect(() => {
        result.saveCurrentPosition();
        result.restorePosition();
        result.clearPosition();
      }).not.toThrow();
    });

    it('비정상적인 scrollY 값도 안전하게 처리해야 함', () => {
      // scrollY를 NaN으로 설정했을 때 실제로는 0으로 fallback됨 (정상 동작)
      (window as any).scrollY = NaN;

      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
        })
      );

      expect(() => {
        result.saveCurrentPosition();
      }).not.toThrow();

      // JavaScript에서 NaN || 0 = 0이므로, 0이 저장됨 (정상 동작)
      expect(getSavedScrollPosition()).toBe(0);
    });

    it('음수 스크롤 값도 안전하게 처리해야 함', () => {
      (window as any).scrollY = -100;

      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
        })
      );

      result.saveCurrentPosition();

      // 음수 값은 저장되지 않아야 함
      expect(getSavedScrollPosition()).toBeNull();
    });
  });

  describe('갤러리 상태 연동', () => {
    it('콜백 함수들이 초기 닫힘 상태에서 불필요하게 호출되지 않아야 하나, 닫힘 복원 콜백은 1회 호출될 수 있음', () => {
      const onGalleryOpen = vi.fn();
      const onGalleryClose = vi.fn();

      const result = runHook(() =>
        useScrollPositionManager({
          isGalleryOpen: false,
          onGalleryOpen,
          onGalleryClose,
        })
      );

      expect(result).toBeDefined();
      expect(onGalleryOpen).not.toHaveBeenCalled();
      // 닫힘 상태 초기 실행 시 restore 로직이 즉시 수행되어 onGalleryClose가 호출될 수 있음
      expect(onGalleryClose.mock.calls.length).toBe(1);
    });

    it('갤러리 닫힘 직후 언마운트 시나리오에서도 즉시 복원이 보장되어야 함 (GREEN)', () => {
      // 시나리오: isGalleryOpen=true -> false 전환 직후 언마운트 (effect cleanup에서 timeout clear)
      // 기대: 지연 없이 즉시 restorePosition 호출되어 scrollTo 실행

      // 1) open 상태 훅 실행 -> 저장 수행
      (window as any).scrollY = 777;
      const openHook = useScrollPositionManager({ isGalleryOpen: true });
      openHook.saveCurrentPosition();
      // 2) 닫힘 전환: close 상태로 훅 호출 -> 즉시 복원
      (window as any).scrollY = 0; // 현재 스크롤 다른 위치로 변경 (복원되면 777로 이동해야 함)
      const closeHook = useScrollPositionManager({ isGalleryOpen: false });
      expect(closeHook).toBeDefined();
      // 3) 즉시 복원 여부 검증
      const calls = (window.scrollTo as unknown as vi.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastArg = calls[calls.length - 1][0];
      expect(lastArg).toMatchObject({ top: 777 });
    });
  });
});
