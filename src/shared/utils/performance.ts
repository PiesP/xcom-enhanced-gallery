/**
 * @fileoverview 통합 성능 유틸리티 - TDD GREEN Phase
 * @description 중복된 debounce/throttle 함수들을 통합한 단일 모듈
 * @version 1.0.0 - TDD GREEN Phase
 */

import { logger } from '@shared/logging';

// ================================
// Core Performance Utilities
// ================================

/**
 * 표준 debounce 함수 - 마지막 호출만 실행
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
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
 * 표준 throttle 함수 - leading edge만 실행 (단순화)
 * 유저스크립트 환경에서는 단순한 구현이 더 적합
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>): void => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      try {
        fn(...args);
      } catch (error) {
        logger.warn('Throttle function error:', error);
      }
    }
  };
}

/**
 * requestAnimationFrame 기반 throttle
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>): void => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          try {
            fn(...lastArgs);
          } catch (error) {
            logger.warn('RAF throttle function error:', error);
          }
          lastArgs = null;
        }
      });
    }
  };
}

/**
 * 지연 실행 유틸리티
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================
// Performance Measurement
// ================================

/**
 * 함수 실행 시간 측정
 */
export function measurePerformance<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (label) {
    logger.debug(`${label} took ${end - start}ms`);
  }

  return result;
}

// ================================
// Timer Service (단순화)
// ================================

class SimpleTimerService {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  set(id: string, callback: () => void, delay: number): void {
    this.clear(id);
    const timerId = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);
    this.timers.set(id, timerId);
  }

  clear(id: string): void {
    const timerId = this.timers.get(id);
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete(id);
    }
  }

  clearAll(): void {
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
  }
}

export const TimerService = new SimpleTimerService();
export const globalTimerService = TimerService; // Backward compatibility

// ================================
// Resource Management (단순화)
// ================================

class SimpleResourceService {
  private readonly resources = new Set<() => void>();

  register(cleanup: () => void): void {
    this.resources.add(cleanup);
  }

  release(cleanup: () => void): void {
    this.resources.delete(cleanup);
  }

  releaseAll(): void {
    this.resources.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.warn('Resource cleanup error:', error);
      }
    });
    this.resources.clear();
  }
}

export const ResourceService = new SimpleResourceService();
export const globalResourceService = ResourceService; // Backward compatibility

// Convenience functions
export const registerResource = (cleanup: () => void) => ResourceService.register(cleanup);
export const releaseResource = (cleanup: () => void) => ResourceService.release(cleanup);
export const releaseAllResources = () => ResourceService.releaseAll();

// ================================
// Legacy Aliases (제거 예정)
// ================================

/** @deprecated Use throttle directly */
export const raf = rafThrottle;

/** @deprecated Use rafThrottle directly */
export const throttleScroll = rafThrottle;

// ================================
// Unified Performance Class
// ================================

/**
 * 통합 성능 유틸리티 클래스 (유저스크립트 최적화)
 */
export class Performance {
  static debounce = debounce;
  static throttle = throttle;
  static rafThrottle = rafThrottle;
  static delay = delay;
  static measure = measurePerformance;

  /**
   * 유저스크립트 환경에 최적화된 성능 도구들
   */
  static optimize(
    options: {
      maxFunctionCalls?: number;
      memoryThreshold?: number;
      enableGC?: boolean;
    } = {}
  ) {
    const { maxFunctionCalls = 1000, enableGC = true } = options;
    let functionCallCount = 0;

    return {
      throttle: <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
        return throttle((...args: unknown[]) => {
          if (functionCallCount < maxFunctionCalls) {
            functionCallCount++;
            (fn as (...args: unknown[]) => void)(...args);
          }
        }, delay);
      },

      debounce: <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
        return debounce((...args: unknown[]) => {
          if (functionCallCount < maxFunctionCalls) {
            functionCallCount++;
            (fn as (...args: unknown[]) => void)(...args);
          }
        }, delay);
      },

      cleanup: () => {
        functionCallCount = 0;
        ResourceService.releaseAll();
        TimerService.clearAll();

        if (enableGC && typeof window !== 'undefined' && 'gc' in window) {
          try {
            (window as { gc?: () => void }).gc?.();
          } catch (error) {
            logger.debug('Manual GC not available:', error);
          }
        }
      },

      getFunctionCallCount: () => functionCallCount,
      getMemoryUsage: () => {
        const perf = performance as typeof performance & {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        };

        return perf.memory || null;
      },
    };
  }
}
