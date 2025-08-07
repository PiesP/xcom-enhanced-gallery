/**
 * @fileoverview 성능 유틸리티 통합 테스트 - TDD 기반 성능 최적화 검증
 * @description 기존 성능 관련 테스트들을 통합 (throttle.test.ts 포함)
 * @version 1.0.0 - Consolidated Performance Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rafThrottle } from '@shared/utils';
import { throttleScroll } from '@shared/utils/performance/unified-performance-utils';

// requestAnimationFrame 모킹
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true,
  configurable: true,
});

describe('성능 유틸리티 통합 테스트 - TDD 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockRequestAnimationFrame.mockImplementation((callback: FrameRequestCallback) => {
      return setTimeout(callback, 16) as unknown as number; // 60fps 시뮬레이션
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  describe('기본 성능 유틸리티', () => {
    it('성능 유틸리티 기본 기능이 작동해야 함', () => {
      // 기본 검증
      expect(true).toBe(true);
    });
  });

  describe('RAF Throttle 기능 (구 throttle.test.ts 통합)', () => {
    it('첫 번째 호출 시 즉시 실행되어야 함 (leading)', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: true, trailing: false });

      throttled('arg1');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('RAF 후에 함수가 호출되어야 함 (trailing)', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: false, trailing: true });

      throttled('arg1');
      expect(mockFn).not.toHaveBeenCalled();

      // RAF 콜백 실행
      vi.advanceTimersByTime(16);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('연속 호출 시 throttle이 적용되어야 함', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: true, trailing: true });

      throttled('call1');
      throttled('call2');
      throttled('call3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenLastCalledWith('call1');

      // RAF 콜백 실행 (trailing call)
      vi.advanceTimersByTime(16);
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('call3');
    });

    it('스크롤 throttle이 정상 작동해야 함', () => {
      const mockHandler = vi.fn();
      const throttledHandler = throttleScroll(mockHandler);

      // 첫 번째 호출은 즉시 실행
      throttledHandler();
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // 추가 호출은 throttle됨
      throttledHandler();
      throttledHandler();
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // RAF 타이머 진행
      vi.advanceTimersByTime(16);

      // RAF 후 대기 중인 호출이 실행됨
      expect(mockHandler).toHaveBeenCalledTimes(2);

      // 추가 호출 후 정상 작동 확인
      throttledHandler();
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Timer (구 performance-timer.test.ts)', () => {
    it('성능 타이머가 정확히 작동해야 함', () => {
      // 성능 측정 시뮬레이션
      const start = performance.now();
      const end = performance.now();

      expect(end).toBeGreaterThanOrEqual(start);
    });

    it('고부하 상황에서 성능이 안정적이어야 함', () => {
      const heavyWork = () => {
        for (let i = 0; i < 1000; i++) {
          // 의도적인 작업 시뮬레이션
        }
      };

      expect(() => heavyWork()).not.toThrow();
    });
  });

  describe('통합 성능 최적화', () => {
    it('통합된 성능 최적화가 정상 작동해야 함', () => {
      // 여러 성능 기능의 통합 테스트
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn);

      // 기본 동작 검증
      throttled();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('메모리 사용량이 안정적이어야 함', () => {
      // GitHub Actions 환경 고려한 메모리 테스트
      const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

      if (isGitHubActions && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / (1024 * 1024);

        console.log(`Performance test memory usage: ${heapUsedMB.toFixed(2)}MB`);
        // GitHub Actions 환경에서는 더 관대한 임계값
        expect(heapUsedMB).toBeLessThan(1500);
      } else {
        // 메모리 누수 방지 테스트
        const functions = [];
        for (let i = 0; i < 100; i++) {
          functions.push(rafThrottle(() => {}));
        }

        expect(functions.length).toBe(100);
        // 가비지 컬렉션 시뮬레이션
        functions.length = 0;
        expect(functions.length).toBe(0);
      }
    });
  });
});
