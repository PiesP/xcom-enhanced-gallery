/**
 * @fileoverview 성능 최적화된 Throttle 유틸리티
 * @version 3.0.0
 * @description RAF 기반 throttle과 기존 throttle을 통합하여 제공
 */

import { logger } from '@core/logging/logger';

/**
 * RAF 기반 throttle 옵션
 */
export interface RafThrottleOptions {
  /** 첫 번째 호출을 즉시 실행할지 여부 (기본: true) */
  leading?: boolean;
  /** 마지막 호출을 프레임 끝에 실행할지 여부 (기본: true) */
  trailing?: boolean;
}

/**
 * requestAnimationFrame을 사용한 성능 최적화된 throttle
 *
 * @description
 * 브라우저의 프레임 렌더링에 맞춰 함수 실행을 제어하며,
 * leading과 trailing 호출을 모두 지원하여 이벤트 손실을 방지합니다.
 * 긴 연속 스크롤에서도 안정적으로 동작합니다.
 *
 * @param fn 실행할 함수
 * @param options throttle 옵션
 * @returns RAF 기반 throttle이 적용된 함수
 *
 * @example
 * ```typescript
 * const throttledScroll = rafThrottle(() => {
 *   console.log('Scroll handled');
 * }, { leading: true, trailing: true });
 *
 * window.addEventListener('scroll', throttledScroll, { passive: true });
 * ```
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  options: RafThrottleOptions = {}
): T {
  const { leading = true, trailing = true } = options;

  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let hasLeadingCalled = false;

  const invoke = (args: Parameters<T>) => {
    try {
      fn(...args);
    } catch (error) {
      logger.warn('rafThrottle: 함수 실행 중 오류 발생', { error });
    }
    lastArgs = null;
  };

  const scheduleTrailing = () => {
    rafId = requestAnimationFrame(() => {
      rafId = null;
      hasLeadingCalled = false;

      if (trailing && lastArgs) {
        invoke(lastArgs);
      }
    });
  };

  return function throttled(this: unknown, ...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      // 첫 번째 프레임 시작
      if (leading && !hasLeadingCalled) {
        hasLeadingCalled = true;
        invoke(args);
      }

      scheduleTrailing();
    }
    // 이미 프레임이 예약되어 있으면 lastArgs만 업데이트
  } as T;
}

/**
 * 기존 시간 기반 throttle (호환성 유지)
 *
 * @description
 * 지정된 시간 동안 함수 호출을 제한합니다.
 * RAF throttle이 적합하지 않은 경우에 사용합니다.
 *
 * @param func 실행할 함수
 * @param limit 제한 시간 (밀리초)
 * @returns throttle이 적용된 함수
 */
export function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): T {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  const execute = () => {
    if (lastArgs) {
      try {
        func(...lastArgs);
      } catch (error) {
        logger.warn('throttle: 함수 실행 중 오류 발생', { error });
      }
      lastArgs = null;
    }
    inThrottle = false;
  };

  return function throttled(this: unknown, ...args: Parameters<T>) {
    lastArgs = args;

    if (!inThrottle) {
      inThrottle = true;

      // 즉시 실행 (leading)
      try {
        func(...args);
      } catch (error) {
        logger.warn('throttle: 함수 실행 중 오류 발생', { error });
      }

      // trailing 실행 예약
      setTimeout(execute, limit);
    }
  } as T;
}

/**
 * 스크롤 이벤트에 최적화된 throttle
 *
 * @description
 * 스크롤 이벤트 처리에 특화된 RAF throttle입니다.
 * 성능과 반응성의 균형을 맞춘 설정을 제공합니다.
 *
 * @param func 스크롤 핸들러 함수
 * @returns 스크롤 최적화된 throttle 함수
 */
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  return rafThrottle(func, {
    leading: true,
    trailing: true,
  });
}
