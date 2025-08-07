/**
 * @fileoverview 🟢 GREEN: 통합된 성능 유틸리티 - 단일 진실 공급원
 * @description 모든 throttle, debounce, performance utils를 통합한 단일 파일
 * @version 1.0.0 - TDD GREEN Phase
 */

import { logger } from '@shared/logging';

// UI Optimization interfaces (moved from ui-optimizer.ts)
export interface UIPerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  interactionLatency: number;
  scrollPerformance: number;
  imageLoadTime: number;
}

export interface UIOptimizationConfig {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableVirtualScrolling: boolean;
  enableMemoryOptimization: boolean;
  enableAnimationOptimization: boolean;
  performanceTarget: 'performance' | 'quality' | 'balanced';
}

/**
 * REFACTOR: 통합된 성능 유틸리티 클래스 (네이밍 일관성 개선)
 * 모든 성능 관련 기능을 제공하는 단일 진입점
 */
export class PerformanceUtils {
  static throttle = throttle;
  static debounce = debounce;
  static rafThrottle = rafThrottle;
  static delay = delay;
  static measurePerformance = measurePerformance;
  static measurePerformanceAsync = measurePerformanceAsync;
  static createDebouncer = createDebouncer;

  // Timer & Resource 관리 (통합)
  static createTimerService = () => new TimerServiceImpl();
  static getGlobalTimerService = () => globalTimerService;
  static createResourceService = () => new ResourceService();
  static getGlobalResourceService = () => globalResourceService;

  // 유저스크립트 최적화
  static optimizeForUserScript = (
    options: {
      maxFunctionCalls?: number;
      memoryThreshold?: number;
      enableGC?: boolean;
    } = {}
  ): {
    throttle: <T extends (...args: unknown[]) => void>(
      fn: T,
      delay: number
    ) => (...args: unknown[]) => void;
    debounce: <T extends (...args: unknown[]) => void>(
      fn: T,
      delay: number
    ) => (...args: unknown[]) => void;
    cleanup: () => void;
    getFunctionCallCount: () => number;
    getMemoryUsage: () => {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    } | null;
  } => {
    const { maxFunctionCalls = 1000, enableGC = true } = options;

    let functionCallCount = 0;

    // 최적화된 throttle (호출 수 제한)
    const optimizedThrottle = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
      return throttle((...args: unknown[]) => {
        if (functionCallCount < maxFunctionCalls) {
          functionCallCount++;
          (fn as (...args: unknown[]) => void)(...args);
        }
      }, delay);
    };

    // 최적화된 debounce (호출 수 제한)
    const optimizedDebounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
      return debounce((...args: unknown[]) => {
        if (functionCallCount < maxFunctionCalls) {
          functionCallCount++;
          (fn as (...args: unknown[]) => void)(...args);
        }
      }, delay);
    };

    // 정리 함수
    const cleanup = () => {
      functionCallCount = 0;
      globalResourceService.releaseAll();

      if (enableGC && typeof window !== 'undefined' && 'gc' in window) {
        try {
          (window as { gc?: () => void }).gc?.();
        } catch (error) {
          logger.debug('Manual GC not available:', error);
        }
      }
    };

    return {
      throttle: optimizedThrottle,
      debounce: optimizedDebounce,
      cleanup,
      getFunctionCallCount: () => functionCallCount,
      getMemoryUsage: () => {
        // performance.memory는 비표준 API이므로 타입 단언 사용
        const perf = performance as typeof performance & {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        };

        if (typeof performance !== 'undefined' && perf.memory) {
          return perf.memory;
        }
        return null;
      },
    };
  };
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

// =================================
// 추가 호환성 함수들
// =================================

/**
 * 별칭 함수들 (기존 코드 호환성)
 */
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

// TDD Phase 2: GREEN 클래스는 REFACTOR 단계에서 제거됨

// =================================
// UI 최적화 시스템 (ui-optimizer.ts 통합)
// =================================

/**
 * 간소화된 UI 최적화 관리자
 * 유저스크립트 환경에 최적화됨
 */
export class UIOptimizer {
  private readonly metrics: UIPerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    interactionLatency: 0,
    scrollPerformance: 0,
    imageLoadTime: 0,
  };

  private readonly config: UIOptimizationConfig;

  constructor(config: Partial<UIOptimizationConfig> = {}) {
    this.config = {
      enableLazyLoading: true,
      enableImageOptimization: true,
      enableVirtualScrolling: false,
      enableMemoryOptimization: true,
      enableAnimationOptimization: true,
      performanceTarget: 'balanced',
      ...config,
    };
  }

  /**
   * 기본 최적화 적용
   */
  optimize(container?: HTMLElement): void {
    if (this.config.enableMemoryOptimization) {
      this.optimizeMemory();
    }
    if (container && this.config.enableAnimationOptimization) {
      this.optimizeAnimations(container);
    }
  }

  /**
   * 메모리 최적화
   */
  private optimizeMemory(): void {
    globalResourceService.releaseAll();
  }

  /**
   * 애니메이션 최적화 (간소화)
   */
  private optimizeAnimations(container: HTMLElement): void {
    // CSS will-change 속성 최적화
    container.style.willChange = 'transform';

    // 애니메이션 완료 후 정리
    const cleanup = () => {
      container.style.willChange = 'auto';
    };

    globalResourceService.register(`animation-${Date.now()}`, cleanup);
  }

  /**
   * 현재 메트릭 반환
   */
  getMetrics(): UIPerformanceMetrics {
    return { ...this.metrics };
  }
}

// =================================
// REFACTOR: 통합된 성능 시스템 Export
// =================================

// 글로벌 UI 최적화 인스턴스
export const globalUIOptimizer = new UIOptimizer();

// 편의 함수들
export function optimizeUI(container?: HTMLElement): void {
  globalUIOptimizer.optimize(container);
}

export function getUIMetrics(): UIPerformanceMetrics {
  return globalUIOptimizer.getMetrics();
}

// 레거시 호환성 유지 (하위 호환성)
export const UnifiedPerformanceUtils = PerformanceUtils;
