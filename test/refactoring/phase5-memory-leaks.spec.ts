/**
 * @fileoverview Phase 5: 메모리 및 구독 누수 방지 테스트
 * TDD RED 단계 - 메모리 관리 및 구독 정리 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 메모리 누수 추적을 위한 모킹
vi.mock('@shared/external/vendors', () => {
  let subscriptionCount = 0;
  let unsubscribeCallCount = 0;
  const subscriptions = new Map();

  const mockSignal = vi.fn(initialValue => {
    let currentValue = initialValue;

    return {
      get value() {
        return currentValue;
      },
      set value(newValue) {
        currentValue = newValue;
      },
    };
  });

  const mockEffect = vi.fn(callback => {
    const subscriptionId = ++subscriptionCount;
    subscriptions.set(subscriptionId, true);

    callback(); // 초기 실행

    // unsubscribe 함수 반환
    return () => {
      if (subscriptions.get(subscriptionId)) {
        subscriptions.set(subscriptionId, false);
        unsubscribeCallCount++;
      }
    };
  });

  const mockBatch = vi.fn(callback => {
    callback();
  });

  return {
    getPreactSignals: () => ({
      signal: mockSignal,
      effect: mockEffect,
      batch: mockBatch,
    }),
    // 테스트용 추적 함수들
    getSubscriptionCount: () => subscriptionCount,
    getUnsubscribeCallCount: () => unsubscribeCallCount,
    getActiveSubscriptions: () => {
      return Array.from(subscriptions.entries()).filter(([, active]) => active).length;
    },
    resetMemoryTracking: () => {
      subscriptionCount = 0;
      unsubscribeCallCount = 0;
      subscriptions.clear();
    },
  };
});

// Core services 모킹
vi.mock('@shared/services/core-services', () => ({
  defaultLogger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { galleryState, openGallery, closeGallery } from '@shared/state/signals/gallery.signals';

// 모킹된 함수들에 대한 접근
// @ts-ignore
const { getUnsubscribeCallCount, getActiveSubscriptions, resetMemoryTracking } = await import(
  '@shared/external/vendors'
);

describe('Phase 5: 메모리 및 구독 누수 방지', () => {
  const mockMediaItems = [
    {
      id: '1',
      url: 'https://example.com/image1.jpg',
      type: 'image',
      width: 1920,
      height: 1080,
      filename: 'image1.jpg',
    },
  ];

  beforeEach(() => {
    resetMemoryTracking();

    // 갤러리 상태 초기화
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
  });

  afterEach(() => {
    // 각 테스트 후 정리
    resetMemoryTracking();
  });

  describe('구독 생명주기 관리', () => {
    it('galleryState.subscribe()는 올바른 unsubscribe 함수를 반환해야 함', () => {
      const callback = vi.fn();

      const unsubscribe = galleryState.subscribe(callback);

      // unsubscribe 함수가 반환되어야 함
      expect(typeof unsubscribe).toBe('function');

      // 구독이 활성화되어 있어야 함
      expect(getActiveSubscriptions()).toBeGreaterThan(0);
    });

    it('unsubscribe 호출 시 구독이 정리되어야 함', () => {
      const callback = vi.fn();

      const unsubscribe = galleryState.subscribe(callback);
      const initialActive = getActiveSubscriptions();

      // unsubscribe 호출
      unsubscribe();

      // 구독이 정리되어야 함
      expect(getUnsubscribeCallCount()).toBeGreaterThan(0);
      expect(getActiveSubscriptions()).toBeLessThan(initialActive);
    });

    it('여러 구독의 독립적인 해제가 가능해야 함', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = galleryState.subscribe(callback1);
      const unsubscribe2 = galleryState.subscribe(callback2);

      const initialActive = getActiveSubscriptions();
      expect(initialActive).toBeGreaterThanOrEqual(2);

      // 첫 번째 구독만 해제
      unsubscribe1();

      // 두 번째 구독은 여전히 활성화되어 있어야 함
      expect(getActiveSubscriptions()).toBe(initialActive - 1);

      // 두 번째 구독도 해제
      unsubscribe2();

      // 모든 구독이 해제되어야 함
      expect(getActiveSubscriptions()).toBe(initialActive - 2);
    });
  });

  describe('메모리 누수 방지', () => {
    it('대량 구독 생성 후 정리가 올바르게 동작해야 함', () => {
      const unsubscribeFunctions = [];

      // 100개의 구독 생성
      for (let i = 0; i < 100; i++) {
        const unsubscribe = galleryState.subscribe(() => {});
        unsubscribeFunctions.push(unsubscribe);
      }

      expect(getActiveSubscriptions()).toBeGreaterThanOrEqual(100);

      // 모든 구독 해제
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());

      // 메모리 누수가 없어야 함
      expect(getUnsubscribeCallCount()).toBe(100);
    });

    it('갤러리 열기/닫기 반복 시 메모리 누수가 없어야 함', () => {
      const initialActive = getActiveSubscriptions();

      // 갤러리 열기/닫기를 여러 번 반복
      for (let i = 0; i < 10; i++) {
        openGallery(mockMediaItems, 0);
        closeGallery();
      }

      // 추가 구독이 누적되지 않아야 함
      expect(getActiveSubscriptions()).toBe(initialActive);
    });

    it('컴포넌트 언마운트 시뮬레이션에서 정리가 올바르게 동작해야 함', () => {
      const subscriptions = [];

      // 컴포넌트 마운트 시뮬레이션
      const mountComponent = () => {
        const unsubscribe = galleryState.subscribe(() => {});
        subscriptions.push(unsubscribe);
        return unsubscribe;
      };

      // 여러 컴포넌트 마운트
      for (let i = 0; i < 5; i++) {
        mountComponent();
      }

      const activeBeforeCleanup = getActiveSubscriptions();
      expect(activeBeforeCleanup).toBeGreaterThanOrEqual(5);

      // 컴포넌트 언마운트 시뮬레이션 (모든 구독 해제)
      subscriptions.forEach(unsubscribe => unsubscribe());

      // 모든 구독이 정리되어야 함
      expect(getActiveSubscriptions()).toBe(activeBeforeCleanup - 5);
    });
  });

  describe('에러 핸들링 및 안정성', () => {
    it('잘못된 unsubscribe 호출이 에러를 발생시키지 않아야 함', () => {
      const unsubscribe = galleryState.subscribe(() => {});

      // 정상 호출
      expect(() => unsubscribe()).not.toThrow();

      // 중복 호출이 에러를 발생시키지 않아야 함
      expect(() => unsubscribe()).not.toThrow();
    });

    it('subscribe 콜백에서 발생하는 에러가 시스템을 중단시키지 않아야 함', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error in callback');
      });

      // 에러가 발생하는 콜백을 구독해도 시스템이 안정해야 함
      expect(() => {
        const unsubscribe = galleryState.subscribe(errorCallback);

        // 상태 변경이 에러를 전파하지 않아야 함
        galleryState.value = {
          ...galleryState.value,
          isOpen: true,
        };

        unsubscribe();
      }).not.toThrow();
    });

    it('구독 해제 후 콜백이 더 이상 호출되지 않아야 함', () => {
      const callback = vi.fn();

      const unsubscribe = galleryState.subscribe(callback);

      // 초기 호출이 있었는지 확인
      const initialCallCount = callback.mock.calls.length;

      // 구독 해제
      unsubscribe();

      // 상태 변경
      galleryState.value = {
        ...galleryState.value,
        isOpen: true,
      };

      // 콜백이 더 이상 호출되지 않아야 함
      expect(callback.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('성능 및 확장성', () => {
    it('대량 상태 변경 시 구독 성능이 저하되지 않아야 함', () => {
      const callbacks = [];
      const unsubscribeFunctions = [];

      // 50개의 구독 생성
      for (let i = 0; i < 50; i++) {
        const callback = vi.fn();
        callbacks.push(callback);
        const unsubscribe = galleryState.subscribe(callback);
        unsubscribeFunctions.push(unsubscribe);
      }

      const startTime = Date.now();

      // 100번의 상태 변경
      for (let i = 0; i < 100; i++) {
        galleryState.value = {
          ...galleryState.value,
          currentIndex: i % 10,
        };
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 성능이 합리적인 범위 내에 있어야 함 (1초 미만)
      expect(duration).toBeLessThan(1000);

      // 정리
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    });

    it('메모리 사용량이 선형적으로 증가해야 함', () => {
      const baseline = getActiveSubscriptions();

      // 점진적으로 구독 추가
      const unsubscribeFunctions = [];

      for (let i = 1; i <= 10; i++) {
        const unsubscribe = galleryState.subscribe(() => {});
        unsubscribeFunctions.push(unsubscribe);

        // 활성 구독 수가 예상대로 증가해야 함
        expect(getActiveSubscriptions()).toBe(baseline + i);
      }

      // 정리
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());

      // 원래 상태로 돌아가야 함
      expect(getActiveSubscriptions()).toBe(baseline);
    });
  });
});
