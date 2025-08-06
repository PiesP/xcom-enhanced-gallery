/**
 * @fileoverview 통합된 성능 최적화 유틸리티
 * @description throttle, debounce, timer, resource 관리를 통합한 성능 유틸리티
 * @version 3.0.0 - Phase 2 통합
 */

import { logger } from '@shared/logging';

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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

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
        timeoutId = setTimeout(
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>): void => {
      if (timeoutId !== null) {
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return {
      execute: (...args: T): void => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
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

// 추가 별칭 함수들 (기존 코드 호환성)
export const createTimerDebouncer = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): Debouncer<T> => new Debouncer(callback, delay);
export const measureAsyncPerformance = measurePerformance;
export const throttleScroll = rafThrottle;

/**
 * Debouncer 클래스 (timer-management.ts 호환)
 * 기존 timer-management.ts의 Debouncer 클래스와 동일한 인터페이스 제공
 */
export class Debouncer<T extends unknown[]> {
  private timerId: number | null = null;
  private readonly delay: number;
  private readonly callback: (...args: T) => void;

  constructor(callback: (...args: T) => void, delay: number) {
    this.callback = callback;
    this.delay = delay;
  }

  execute(...args: T): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    this.timerId = window.setTimeout(() => {
      this.callback(...args);
      this.timerId = null;
    }, this.delay);
  }

  cancel(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  get pending(): boolean {
    return this.timerId !== null;
  }

  // isPending 메서드도 추가 (createDebouncer와 호환)
  isPending(): boolean {
    return this.timerId !== null;
  }
}

/**
 * Timer Handle 인터페이스 (timer-management.ts 호환)
 */
export interface TimerHandle {
  id: number;
  cancel: () => void;
}

/**
 * 타이머 서비스 (timer-management.ts 호환)
 */
class TimerServiceImpl {
  private readonly timers = new Map<number, TimerHandle>();
  private nextId = 1;

  setTimeout(callback: () => void, delay: number): TimerHandle {
    const id = this.nextId++;
    const timerId = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);

    const handle: TimerHandle = {
      id,
      cancel: () => {
        clearTimeout(timerId);
        this.timers.delete(id);
      },
    };

    this.timers.set(id, handle);
    return handle;
  }

  clearAllTimers(): void {
    for (const handle of this.timers.values()) {
      handle.cancel();
    }
    this.timers.clear();
  }

  getActiveTimerCount(): number {
    return this.timers.size;
  }
}

/**
 * Timer Service 인스턴스 (timer-management.ts 호환)
 */
export const TimerService = new TimerServiceImpl();
export const globalTimerService = TimerService;

/**
 * 간단한 지연 실행 (timer-management.ts 호환)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 리소스 타입
 */
export type ResourceType = 'image' | 'audio' | 'video' | 'data' | 'cache' | 'timer' | 'event';

/**
 * 리소스 서비스
 * 애플리케이션 리소스의 생명주기를 관리합니다
 */
export class ResourceService {
  private readonly resources = new Map<string, () => void>();

  /**
   * 리소스 등록
   */
  register(id: string, cleanup: () => void): void {
    this.resources.set(id, cleanup);
  }

  /**
   * 리소스 해제
   */
  release(id: string): boolean {
    const cleanup = this.resources.get(id);
    if (cleanup) {
      try {
        cleanup();
        this.resources.delete(id);
        return true;
      } catch (error) {
        logger.error(`Failed to release resource ${id}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * 모든 리소스 해제
   */
  releaseAll(): void {
    const errors: Error[] = [];

    for (const [id, cleanup] of this.resources) {
      try {
        cleanup();
      } catch (error) {
        logger.error(`Failed to release resource ${id}:`, error);
        errors.push(error as Error);
      }
    }

    this.resources.clear();

    if (errors.length > 0) {
      logger.warn(`Released all resources with ${errors.length} errors`);
    }
  }

  /**
   * 등록된 리소스 개수
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 리소스가 등록되어 있는지 확인
   */
  hasResource(id: string): boolean {
    return this.resources.has(id);
  }
}

/**
 * 글로벌 리소스 매니저
 */
export const globalResourceService = new ResourceService();

/**
 * 편의 함수: 리소스 등록
 */
export function registerResource(id: string, cleanup: () => void): void {
  globalResourceService.register(id, cleanup);
}

/**
 * 편의 함수: 리소스 해제
 */
export function releaseResource(id: string): boolean {
  return globalResourceService.release(id);
}

/**
 * 편의 함수: 모든 리소스 해제
 */
export function releaseAllResources(): void {
  globalResourceService.releaseAll();
}
