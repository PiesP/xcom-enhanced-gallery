/**
 * 간단한 성능 유틸리티
 *
 * 복잡한 성능 최적화 클래스들을 대체하는
 * 유저스크립트에 적합한 간단한 함수형 유틸리티입니다.
 *
 * @version 2.0.0 - PerformanceUtils로 통합됨
 */

// 통합된 PerformanceUtils 사용
export {
  PerformanceUtils,
  rafThrottle,
  throttle,
  debounce,
  createDebouncer,
  measurePerformance,
} from './performance/performance-utils-enhanced';

// 기존 코드 호환성을 위한 추가 유틸리티
export function memo<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}
