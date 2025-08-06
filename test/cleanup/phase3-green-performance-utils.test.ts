/**
 * @fileoverview TDD GREEN Phase: Performance Utils 통합 완료 검증
 * @description 통합된 성능 유틸리티가 올바르게 작동하는지 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  throttle,
  debounce,
  rafThrottle,
  createDebouncer,
  measurePerformance,
  measurePerformanceAsync,
  delay,
  Debouncer,
} from '@shared/utils/performance/unified-performance-utils';

describe('🟢 GREEN Phase: 통합된 Performance Utils 검증', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('throttle 함수', () => {
    it('시간 기반 throttle이 올바르게 작동해야 함', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      // 빠른 연속 호출
      throttledFn();
      throttledFn();
      throttledFn();

      // 즉시 1번 호출
      expect(mockFn).toHaveBeenCalledTimes(1);

      // 100ms 후 trailing 호출
      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('throttle 함수는 에러를 안전하게 처리해야 함', () => {
      const errorFn = vi.fn(() => {
        throw new Error('Test error');
      });
      const throttledFn = throttle(errorFn, 100);

      // 에러가 발생해도 throw하지 않아야 함
      expect(() => throttledFn()).not.toThrow();
      expect(errorFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('debounce 함수', () => {
    it('debounce가 올바르게 작동해야 함', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // 빠른 연속 호출
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // 즉시는 호출되지 않아야 함
      expect(mockFn).not.toHaveBeenCalled();

      // 100ms 후 1번만 호출
      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('debounce 함수는 에러를 안전하게 처리해야 함', () => {
      const errorFn = vi.fn(() => {
        throw new Error('Test error');
      });
      const debouncedFn = debounce(errorFn, 50);

      debouncedFn();
      vi.advanceTimersByTime(100);

      // 에러가 발생해도 로그로만 처리되어야 함
      expect(errorFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('rafThrottle 함수', () => {
    it('RAF 기반 throttle이 올바르게 작동해야 함', () => {
      const mockFn = vi.fn();
      const rafThrottledFn = rafThrottle(mockFn);

      // 빠른 연속 호출
      rafThrottledFn();
      rafThrottledFn();
      rafThrottledFn();

      // leading 호출 확인
      expect(mockFn).toHaveBeenCalledTimes(1);

      // RAF는 mock하기 복잡하므로 기본 동작만 테스트
    });

    it('rafThrottle은 leading/trailing 옵션을 지원해야 함', () => {
      const mockFn = vi.fn();
      const rafThrottledFn = rafThrottle(mockFn, { leading: false, trailing: true });

      rafThrottledFn();

      // leading이 false이므로 즉시 호출되지 않음
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('createDebouncer 팩토리', () => {
    it('debouncer 객체가 올바르게 작동해야 함', () => {
      const mockFn = vi.fn();
      const debouncer = createDebouncer(mockFn, 100);

      debouncer.execute();
      debouncer.execute();

      expect(debouncer.isPending()).toBe(true);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(debouncer.isPending()).toBe(false);
    });

    it('debouncer cancel이 올바르게 작동해야 함', () => {
      const mockFn = vi.fn();
      const debouncer = createDebouncer(mockFn, 100);

      debouncer.execute();
      expect(debouncer.isPending()).toBe(true);

      debouncer.cancel();
      expect(debouncer.isPending()).toBe(false);

      vi.advanceTimersByTime(150);
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('성능 측정 유틸리티', () => {
    it('measurePerformance가 올바르게 작동해야 함', () => {
      vi.useRealTimers(); // 성능 측정은 실제 타이머 필요
      const result = measurePerformance('test', () => {
        return 'test-result';
      });

      expect(result.result).toBe('test-result');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
      vi.useFakeTimers(); // 다시 가짜 타이머로 복구
    });

    it('measurePerformanceAsync가 올바르게 작동해야 함', async () => {
      vi.useRealTimers(); // 성능 측정은 실제 타이머 필요
      const result = await measurePerformanceAsync('test-async', async () => {
        await delay(10);
        return 'async-result';
      });

      expect(result.result).toBe('async-result');
      expect(result.duration).toBeGreaterThan(5); // 최소 시간
      vi.useFakeTimers(); // 다시 가짜 타이머로 복구
    });
  });

  describe('유틸리티 함수', () => {
    it('delay 함수가 올바르게 작동해야 함', async () => {
      vi.useRealTimers(); // delay는 실제 타이머 필요
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // 약간의 오차 허용
      vi.useFakeTimers(); // 다시 가짜 타이머로 복구
    });
  });

  describe('함수 분리 검증', () => {
    it('throttle과 rafThrottle은 서로 다른 함수여야 함', () => {
      expect(throttle).not.toBe(rafThrottle);
      expect(typeof throttle).toBe('function');
      expect(typeof rafThrottle).toBe('function');
    });

    it('debounce와 createDebouncer는 서로 다른 함수여야 함', () => {
      expect(debounce).not.toBe(createDebouncer);
      expect(typeof debounce).toBe('function');
      expect(typeof createDebouncer).toBe('function');
    });
  });

  describe('타입 안전성', () => {
    it('throttle은 타입 안전성을 유지해야 함', () => {
      const typedFn = (x: number, y: string) => `${x}-${y}`;
      const throttledTypedFn = throttle(typedFn, 100);

      // TypeScript 컴파일 타임에 타입 검증됨
      throttledTypedFn(123, 'test');
    });

    it('debounce는 타입 안전성을 유지해야 함', () => {
      const typedFn = (x: number) => x * 2;
      const debouncedTypedFn = debounce(typedFn, 100);

      // TypeScript 컴파일 타임에 타입 검증됨
      debouncedTypedFn(42);
    });

    it('Debouncer 클래스가 정상 작동해야 함', () => {
      const mockFn = vi.fn();
      const debouncer = new Debouncer(mockFn, 100);

      debouncer.execute();
      expect(debouncer.isPending()).toBe(true);

      vi.advanceTimersByTime(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
