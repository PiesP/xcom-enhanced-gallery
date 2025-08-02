/**
 * @fileoverview 통합된 유틸리티 함수들 - TDD Phase 2
 * @description 중복된 debounce, throttle, 타입 검증 함수들을 통합
 * @version 1.0.0 - Phase 2: Utility Consolidation
 */

/**
 * Debounce 함수 - 중복 구현 통합
 *
 * 기존 위치들:
 * - src/shared/utils/performance/performance-utils.ts (Debouncer 클래스)
 * - src/shared/utils/scroll/scroll-utils.ts (createScrollDebouncer)
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle 함수 - RAF 기반 최적화
 *
 * 기존 위치들:
 * - src/shared/utils/performance/performance-utils.ts (rafThrottle)
 * - src/shared/utils/scroll/scroll-utils.ts (throttleScroll)
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let isThrottled = false;
  let lastArgs: Parameters<T> | undefined;

  return (...args: Parameters<T>): void => {
    if (!isThrottled) {
      fn(...args);
      isThrottled = true;

      setTimeout(() => {
        isThrottled = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = undefined;
        }
      }, delay);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * 타입 검증 함수들 - 중복 구현 통합
 */
export const typeValidators = {
  /**
   * 문자열 타입 검증
   */
  isString(value: unknown): value is string {
    return typeof value === 'string';
  },

  /**
   * 숫자 타입 검증
   */
  isNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  },

  /**
   * 객체 타입 검증
   */
  isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },

  /**
   * 배열 타입 검증
   */
  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  },

  /**
   * 함수 타입 검증
   */
  isFunction(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
  },

  /**
   * 불린 타입 검증
   */
  isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  },

  /**
   * null/undefined 검증
   */
  isNullish(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  },

  /**
   * 빈 값 검증 (null, undefined, 빈 문자열, 빈 배열, 빈 객체)
   */
  isEmpty(value: unknown): boolean {
    if (this.isNullish(value)) return true;
    if (this.isString(value)) return value.length === 0;
    if (this.isArray(value)) return value.length === 0;
    if (this.isObject(value)) return Object.keys(value).length === 0;
    return false;
  },
} as const;

// 개별 타입 검증 함수들 export (기존 API 호환성)
export const { isString, isNumber, isObject, isArray, isFunction, isBoolean, isNullish, isEmpty } =
  typeValidators;
