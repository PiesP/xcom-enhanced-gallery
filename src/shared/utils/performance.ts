/**
 * @fileoverview 통합 성능 유틸리티
 * @version 3.0.0 - Phase 4 통합
 *
 * 모든 성능 관련 유틸리티를 하나의 파일로 통합
 * - Debouncing & Throttling
 * - RAF 최적화
 * - 성능 측정
 * - Lazy Loading
 */

// ================================
// Debouncing Utilities
// ================================

/**
 * 간소화된 디바운서 클래스
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;

  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  /**
   * 디바운스된 함수 실행
   */
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

  /**
   * 대기 중인 실행을 즉시 처리
   */
  flush(): void {
    if (this.lastArgs) {
      this.clearTimer();
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  /**
   * 대기 중인 실행을 취소
   */
  cancel(): void {
    this.clearTimer();
    this.lastArgs = null;
  }

  /**
   * 현재 대기 중인 실행이 있는지 확인
   */
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
 * 함수형 디바운스 (간단한 사용을 위한 유틸리티)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

// ================================
// Throttling Utilities
// ================================

/**
 * RAF 기반 throttle 옵션
 */
export interface RafThrottleOptions {
  /** Leading 호출 활성화 (기본: true) */
  leading?: boolean;
  /** Trailing 호출 활성화 (기본: true) */
  trailing?: boolean;
}

/**
 * requestAnimationFrame을 사용한 성능 최적화된 throttle
 *
 * @description
 * 브라우저의 프레임 렌더링에 맞춰 함수 실행을 제어하며,
 * leading과 trailing 호출을 모두 지원하여 이벤트 손실을 방지합니다.
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  options: RafThrottleOptions = {}
): T {
  const { leading = true, trailing = true } = options;

  let isThrottled = false;
  let lastArgs: Parameters<T> | null = null;
  let rafId: number | null = null;

  function throttled(...args: Parameters<T>): void {
    lastArgs = args;

    if (!isThrottled) {
      // Leading 호출
      if (leading) {
        try {
          fn(...args);
        } catch (error) {
          console.warn('RAF throttle function error:', error);
        }
      }

      isThrottled = true;

      // Trailing 호출 스케줄링
      if (trailing) {
        rafId = requestAnimationFrame(() => {
          isThrottled = false;
          rafId = null;

          if (lastArgs && (!leading || lastArgs !== args)) {
            try {
              fn(...lastArgs);
            } catch (error) {
              console.warn('RAF throttle trailing function error:', error);
            }
          }
          lastArgs = null;
        });
      } else {
        // Trailing이 비활성화된 경우 바로 리셋
        requestAnimationFrame(() => {
          isThrottled = false;
          lastArgs = null;
        });
      }
    }
  }

  return throttled as T;
}

/**
 * 기존 시간 기반 throttle (호환성 유지)
 */
export function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

/**
 * 스크롤 전용 RAF throttle
 */
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  return rafThrottle(func, { leading: true, trailing: true });
}

// ================================
// Performance Measurement
// ================================

/**
 * RAF을 사용한 애니메이션 최적화
 */
export function scheduleWork(callback: () => void): number {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  // Fallback for environments without requestAnimationFrame
  return setTimeout(callback, 16) as unknown as number;
}

/**
 * 간단한 성능 측정
 */
export function measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * 비동기 함수 성능 측정
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (process.env.NODE_ENV === 'development') {
    console.log(`Async Performance [${label}]: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

// ================================
// Lazy Loading
// ================================

/**
 * 지연 로딩을 위한 Intersection Observer 설정
 */
export function setupLazyLoading(
  selector: string,
  callback: (element: Element) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    console.warn('IntersectionObserver not supported');
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, defaultOptions);

  // 초기 요소들 관찰 시작
  document.querySelectorAll(selector).forEach(element => {
    observer.observe(element);
  });

  return observer;
}
