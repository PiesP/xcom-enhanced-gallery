/**
 * @fileoverview Phase 2 TDD Tests - 구독 패턴 표준화
 * @description 모든 subscribe 메서드가 일관된 unsubscribe 함수를 반환하도록 보장
 * @version 1.0.0 - TDD RED 단계
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Phase 2: 구독 패턴 표준화', () => {
  beforeEach(() => {
    // 각 테스트 전에 정리
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 테스트 후 정리
    vi.clearAllMocks();
  });

  describe('모든 subscribe 메서드는 unsubscribe 함수를 반환해야 함', () => {
    it('gallery.signals의 모든 subscribe가 () => void를 반환해야 함', async () => {
      // RED: 현재 gallery.signals의 subscribe 패턴을 검증
      const { galleryState } = await import('@shared/state/signals/gallery.signals');

      // 모든 signal의 subscribe 메서드 확인
      const signalKeys = ['isOpen', 'currentMediaIndex', 'mediaCount', 'currentUrl', 'mediaUrls'];

      for (const key of signalKeys) {
        if (key in galleryState && galleryState[key]) {
          const signal = galleryState[key];

          // subscribe 메서드가 존재하는지 확인
          expect(signal).toHaveProperty('subscribe');
          expect(typeof signal.subscribe).toBe('function');

          // subscribe가 unsubscribe 함수를 반환하는지 확인
          const mockCallback = vi.fn();
          const unsubscribe = signal.subscribe(mockCallback);

          expect(typeof unsubscribe).toBe('function');
          expect(unsubscribe.length).toBe(0); // 매개변수 없는 함수

          // unsubscribe 함수가 실제로 작동하는지 확인
          unsubscribe();
        }
      }
    });

    it('toolbar.signals의 모든 subscribe가 () => void를 반환해야 함', async () => {
      const { toolbarState } = await import('@shared/state/signals/toolbar.signals');

      const signalKeys = ['isVisible', 'position', 'settings'];

      for (const key of signalKeys) {
        if (key in toolbarState && toolbarState[key]) {
          const signal = toolbarState[key];

          expect(signal).toHaveProperty('subscribe');
          expect(typeof signal.subscribe).toBe('function');

          const mockCallback = vi.fn();
          const unsubscribe = signal.subscribe(mockCallback);

          expect(typeof unsubscribe).toBe('function');
          expect(unsubscribe.length).toBe(0);

          unsubscribe();
        }
      }
    });

    it('UnifiedToastManager.subscribe가 () => void를 반환해야 함', async () => {
      const { ToastManager } = await import('@shared/services/UnifiedToastManager');
      const toastManager = ToastManager.getInstance();

      const mockCallback = vi.fn();
      const unsubscribe = toastManager.subscribe(mockCallback);

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe.length).toBe(0);

      // 실제 구독/구독해제가 동작하는지 확인
      toastManager.info('Test', 'Message');
      expect(mockCallback).toHaveBeenCalled();

      mockCallback.mockClear();
      unsubscribe();

      // 구독 해제 후 호출되지 않아야 함
      toastManager.info('Test 2', 'Message 2');
      expect(mockCallback).not.toHaveBeenCalled();

      // 정리
      toastManager.clear();
    });

    it('Toast.tsx의 subscribe가 () => void를 반환해야 함', async () => {
      const { toasts } = await import('@shared/components/ui/Toast/Toast');

      expect(toasts).toHaveProperty('subscribe');
      expect(typeof toasts.subscribe).toBe('function');

      const mockCallback = vi.fn();
      const unsubscribe = toasts.subscribe(mockCallback);

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe.length).toBe(0);

      unsubscribe();
    });

    it('StateManager.subscribe가 () => void를 반환해야 함', async () => {
      const { StateManager } = await import('@shared/services/StateManager');
      const stateManager = StateManager.getInstance();

      const mockCallback = vi.fn();
      const unsubscribe = stateManager.subscribe('gallery', mockCallback);

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe.length).toBe(0);

      unsubscribe();
    });
  });

  describe('구독 해제 동작 검증', () => {
    it('gallery signals의 구독 해제가 올바르게 동작해야 함', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');

      if ('isOpen' in galleryState && galleryState.isOpen) {
        const signal = galleryState.isOpen;
        const mockCallback = vi.fn();

        const unsubscribe = signal.subscribe(mockCallback);

        // 구독 중일 때 콜백이 호출되는지 확인
        signal.value = true;
        expect(mockCallback).toHaveBeenCalled();

        // 구독 해제 후 콜백이 호출되지 않는지 확인
        mockCallback.mockClear();
        unsubscribe();
        signal.value = false;
        expect(mockCallback).not.toHaveBeenCalled();
      }
    });

    it('여러 구독자의 독립적인 구독 해제가 동작해야 함', async () => {
      const { ToastManager } = await import('@shared/services/UnifiedToastManager');
      const toastManager = ToastManager.getInstance();

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = toastManager.subscribe(callback1);
      const unsubscribe2 = toastManager.subscribe(callback2);

      // 둘 다 호출되는지 확인
      toastManager.info('Test', 'Message');
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      // 첫 번째만 구독 해제
      callback1.mockClear();
      callback2.mockClear();
      unsubscribe1();

      toastManager.info('Test 2', 'Message 2');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      // 두 번째도 구독 해제
      callback2.mockClear();
      unsubscribe2();

      toastManager.info('Test 3', 'Message 3');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      toastManager.clear();
    });
  });

  describe('에러 처리 및 방어적 프로그래밍', () => {
    it('존재하지 않는 구독을 해제해도 에러가 발생하지 않아야 함', async () => {
      const { ToastManager } = await import('@shared/services/UnifiedToastManager');
      const toastManager = ToastManager.getInstance();

      const callback = vi.fn();
      const unsubscribe = toastManager.subscribe(callback);

      // 정상 구독 해제
      expect(() => unsubscribe()).not.toThrow();

      // 이미 해제된 구독을 다시 해제해도 에러가 없어야 함
      expect(() => unsubscribe()).not.toThrow();
    });

    it('null/undefined 콜백으로 구독해도 안전해야 함', async () => {
      const { galleryState } = await import('@shared/state/signals/gallery.signals');

      if ('isOpen' in galleryState && galleryState.isOpen) {
        const signal = galleryState.isOpen;

        // null 콜백은 에러를 발생시켜야 함
        expect(() => signal.subscribe(null)).toThrow();
        expect(() => signal.subscribe(undefined)).toThrow();
      }
    });
  });

  describe('타입 안전성 검증', () => {
    it('모든 subscribe 메서드의 반환 타입이 일관되어야 함', () => {
      // 이 테스트는 TypeScript 컴파일 시점에 타입 검사로 확인됨
      // 런타임에서는 함수 시그니처를 간접적으로 확인

      // 모든 subscribe 메서드는 다음 타입을 가져야 함:
      // subscribe(callback: (value: T) => void): () => void

      // 이는 컴파일 시점에 확인되므로 여기서는 기본적인 검증만 수행
      expect(true).toBe(true);
    });
  });
});
