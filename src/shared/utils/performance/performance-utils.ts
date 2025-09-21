/**
 * @fileoverview Performance Utilities - Phase 5 Bundle Optimization
 * @version 1.0.0
 *
 * 별도 모듈로 분리된 성능 관련 유틸리티들
 * Tree-shaking 최적화를 위해 독립적인 모듈로 분리
 */

import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '../timer-management';

/**
 * 디바운서 클래스 - 중복 실행 방지
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;
  private static readonly TIMER_CONTEXT = 'debouncer';

  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  execute(...args: T): void {
    this.lastArgs = args;
    this.clearTimer();
    this.timerId = globalTimerManager.setTimeout(
      () => {
        if (this.lastArgs) {
          this.fn(...this.lastArgs);
          this.lastArgs = null;
        }
      },
      this.delay,
      Debouncer.TIMER_CONTEXT
    );
  }

  flush(): void {
    if (this.lastArgs) {
      this.clearTimer();
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  cancel(): void {
    this.clearTimer();
    this.lastArgs = null;
  }

  isPending(): boolean {
    return this.timerId !== null;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      globalTimerManager.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * 디바운서 팩토리 함수
 */
export function createDebouncer<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(fn, delay);
}

/**
 * RAF 기반 throttle (성능 최적화)
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
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
 * 스크롤 전용 throttle
 */
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  return rafThrottle(func, { leading: true, trailing: true });
}

/**
 * 성능 측정 유틸리티
 */
export function measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 10) {
    logger.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * 비동기 성능 측정
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 10) {
    logger.debug(`Async Performance: ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}
