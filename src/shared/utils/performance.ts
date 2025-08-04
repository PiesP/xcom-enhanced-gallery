/**
 * 간단한 성능 유틸리티
 *
 * 복잡한 성능 최적화 클래스들을 대체하는
 * 유저스크립트에 적합한 간단한 함수형 유틸리티입니다.
 */

import { createScopedLogger } from '@shared/logging/logger';

import { createDebouncer } from '@shared/services/unified-performance-service';

const logger = createScopedLogger('SimplePerformance');

// Re-export measurePerformance and rafThrottle from UnifiedPerformanceService for backward compatibility
export { measurePerformance, rafThrottle } from '@shared/services/unified-performance-service';

/**
 * 간단한 스로틀 함수
 */
export function throttle<T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let lastCall = 0;

  return (...args: T) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 간단한 메모이제이션
 */
export function memoize<TArgs extends unknown[], TReturn>(
  func: (...args: TArgs) => TReturn,
  keyGenerator?: (...args: TArgs) => string
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();

  return (...args: TArgs) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * requestAnimationFrame을 사용한 간단한 배치 처리
 */
export function rafBatch<T extends unknown[]>(
  callback: (...args: T) => void
): (...args: T) => void {
  let scheduled = false;
  let latestArgs: T;

  return (...args: T) => {
    latestArgs = args;

    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        callback(...latestArgs);
      });
    }
  };
}

/**
 * 간단한 성능 측정
 */
export function measure<T>(name: string, operation: () => T): T {
  const start = performance.now();
  const result = operation();
  const end = performance.now();

  logger.debug(`${name} took ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * 간단한 비동기 작업 지연
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 간단한 재시도 로직
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);

      if (attempt < maxAttempts) {
        await delay(delayMs);
      }
    }
  }

  throw lastError!;
}

/**
 * 간단한 이벤트 리스너 최적화
 */
export function optimizeEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options: {
    debounceMs?: number;
    throttleMs?: number;
    passive?: boolean;
  } = {}
): () => void {
  let optimizedHandler = handler;

  if (options.debounceMs) {
    const debouncer = createDebouncer(handler as (...args: unknown[]) => void, options.debounceMs);
    optimizedHandler = debouncer as typeof handler;
  } else if (options.throttleMs) {
    optimizedHandler = throttle(handler, options.throttleMs);
  }

  const listenerOptions: AddEventListenerOptions = {
    passive: options.passive ?? true,
  };

  element.addEventListener(event, optimizedHandler as EventListener, listenerOptions);

  // 정리 함수 반환
  return () => {
    element.removeEventListener(event, optimizedHandler as EventListener, listenerOptions);
  };
}

/**
 * 간단한 idle 콜백
 */
export function runWhenIdle<T extends unknown[]>(
  callback: (...args: T) => void,
  timeout: number = 5000
): (...args: T) => void {
  return (...args: T) => {
    if ('requestIdleCallback' in window) {
      (
        window as Window & {
          requestIdleCallback: (cb: () => void, options?: { timeout: number }) => void;
        }
      ).requestIdleCallback(() => callback(...args), { timeout });
    } else {
      // 폴백: setTimeout으로 지연 실행
      setTimeout(() => callback(...args), 0);
    }
  };
}
