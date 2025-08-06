/**
 * @fileoverview TDD Priority 2: 성능 유틸리티     it('통합된 debounce 구현이 정상 작동한다', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // 빠르게 여러 번 호출
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // 아직 실행되지 않음
      expect(mockFn).toHaveBeenCalledTimes(0);

      // 지연 시간 후 마지막 호출만 실행
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });ase
 * @description throttle/debounce/rafThrottle 통합 완료 검증
 * @version 1.0.0 - TDD GREEN Phase
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PerformanceUtils,
  rafThrottle,
  throttle,
  debounce,
  createDebouncer,
} from '@shared/utils/performance/unified-performance-utils';

describe('� GREEN Phase: 성능 유틸리티 통합 완료', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('통합된 성능 유틸리티 기능 검증', () => {
    it('통합된 throttle 구현이 정상 작동한다', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      // 빠르게 여러 번 호출
      throttledFn();
      throttledFn();
      throttledFn();

      // 첫 번째 호출만 즉시 실행
      expect(mockFn).toHaveBeenCalledTimes(1);

      // delay 시간 후 마지막 호출이 실행됨 (leading + trailing 패턴)
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('통합된 debounce 구현이 정상 작동한다', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // 빠르게 여러 번 호출
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // 지연 시간 전에는 실행되지 않음
      expect(mockFn).not.toHaveBeenCalled();

      // 지연 시간 후 마지막 호출만 실행
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('rafThrottle이 RAF 기반으로 작동한다', () => {
      const mockFn = vi.fn();
      const rafThrottledFn = rafThrottle(mockFn);

      // RAF mock 설정
      global.requestAnimationFrame = vi.fn(cb => {
        setTimeout(cb, 16); // 60fps 시뮬레이션
        return 1;
      });

      rafThrottledFn();
      rafThrottledFn();
      rafThrottledFn();

      // leading=true이므로 첫 번째 호출은 즉시 실행
      expect(mockFn).toHaveBeenCalledTimes(1);

      // RAF 시뮬레이션 (16ms 후) - trailing이 실행됨
      vi.advanceTimersByTime(16);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('PerformanceUtils에서 모든 성능 함수를 제공한다', () => {
      // 클래스에 모든 메서드가 존재하는지 확인
      expect(typeof PerformanceUtils.rafThrottle).toBe('function');
      expect(typeof PerformanceUtils.throttle).toBe('function');
      expect(typeof PerformanceUtils.debounce).toBe('function');
      expect(typeof PerformanceUtils.measurePerformance).toBe('function');

      // 개별 export도 확인
      expect(typeof rafThrottle).toBe('function');
      expect(typeof throttle).toBe('function');
      expect(typeof debounce).toBe('function');
      expect(typeof createDebouncer).toBe('function');
    });
  });

  describe('성능 요구사항 충족', () => {
    it('throttle 함수 실행 오버헤드가 최소화된다', () => {
      const mockFn = vi.fn();
      const startTime = performance.now();

      const throttledFn = throttle(mockFn, 100);

      const endTime = performance.now();
      const overhead = endTime - startTime;

      // 함수 생성 오버헤드가 1ms 미만
      expect(overhead).toBeLessThan(1);
    });

    it('debounce 함수가 정확한 지연시간을 보장한다', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 200);

      debouncedFn();

      // 정확히 200ms 전에는 실행되지 않음
      vi.advanceTimersByTime(199);
      expect(mockFn).not.toHaveBeenCalled();

      // 200ms 후 정확히 실행
      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('성능 측정 함수가 정확한 시간을 반환한다', () => {
      // 이 테스트만 real timers 사용
      vi.useRealTimers();

      const result = PerformanceUtils.measurePerformance('test-operation', () => {
        // 시뮬레이션된 작업
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('result');
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThan(0);

      // fake timers로 복구
      vi.useFakeTimers();
    });
  });

  describe('호환성 요구사항 충족', () => {
    it('기존 throttle 사용 패턴이 호환된다', () => {
      const mockFn = vi.fn();

      // 기본 사용법
      const throttledFn1 = throttle(mockFn, 100);
      expect(typeof throttledFn1).toBe('function');

      // 클래스 메서드로 사용
      const throttledFn2 = PerformanceUtils.throttle(mockFn, 100);
      expect(typeof throttledFn2).toBe('function');
    });

    it('createDebouncer 팩토리 함수가 작동한다', () => {
      const mockFn = vi.fn();
      const debouncerInstance = createDebouncer(mockFn, 100);

      expect(debouncerInstance).toHaveProperty('execute');
      expect(typeof debouncerInstance.execute).toBe('function');
      expect(typeof debouncerInstance.cancel).toBe('function');
      expect(typeof debouncerInstance.isPending).toBe('function');

      // 기능 테스트
      debouncerInstance.execute();
      expect(debouncerInstance.isPending()).toBe(true);

      debouncerInstance.cancel();
      expect(debouncerInstance.isPending()).toBe(false);
    });

    it('rafThrottle 옵션이 정상 작동한다', () => {
      const mockFn = vi.fn();

      // leading: false 옵션
      const throttledFn = rafThrottle(mockFn, { leading: false, trailing: true });

      throttledFn();
      expect(mockFn).not.toHaveBeenCalled(); // leading: false이므로 즉시 실행 안됨

      global.requestAnimationFrame = vi.fn(cb => {
        setTimeout(cb, 16);
        return 1;
      });

      vi.advanceTimersByTime(16);
      expect(mockFn).toHaveBeenCalledTimes(1); // trailing: true이므로 나중에 실행
    });
  });
});
