/**
 * @fileoverview 통합 성능 유틸리티 서비스
 * @description TDD 기반으로 중복된 성능 관련 기능들을 하나로 통합
 * @version 1.0.0 - GREEN Phase: 중복 통합 완료
 */

import { coreLogger as logger } from '@core/logger';

export interface DebounceOptions {
  immediate?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface RafThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  timestamp: number;
}

/**
 * 통합 성능 유틸리티 서비스 클래스
 * 모든 성능 관련 중복 기능을 하나로 통합
 */
class UnifiedPerformanceService {
  private static instance: UnifiedPerformanceService;
  private readonly metrics = new Map<string, PerformanceMetrics[]>();
  private readonly activeDebounces = new Map<string, number>();
  private readonly activeThrottles = new Map<string, { lastCall: number; timeout?: number }>();
  private readonly performanceMetrics = new Map<string, number>(); // 추가
  private readonly logger = logger; // 기본 로거 사용

  private constructor() {}

  static getInstance(): UnifiedPerformanceService {
    if (!UnifiedPerformanceService.instance) {
      UnifiedPerformanceService.instance = new UnifiedPerformanceService();
    }
    return UnifiedPerformanceService.instance;
  }

  /**
   * 통합된 Debounce 함수 (모든 debounce 구현 통합)
   */
  createDebouncer<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number,
    options: DebounceOptions = {}
  ): (...args: Parameters<T>) => void {
    const { immediate = false, maxWait } = options;
    let timeoutId: number | null = null;
    let maxTimeoutId: number | null = null;
    let lastCallTime = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;

      const executeFunc = () => {
        timeoutId = null;
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
          maxTimeoutId = null;
        }
        lastCallTime = now;
        func.apply(this, args);
      };

      // 즉시 실행 옵션
      if (immediate && !timeoutId) {
        executeFunc();
        return;
      }

      // 기존 타이머 클리어
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 최대 대기 시간 처리
      if (maxWait && !maxTimeoutId && timeSinceLastCall >= maxWait) {
        executeFunc();
        return;
      }

      // 새 타이머 설정
      timeoutId = window.setTimeout(executeFunc, delay);

      // 최대 대기 시간 타이머 설정
      if (maxWait && !maxTimeoutId) {
        maxTimeoutId = window.setTimeout(executeFunc, maxWait);
      }
    };
  }

  /**
   * 통합된 Throttle 함수 (모든 throttle 구현 통합)
   */
  createThrottle<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number,
    options: ThrottleOptions = {}
  ): (...args: Parameters<T>) => void {
    const { leading = true, trailing = true } = options;
    let lastCall = 0;
    let timeoutId: number | null = null;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;

      const executeFunc = () => {
        lastCall = now;
        func.apply(this, args);
      };

      // Leading edge 실행
      if (leading && timeSinceLastCall >= delay) {
        executeFunc();
        return;
      }

      // Trailing edge 처리
      if (trailing) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => {
          if (Date.now() - lastCall >= delay) {
            executeFunc();
          }
          timeoutId = null;
        }, delay - timeSinceLastCall);
      }
    };
  }

  /**
   * RAF 기반 스로틀링 (RAF throttle 통합)
   */
  rafThrottle<T extends (...args: unknown[]) => void>(
    func: T,
    options: RafThrottleOptions = {}
  ): (...args: Parameters<T>) => void {
    const { leading = true, trailing = false } = options;
    let rafId: number | null = null;
    let lastArgs: Parameters<T> | null = null;
    let hasLeadingBeenCalled = false;

    return (...args: Parameters<T>) => {
      lastArgs = args;

      // Leading edge 실행
      if (leading && !hasLeadingBeenCalled && rafId === null) {
        hasLeadingBeenCalled = true;
        try {
          func.apply(this, args);
        } catch (error) {
          // 에러를 조용히 처리하여 throttle이 계속 동작하도록 함
          console.warn('[rafThrottle] Function execution error:', error);
        }
      }

      // 이미 RAF가 예약되어 있으면 return
      if (rafId !== null) {
        return;
      }

      // Trailing edge를 위한 RAF 예약
      if (trailing || (!leading && !hasLeadingBeenCalled)) {
        rafId = requestAnimationFrame(() => {
          if (lastArgs && trailing) {
            try {
              func.apply(this, lastArgs);
            } catch (error) {
              // 에러를 조용히 처리하여 throttle이 계속 동작하도록 함
              console.warn('[rafThrottle] Function execution error:', error);
            }
          }
          rafId = null;
          hasLeadingBeenCalled = false;
          lastArgs = null;
        });
      } else {
        // leading만 활성화된 경우 RAF 후 리셋
        rafId = requestAnimationFrame(() => {
          rafId = null;
          hasLeadingBeenCalled = false;
        });
      }
    };
  }

  /**
   * 유휴 시간 콜백 실행
   */
  runWhenIdle<T extends unknown[]>(
    callback: (...args: T) => void,
    timeout: number = 5000
  ): (...args: T) => void {
    return (...args: T) => {
      if ('requestIdleCallback' in window) {
        (
          window as Window & {
            requestIdleCallback: (callback: () => void, options: { timeout: number }) => void;
          }
        ).requestIdleCallback(() => callback(...args), { timeout });
      } else {
        // 폴백: setTimeout 사용
        setTimeout(() => callback(...args), 0);
      }
    };
  }

  /**
   * 성능 측정 래퍼
   */
  measurePerformance<T extends (...args: unknown[]) => unknown>(
    func: T,
    label: string
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();

      try {
        const result = func.apply(this, args) as ReturnType<T>;

        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();

        const metrics: PerformanceMetrics = {
          executionTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          timestamp: Date.now(),
        };

        this.recordMetrics(label, metrics);

        return result;
      } catch (error) {
        logger.error(
          `[UnifiedPerformanceService] Performance measurement failed for ${label}:`,
          error
        );
        throw error;
      }
    };
  }

  /**
   * 배치 실행 (여러 함수를 효율적으로 실행)
   */
  batchExecute<T>(tasks: Array<() => T>, batchSize: number = 10, delay: number = 0): Promise<T[]> {
    return new Promise(resolve => {
      const results: T[] = [];
      let currentIndex = 0;

      const processBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, tasks.length);

        for (let i = currentIndex; i < endIndex; i++) {
          try {
            const task = tasks[i];
            if (task) {
              results[i] = task();
            }
          } catch (error) {
            logger.error(`[UnifiedPerformanceService] Task ${i} failed:`, error);
            // 오류 발생 시 결과에서 제외 (undefined로 남김)
          }
        }

        currentIndex = endIndex;

        if (currentIndex < tasks.length) {
          setTimeout(processBatch, delay);
        } else {
          resolve(results);
        }
      };

      processBatch();
    });
  }

  /**
   * 메모리 사용량 측정
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (
        (performance as Performance & { memory: { usedJSHeapSize: number } }).memory
          .usedJSHeapSize || 0
      );
    }
    return 0;
  }

  /**
   * 성능 메트릭 기록
   */
  private recordMetrics(label: string, metrics: PerformanceMetrics): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }

    const labelMetrics = this.metrics.get(label)!;
    labelMetrics.push(metrics);

    // 최대 100개 메트릭만 유지
    if (labelMetrics.length > 100) {
      labelMetrics.shift();
    }
  }

  /**
   * 성능 메트릭 조회
   */
  getMetrics(label?: string): Map<string, PerformanceMetrics[]> | PerformanceMetrics[] {
    if (label) {
      return this.metrics.get(label) || [];
    }
    return new Map(this.metrics);
  }

  /**
   * 평균 성능 계산
   */
  getAverageMetrics(label: string): PerformanceMetrics | null {
    const labelMetrics = this.metrics.get(label);
    if (!labelMetrics || labelMetrics.length === 0) {
      return null;
    }

    const avg = labelMetrics.reduce(
      (acc, metric) => ({
        executionTime: acc.executionTime + metric.executionTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        timestamp: Math.max(acc.timestamp, metric.timestamp),
      }),
      { executionTime: 0, memoryUsage: 0, timestamp: 0 }
    );

    return {
      executionTime: avg.executionTime / labelMetrics.length,
      memoryUsage: avg.memoryUsage / labelMetrics.length,
      timestamp: avg.timestamp,
    };
  }

  /**
   * 모든 활성 타이머 정리
   */
  cleanup(): void {
    try {
      // Debounce 타이머 정리
      this.activeDebounces.forEach(timeout => clearTimeout(timeout));
      this.activeDebounces.clear();

      // Throttle 타이머 정리
      this.activeThrottles.forEach(({ timeout }) => {
        if (timeout) clearTimeout(timeout);
      });
      this.activeThrottles.clear();

      // 메트릭 정리
      this.metrics.clear();

      logger.debug('[UnifiedPerformanceService] All timers and metrics cleaned up');
    } catch (error) {
      logger.error('[UnifiedPerformanceService] Failed to cleanup:', error);
    }
  }

  // ================================
  // 누락된 성능 유틸리티 함수들 (호환성)
  // ================================

  /**
   * 스크롤 스로틀링 (RAF 기반) - 이벤트 손실 방지를 위해 leading=true, trailing=true
   */
  throttleScroll<T extends (...args: unknown[]) => void>(fn: T): (...args: Parameters<T>) => void {
    return this.rafThrottle(fn, { leading: true, trailing: true });
  }

  /**
   * 비동기 성능 측정
   */
  async measureAsyncPerformance<T>(label: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const startMark = `${label}-start`;
    const endMark = `${label}-end`;

    try {
      performance.mark(startMark);
      const result = await asyncFn();
      performance.mark(endMark);

      const duration = performance.now() - startTime;
      this.performanceMetrics.set(label, duration);

      this.logger.debug(`[AsyncPerformance] ${label}: ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      performance.mark(endMark);
      const duration = performance.now() - startTime;
      this.logger.warn(`[AsyncPerformance] ${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}

// 전역 인스턴스 및 편의 함수들
export const unifiedPerformanceService = UnifiedPerformanceService.getInstance();

// 편의 함수들 (기존 코드 호환성을 위해)
export const createDebouncer =
  unifiedPerformanceService.createDebouncer.bind(unifiedPerformanceService);
export const createThrottle =
  unifiedPerformanceService.createThrottle.bind(unifiedPerformanceService);
export const rafThrottle = unifiedPerformanceService.rafThrottle.bind(unifiedPerformanceService);
export const runWhenIdle = unifiedPerformanceService.runWhenIdle.bind(unifiedPerformanceService);
export const measurePerformance =
  unifiedPerformanceService.measurePerformance.bind(unifiedPerformanceService);
export const batchExecute = unifiedPerformanceService.batchExecute.bind(unifiedPerformanceService);

// 누락된 함수들 추가
export const throttleScroll =
  unifiedPerformanceService.throttleScroll.bind(unifiedPerformanceService);
export const measureAsyncPerformance =
  unifiedPerformanceService.measureAsyncPerformance.bind(unifiedPerformanceService);

// Debouncer 클래스는 위에서 정의됨

// 하위 호환성을 위한 별칭들
export const debounce = createDebouncer;
export const throttle = createThrottle;

/**
 * 디바운서 클래스 - 중복 실행 방지 (기존 코드 호환성)
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;

  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  execute(...args: T): void {
    this.lastArgs = args;
    this.clearTimer();
    this.timerId = window.setTimeout(() => {
      if (this.lastArgs) {
        this.fn(...this.lastArgs);
        this.lastArgs = null;
      }
    }, this.delay);
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
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
