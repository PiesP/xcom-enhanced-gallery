/**
 * @fileoverview RAF Throttle 유틸리티 테스트
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rafThrottle, throttleScroll } from '@shared/utils';

// requestAnimationFrame 모킹
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true,
});

describe('RAF Throttle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockRequestAnimationFrame.mockImplementation((callback: FrameRequestCallback) => {
      return setTimeout(callback, 16) as unknown as number; // 60fps 시뮬레이션
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  describe('rafThrottle', () => {
    it('should call function immediately on first call (leading)', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: true, trailing: false });

      throttled('arg1');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('should call function after RAF on trailing', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: false, trailing: true });

      throttled('arg1');
      throttled('arg2');
      throttled('arg3');

      // 즉시 호출되지 않음
      expect(mockFn).toHaveBeenCalledTimes(0);

      // RAF 콜백 실행
      await vi.runAllTimersAsync();

      // trailing 호출로 마지막 인자가 사용됨
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should support both leading and trailing calls', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: true, trailing: true });

      throttled('arg1');
      throttled('arg2');
      throttled('arg3');

      // leading 호출
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // RAF 콜백 실행
      await vi.runAllTimersAsync();

      // trailing 호출
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg3');
    });

    it('should handle multiple rapid calls correctly', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: true, trailing: true });

      // 연속으로 10번 호출
      for (let i = 0; i < 10; i++) {
        throttled(`arg${i}`);
      }

      // leading 호출만 즉시 실행
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg0');

      // RAF 완료 후 trailing 호출
      await vi.runAllTimersAsync();

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg9');
    });

    it('should handle function execution errors gracefully', async () => {
      const mockFn = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const throttled = rafThrottle(mockFn, { leading: true, trailing: true });

      // 에러가 발생해도 throttle이 계속 동작해야 함
      expect(() => throttled('arg1')).not.toThrow();

      // trailing 호출도 동작해야 함
      throttled('arg2');
      await vi.runAllTimersAsync();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('throttleScroll', () => {
    it('should be a RAF throttle with default options', () => {
      const mockFn = vi.fn();
      const throttled = throttleScroll(mockFn);

      throttled();

      // leading 호출이 기본적으로 활성화되어야 함
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle continuous scroll events properly', async () => {
      const mockFn = vi.fn();
      const throttled = throttleScroll(mockFn);

      // 연속 스크롤 이벤트 시뮬레이션 (긴 연속 스크롤)
      for (let i = 0; i < 20; i++) {
        throttled();
      }

      // leading 호출
      expect(mockFn).toHaveBeenCalledTimes(1);

      // 모든 RAF 완료
      await vi.runAllTimersAsync();

      // trailing 호출도 실행되어야 함 (이벤트 손실 방지)
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance under heavy load', () => {
    it('should maintain performance with 1000+ rapid calls', async () => {
      const mockFn = vi.fn();
      const throttled = rafThrottle(mockFn, { leading: true, trailing: true });

      const startTime = performance.now();

      // 1000번 연속 호출
      for (let i = 0; i < 1000; i++) {
        throttled(`call-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 성능 검증: 1000번 호출이 50ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(50);

      // 함수 호출 횟수 검증
      expect(mockFn).toHaveBeenCalledTimes(1); // leading만

      await vi.runAllTimersAsync();

      expect(mockFn).toHaveBeenCalledTimes(2); // leading + trailing
      expect(mockFn).toHaveBeenLastCalledWith('call-999');
    });
  });
});
