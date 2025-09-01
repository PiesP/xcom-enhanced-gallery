/**
 * @fileoverview 이벤트 throttling 유틸리티
 * @description Phase 9.3 REFACTOR - wheel 이벤트 최적화를 위한 throttle 함수
 * @version 1.0.0
 */

/**
 * 함수 실행을 제한하는 throttle 함수
 *
 * @param func - throttle을 적용할 함수
 * @param limit - 제한 시간 (ms)
 * @returns throttled 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan)
      );
    }
  };
}

/**
 * 연속 호출을 지연시키는 debounce 함수
 *
 * @param func - debounce를 적용할 함수
 * @param delay - 지연 시간 (ms)
 * @returns debounced 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * requestAnimationFrame 기반 throttle (부드러운 애니메이션을 위해)
 *
 * @param func - throttle을 적용할 함수
 * @returns RAF throttled 함수
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        rafId = null;
      });
    }
  };
}
