/**
 * @fileoverview Type Utilities
 * @version 1.0.0
 *
 * 타입 가드와 검증 유틸리티들
 */

/**
 * 문자열인지 확인하는 타입 가드
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 숫자인지 확인하는 타입 가드
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * 객체인지 확인하는 타입 가드 (null 제외)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 배열인지 확인하는 타입 가드
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 함수인지 확인하는 타입 가드
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * null 또는 undefined인지 확인하는 타입 가드
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 유효한 URL인지 확인하는 타입 가드 (개선된 버전)
 */
export function isValidUrl(value: unknown): value is string {
  if (!isString(value) || value.trim().length === 0) {
    return false;
  }

  try {
    const url = new URL(value);
    // 추가 검증: 프로토콜 확인
    return ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * HTTP/HTTPS URL인지 확인하는 타입 가드
 */
export function isHttpUrl(value: unknown): value is string {
  if (!isValidUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 빈 문자열이 아닌 문자열인지 확인하는 타입 가드
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * Promise인지 확인하는 타입 가드
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof (value as Record<string, unknown>).then === 'function'
  );
}

/**
 * Error 객체인지 확인하는 타입 가드
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error || (isObject(value) && 'message' in value);
}

/**
 * 정수인지 확인하는 타입 가드
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * 양의 정수인지 확인하는 타입 가드
 */
export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

/**
 * 날짜 객체인지 확인하는 타입 가드
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * 정규표현식인지 확인하는 타입 가드
 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * 부울값인지 확인하는 타입 가드
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T = unknown>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * 안전한 JSON 문자열화
 */
export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
