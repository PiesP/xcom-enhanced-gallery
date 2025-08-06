/**
 * @fileoverview 타입 유틸리티 함수들 - TDD Phase 2
 * @description 타입 검증 관련 함수들만 포함
 * @version 3.0.0 - Phase 2: 중복 제거 완료, PerformanceUtils 통합
 */

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
