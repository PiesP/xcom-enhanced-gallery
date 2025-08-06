/**
 * @fileoverview 🟢 GREEN: 통합된 성능 유틸리티 - 단일 진실 공급원
 * @description 모든 throttle, debounce, performance utils를 통합한 단일 파일
 * @version 1.0.0 - TDD GREEN Phase
 */

import { logger } from '@shared/logging';

/**
 * 호환성을 위한 PerformanceUtils 클래스
 * 이전 코드와의 호환성을 유지하면서 통합된 유틸리티 제공
 */
export class PerformanceUtils {
  static throttle = throttle;
  static debounce = debounce;
  static rafThrottle = rafThrottle;
  static delay = delay;
  static measurePerformance = measurePerformance;
  static measurePerformanceAsync = measurePerformanceAsync;
  static createDebouncer = createDebouncer;
}

/**
 * RAF 기반 throttle (최고 성능)
 * 애니메이션, 스크롤 이벤트에 최적화
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
 * 시간 기반 표준 throttle
 * 일반적인 이벤트 처리에 사용
 */
export function throttle<T extends (...args: unknown[]) => void>(
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
export function debounce<T extends (...args: unknown[]) => void>(
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
 * Debouncer 클래스 생성 팩토리
 */
export function createDebouncer<T extends unknown[] = []>(
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
 * 성능 측정 유틸리티
 */
export function measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  logger.debug(`Performance [${label}]: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * 비동기 성능 측정 유틸리티
 */
export async function measurePerformanceAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  logger.debug(`Performance [${label}]: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * 지연 실행 유틸리티
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =================================
// 이전 버전과의 호환성을 위한 별칭들
// =================================

/**
 * @deprecated rafThrottle을 직접 사용하세요
 */
export const raf = rafThrottle;

/**
 * @deprecated createDebouncer를 사용하세요
 */
export class Debouncer<T extends unknown[] = []> {
  private readonly debouncer: ReturnType<typeof createDebouncer<T>>;

  constructor(callback: (...args: T) => void, delay: number) {
    this.debouncer = createDebouncer(callback, delay);
  }

  execute(...args: T): void {
    this.debouncer.execute(...args);
  }

  cancel(): void {
    this.debouncer.cancel();
  }

  isPending(): boolean {
    return this.debouncer.isPending();
  }
}

// =================================
// 추가 호환성 함수들
// =================================

/**
 * 별칭 함수들 (기존 코드 호환성)
 */
export const createTimerDebouncer = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): Debouncer<T> => new Debouncer(callback, delay);

export const measureAsyncPerformance = measurePerformanceAsync;
export const throttleScroll = rafThrottle;

// =================================
// Timer 관리 시스템 (timer-management.ts 호환)
// =================================

/**
 * Timer Handle 인터페이스
 */
export interface TimerHandle {
  id: number;
  cancel: () => void;
}

/**
 * 타이머 서비스
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
 * Timer Service 인스턴스
 */
export const TimerService = new TimerServiceImpl();
export const globalTimerService = TimerService;

// =================================
// 리소스 관리 시스템
// =================================

/**
 * 리소스 타입
 */
export type ResourceType = 'image' | 'audio' | 'video' | 'data' | 'cache' | 'timer' | 'event';

/**
 * 리소스 서비스
 */
export class ResourceService {
  private readonly resources = new Map<string, () => void>();

  register(id: string, cleanup: () => void): void {
    this.resources.set(id, cleanup);
  }

  release(id: string): boolean {
    const cleanup = this.resources.get(id);
    if (cleanup) {
      try {
        cleanup();
        this.resources.delete(id);
        return true;
      } catch (error) {
        logger.warn(`Failed to release resource ${id}:`, error);
        return false;
      }
    }
    return false;
  }

  releaseAll(): void {
    const errors: Error[] = [];

    for (const [id, cleanup] of this.resources) {
      try {
        cleanup();
      } catch (error) {
        logger.warn(`Failed to release resource ${id}:`, error);
        errors.push(error as Error);
      }
    }

    this.resources.clear();

    if (errors.length > 0) {
      logger.warn(`Released all resources with ${errors.length} errors`);
    }
  }

  getResourceCount(): number {
    return this.resources.size;
  }

  hasResource(id: string): boolean {
    return this.resources.has(id);
  }
}

/**
 * 글로벌 리소스 매니저
 */
export const globalResourceService = new ResourceService();

/**
 * 편의 함수들
 */
export function registerResource(id: string, cleanup: () => void): void {
  globalResourceService.register(id, cleanup);
}

export function releaseResource(id: string): boolean {
  return globalResourceService.release(id);
}

export function releaseAllResources(): void {
  globalResourceService.releaseAll();
}
