/**
 * @fileoverview Phase 4: 배치 업데이트 최적화 테스트
 * TDD RED 단계 - 배치 업데이트 성능 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 배치 업데이트 테스트를 위한 모킹
vi.mock('@shared/external/vendors', () => {
  let batchCallCount = 0;
  let signalUpdateCount = 0;

  const mockSignal = vi.fn(initialValue => {
    let currentValue = initialValue;

    return {
      get value() {
        return currentValue;
      },
      set value(newValue) {
        signalUpdateCount++;
        currentValue = newValue;
      },
    };
  });

  const mockBatch = vi.fn(callback => {
    batchCallCount++;
    callback();
  });

  const mockEffect = vi.fn(callback => {
    callback(); // 초기 실행
    return () => {}; // unsubscribe 함수
  });

  return {
    getPreactSignals: () => ({
      signal: mockSignal,
      batch: mockBatch,
      effect: mockEffect,
    }),
    // 테스트용 카운터 접근
    getBatchCallCount: () => batchCallCount,
    getSignalUpdateCount: () => signalUpdateCount,
    resetCounters: () => {
      batchCallCount = 0;
      signalUpdateCount = 0;
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

import {
  openGallery,
  closeGallery,
  setError,
  galleryState,
  setLoading,
  setViewMode,
} from '@shared/state/signals/gallery.signals';

// 모킹된 함수들에 대한 접근
// @ts-ignore
const { getBatchCallCount, getSignalUpdateCount, resetCounters } = await import(
  '@shared/external/vendors'
);

describe('Phase 4: 배치 업데이트 최적화', () => {
  const mockMediaItems = [
    {
      id: '1',
      url: 'https://example.com/image1.jpg',
      type: 'image' as 'image',
      width: 1920,
      height: 1080,
      filename: 'image1.jpg',
    },
    {
      id: '2',
      url: 'https://example.com/image2.jpg',
      type: 'image' as 'image',
      width: 1920,
      height: 1080,
      filename: 'image2.jpg',
    },
  ];

  beforeEach(() => {
    resetCounters();

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

  describe('배치 업데이트 성능 검증', () => {
    it('openGallery에서 여러 상태 변경이 배치로 처리되어야 함', () => {
      // RED: 현재는 batch를 사용하지 않으므로 이 테스트는 실패해야 함
      const initialBatchCount = getBatchCallCount();

      // 타입 안전성을 위한 모킹된 함수 호출
      openGallery(mockMediaItems, 1);

      // batch가 호출되어야 함
      expect(getBatchCallCount()).toBe(initialBatchCount + 1);

      // 상태가 올바르게 설정되어야 함
      expect(galleryState.value.isOpen).toBe(true);
      expect(galleryState.value.mediaItems).toEqual(mockMediaItems);
      expect(galleryState.value.currentIndex).toBe(1);
      expect(galleryState.value.error).toBe(null);
    });

    it('closeGallery에서 여러 상태 리셋이 배치로 처리되어야 함', () => {
      // 먼저 갤러리를 열어둠
      galleryState.value = {
        isOpen: true,
        mediaItems: mockMediaItems,
        currentIndex: 1,
        isLoading: false,
        error: 'some error',
        viewMode: 'vertical',
      };

      resetCounters();
      const initialBatchCount = getBatchCallCount();

      closeGallery();

      // batch가 호출되어야 함
      expect(getBatchCallCount()).toBe(initialBatchCount + 1);

      // 상태가 올바르게 리셋되어야 함
      expect(galleryState.value.isOpen).toBe(false);
      expect(galleryState.value.currentIndex).toBe(0);
      expect(galleryState.value.error).toBe(null);
    });

    it('setError에서 loading과 error 상태가 배치로 처리되어야 함', () => {
      // 로딩 상태로 설정
      galleryState.value = {
        ...galleryState.value,
        isLoading: true,
      };

      resetCounters();
      const initialBatchCount = getBatchCallCount();

      setError('Test error message');

      // batch가 호출되어야 함
      expect(getBatchCallCount()).toBe(initialBatchCount + 1);

      // 상태가 올바르게 설정되어야 함
      expect(galleryState.value.error).toBe('Test error message');
      expect(galleryState.value.isLoading).toBe(false);
    });
  });

  describe('리렌더 최적화 검증', () => {
    it('배치 업데이트를 사용하지 않는 함수는 여러 번의 signal 업데이트가 발생해야 함', () => {
      resetCounters();

      // 개별적으로 상태 변경 (배치 미사용)
      setLoading(true);
      setViewMode('horizontal');
      setLoading(false);

      // 각각 별도의 signal 업데이트가 발생해야 함
      expect(getSignalUpdateCount()).toBeGreaterThanOrEqual(3);
    });

    it('배치 업데이트를 사용하는 함수는 효율적인 업데이트가 발생해야 함', () => {
      resetCounters();

      openGallery(mockMediaItems, 1);

      // batch가 사용되었다면 signal 업데이트는 최적화되어야 함
      const batchCount = getBatchCallCount();
      expect(batchCount).toBeGreaterThan(0);
    });
  });

  describe('성능 메트릭 검증', () => {
    it('복잡한 상태 변경 시나리오에서 batch 사용량을 측정해야 함', () => {
      resetCounters();

      // 복잡한 시나리오: 갤러리 열기 -> 에러 발생 -> 갤러리 닫기
      openGallery(mockMediaItems, 0);
      setError('Network error');
      closeGallery();

      // 각 배치 함수 호출에 대해 batch가 사용되어야 함
      const totalBatchCalls = getBatchCallCount();
      expect(totalBatchCalls).toBeGreaterThanOrEqual(3); // openGallery, setError, closeGallery
    });

    it('상태 변경이 없을 때는 불필요한 업데이트가 발생하지 않아야 함', () => {
      // 동일한 상태로 설정
      galleryState.value = {
        isOpen: false,
        mediaItems: [],
        currentIndex: 0,
        isLoading: false,
        error: null,
        viewMode: 'vertical',
      };

      resetCounters();

      // 동일한 상태로 다시 설정
      closeGallery();

      // 변경이 없으므로 batch는 호출되지만 실제 변경은 최소화되어야 함
      expect(getBatchCallCount()).toBeGreaterThan(0);
    });
  });

  describe('타입 안전성 검증', () => {
    it('배치 업데이트 함수들의 타입이 올바르게 정의되어야 함', () => {
      // TypeScript 컴파일 타임 검증
      expect(() => {
        openGallery(mockMediaItems, 0);
        closeGallery();
        setError('test');
        setError(null);
      }).not.toThrow();
    });

    it('배치 콜백 내에서 발생하는 에러가 적절히 처리되어야 함', () => {
      // 에러 상황에서도 batch가 안전하게 처리되어야 함
      expect(() => {
        openGallery([], -1); // 잘못된 인덱스
        setError(''); // 빈 에러 메시지
        closeGallery();
      }).not.toThrow();
    });
  });
});
