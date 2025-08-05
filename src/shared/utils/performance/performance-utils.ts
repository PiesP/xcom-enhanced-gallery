/**
 * @fileoverview Performance Utilities - Phase 5 Bundle Optimization
 * @version 2.0.0 - 통합된 PerformanceUtils로 위임
 *
 * 기존 중복 제거 완료. 모든 함수는 PerformanceUtils.ts로 통합됨
 * 기존 코드 호환성을 위해 re-export 제공
 */

// 통합된 PerformanceUtils로부터 re-export
export {
  PerformanceUtils,
  rafThrottle,
  throttle,
  debounce,
  createDebouncer,
  measurePerformance,
} from './PerformanceUtils';

// PerformanceUtils에서 직접 가져와서 사용
import { PerformanceUtils } from './PerformanceUtils';

// 스크롤 전용 throttle - rafThrottle의 래퍼
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  // PerformanceUtils에서 직접 rafThrottle 사용
  return PerformanceUtils.rafThrottle(func, { leading: true, trailing: true });
}

// 비동기 성능 측정
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 10) {
    console.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}
