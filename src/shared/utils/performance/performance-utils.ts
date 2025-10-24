/**
 * @fileoverview Performance Utilities - Phase 5 Bundle Optimization
 * @version 1.0.0
 *
 * 별도 모듈로 분리된 성능 관련 유틸리티들
 * Tree-shaking 최적화를 위해 독립적인 모듈로 분리
 */

import { logger } from '../../logging/logger';

/**
 * 디바운서 클래스 - 중복 실행 방지
 * @template T - 함수 매개변수 타입
 * @description 지정된 지연 시간 동안 중복 실행을 방지하고, 마지막 호출만 실행
 * @example
 * ```typescript
 * const debouncer = new Debouncer(() => autoSave(), 1000);
 * input.addEventListener('input', () => debouncer.execute());
 * debouncer.flush(); // 즉시 실행
 * ```
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;

  /**
   * @param fn - 실행할 함수
   * @param delay - 지연 시간 (밀리초)
   */
  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  /**
   * 함수 실행 예약
   * @param args - 함수에 전달할 인수
   */
  execute(...args: T): void {
    this.lastArgs = args;
    this.clearTimer();
    this.timerId = Number(
      globalThis.setTimeout(() => {
        if (this.lastArgs) {
          this.fn(...this.lastArgs);
          this.lastArgs = null;
        }
      }, this.delay)
    );
  }

  /**
   * 대기 중인 함수 즉시 실행
   */
  flush(): void {
    if (this.lastArgs) {
      this.clearTimer();
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  /**
   * 대기 중인 함수 취소
   */
  cancel(): void {
    this.clearTimer();
    this.lastArgs = null;
  }

  /**
   * 대기 중인 작업 여부 확인
   * @returns 대기 중이면 true
   */
  isPending(): boolean {
    return this.timerId !== null;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      globalThis.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * 디바운서 팩토리 함수
 * @template T - 함수 매개변수 타입
 * @param fn - 디바운싱할 함수
 * @param delay - 지연 시간 (밀리초)
 * @returns Debouncer 인스턴스
 * @example
 * ```typescript
 * const debouncer = createDebouncer(() => console.log('done'), 500);
 * debouncer.execute();
 * ```
 */
export function createDebouncer<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(fn, delay);
}

/**
 * RAF 기반 throttle (성능 최적화)
 * @template T - 함수 타입
 * @param fn - Throttle할 함수
 * @param options - Throttle 옵션 (leading, trailing)
 * @returns Throttle된 함수
 * @description requestAnimationFrame을 사용한 고성능 throttle
 * @example
 * ```typescript
 * const handleScroll = rafThrottle(() => {
 *   console.log('scrolling...');
 * }, { leading: true, trailing: true });
 * window.addEventListener('scroll', handleScroll);
 * ```
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
 * @template T - 함수 타입
 * @param func - Throttle할 함수
 * @returns Throttle된 함수
 * @description leading과 trailing 모두 활성화된 RAF throttle
 */
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  return rafThrottle(func, { leading: true, trailing: true });
}

/**
 * 동기 함수 성능 측정
 * @template T - 함수 반환값 타입
 * @param label - 성능 측정 라벨
 * @param fn - 측정할 함수
 * @returns 결과와 소요 시간 (밀리초)
 * @example
 * ```typescript
 * const { result, duration } = measurePerformance('parse', () => JSON.parse(data));
 * console.log(`Parse took ${duration}ms`);
 * ```
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
 * 비동기 함수 성능 측정
 * @template T - 함수 반환값 타입
 * @param label - 성능 측정 라벨
 * @param fn - 측정할 비동기 함수
 * @returns 결과와 소요 시간 (밀리초)
 * @example
 * ```typescript
 * const { result, duration } = await measureAsyncPerformance('fetch', () => fetch(url));
 * ```
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
