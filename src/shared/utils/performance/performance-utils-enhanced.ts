/**
 * @fileoverview 통합 성능 유틸리티 클래스
 * @description 중복된 throttle/debounce 구현들을 통합하는 단일 진실 공급원
 * @version 1.0.0 - TDD Phase GREEN
 */

import { logger } from '@shared/logging/logger';

/**
 * 통합 성능 유틸리티 클래스
 *
 * 기존 중복 위치들:
 * - src/shared/utils/performance/performance-utils.ts (rafThrottle)
 * - src/shared/utils/performance.ts (throttle)
 * - src/shared/utils/types/index.ts (throttle)
 * - src/shared/utils/timer-management.ts (Debouncer)
 */
export class PerformanceUtils {
  /**
   * RAF 기반 throttle (가장 성능이 좋음)
   * 애니메이션이나 스크롤 이벤트에 최적화
   */
  static rafThrottle<T extends (...args: unknown[]) => void>(
    fn: T,
    options: { leading?: boolean; trailing?: boolean } = {}
  ): T {
    const { leading = true, trailing = true } = options;
    let isThrottled = false;
    let pendingArgs: Parameters<T> | null = null;

    function throttled(...args: Parameters<T>): void {
      pendingArgs = args;

      if (!isThrottled) {
        if (leading) {
          try {
            fn(...args);
          } catch (error) {
            logger.warn('RAF throttle function error:', error);
          }
        }

        isThrottled = true;
        requestAnimationFrame(() => {
          isThrottled = false;
          if (trailing && pendingArgs) {
            try {
              fn(...pendingArgs);
            } catch (error) {
              logger.warn('RAF throttle trailing function error:', error);
            }
          }
          pendingArgs = null;
        });
      }
    }

    return throttled as T;
  }

  /**
   * 시간 기반 표준 throttle
   * 일반적인 이벤트 처리에 사용
   */
  static throttle<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: number | null = null;

    return (...args: Parameters<T>): void => {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        try {
          fn(...args);
        } catch (error) {
          logger.warn('Throttle function error:', error);
        }
      } else if (!timeoutId) {
        timeoutId = window.setTimeout(
          () => {
            lastCall = Date.now();
            timeoutId = null;
            try {
              fn(...args);
            } catch (error) {
              logger.warn('Throttle delayed function error:', error);
            }
          },
          delay - (now - lastCall)
        );
      }
    };
  }

  /**
   * Debounce 구현
   * 연속된 호출을 지연
   */
  static debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;

    return (...args: Parameters<T>): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        try {
          fn(...args);
        } catch (error) {
          logger.warn('Debounce function error:', error);
        }
      }, delay);
    };
  }

  /**
   * Debouncer 클래스 생성
   * 기존 timer-management.ts의 Debouncer와 호환
   */
  static createDebouncer<T extends unknown[] = []>(
    callback: (...args: T) => void,
    delay: number
  ): {
    execute: (...args: T) => void;
    cancel: () => void;
    isPending: () => boolean;
  } {
    let timeoutId: number | null = null;

    return {
      execute: (...args: T): void => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        timeoutId = window.setTimeout(() => {
          timeoutId = null;
          callback(...args);
        }, delay);
      },

      cancel: (): void => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },

      isPending: (): boolean => {
        return timeoutId !== null;
      },
    };
  }

  /**
   * 성능 측정 유틸리티 - 오버로드 지원
   */
  static measurePerformance(): number;
  static measurePerformance(startTime: number): number;
  static measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number };
  static measurePerformance<T>(
    labelOrStartTime?: string | number,
    fn?: () => T
  ): number | { result: T; duration: number } {
    // 시작 시간만 반환하는 경우
    if (labelOrStartTime === undefined) {
      return performance.now();
    }

    // 경과 시간 계산하는 경우
    if (typeof labelOrStartTime === 'number' && fn === undefined) {
      return performance.now() - labelOrStartTime;
    }

    // 함수 실행 시간 측정하는 경우
    if (typeof labelOrStartTime === 'string' && fn) {
      const startTime = performance.now();
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 10) {
        logger.debug(`Performance: ${labelOrStartTime} took ${duration.toFixed(2)}ms`);
      }

      return { result, duration };
    }

    throw new Error('Invalid measurePerformance arguments');
  }
}

// 편의성을 위한 개별 export (기존 코드 호환성)
export const { rafThrottle, throttle, debounce, createDebouncer, measurePerformance } =
  PerformanceUtils;
