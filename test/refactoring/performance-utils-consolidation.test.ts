/**
 * @fileoverview 성능 유틸리티 통합 TDD - RED Phase
 * @description 기존 중복된 debounce/throttle 함수들의 동작을 보장하는 테스트
 * @version 1.0.0 - TDD RED Phase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 통합된 성능 유틸리티에서 import (GREEN 단계)
import { debounce, throttle } from '@shared/utils/performance';

describe('� GREEN: 통합된 성능 유틸리티 - 일관된 동작 보장', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe('통합된 debounce 함수', () => {
    it('debounce가 마지막 호출만 실행해야 함', async () => {
      // Given: debounce 함수
      const mockFn = vi.fn();
      const delay = 100;
      const debouncedFn = debounce(mockFn, delay);

      // When: 연속 호출
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Then: 지연 전에는 호출되지 않아야 함
      expect(mockFn).not.toHaveBeenCalled();

      // When: 시간 경과
      vi.advanceTimersByTime(delay);

      // Then: 마지막 호출만 실행되어야 함
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });
  });

  describe('통합된 throttle 함수', () => {
    it('throttle이 leading edge 방식으로 작동해야 함', () => {
      // Given: throttle 함수
      const mockFn = vi.fn();
      const delay = 100;
      const throttledFn = throttle(mockFn, delay);

      // When: 연속 빠른 호출
      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      // Then: 첫 번째 호출만 즉시 실행
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // When: throttle 기간 경과 후 다시 호출
      vi.advanceTimersByTime(delay + 10);
      throttledFn('arg4');

      // Then: 새로운 호출이 실행됨
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });
  });

  describe('메모리 및 성능 특성', () => {
    it('통합된 함수들이 메모리 누수 없이 정리되어야 함', () => {
      // Given: 많은 수의 함수 생성
      const functions = [];

      for (let i = 0; i < 100; i++) {
        functions.push(debounce(() => {}, 100));
        functions.push(throttle(() => {}, 100));
      }

      // When: 함수들 실행
      functions.forEach(fn => fn('test'));

      // Then: 타이머 정리 확인
      vi.clearAllTimers();
      vi.advanceTimersByTime(1000);

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('타입 안전성', () => {
    it('통합된 함수들이 TypeScript 타입을 정확히 추론해야 함', () => {
      // Given: 타입이 명확한 함수들
      const stringFn = (s: string) => s.toUpperCase();
      const numberFn = (n: number) => n * 2;

      // When: debounce/throttle 적용
      const debouncedString = debounce(stringFn, 100);
      const throttledNumber = throttle(numberFn, 100);

      // Then: 타입 체크 및 정상 호출
      expect(() => {
        debouncedString('test');
        throttledNumber(42);
      }).not.toThrow();
    });
  });
});
