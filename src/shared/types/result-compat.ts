/**
 * Result 타입 호환성 레이어 (Phase 355.2)
 * @description Simple Result ↔ Enhanced Result 변환 함수
 * @version 1.1.0 - Phase 355.4: Simple Result 로컬 정의
 */

import type { Result as EnhancedResult } from './result.types';
import { ErrorCode } from './result.types';

/**
 * Simple Result 타입 (레거시 호환용)
 * @deprecated Phase 355.4에서 core-types.ts에서 제거됨
 * @note 이 타입은 호환성 레이어 내부에서만 사용
 */
type SimpleResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Simple Result → Enhanced Result 변환
 *
 * @param simple - Simple Result (core-types.ts)
 * @param options - 추가 메타데이터 옵션
 * @returns Enhanced Result (result.types.ts)
 *
 * @example
 * ```typescript
 * const simple: Result<string, Error> = { success: true, data: 'test' };
 * const enhanced = toEnhancedResult(simple);
 * // { status: 'success', data: 'test', code: ErrorCode.NONE }
 * ```
 */
export function toEnhancedResult<T>(
  simple: SimpleResult<T>,
  options?: {
    code?: ErrorCode;
    meta?: Record<string, unknown>;
    cause?: unknown;
  }
): EnhancedResult<T> {
  if (simple.success) {
    return {
      status: 'success',
      data: simple.data,
      code: ErrorCode.NONE,
      ...(options?.meta && { meta: options.meta }),
    };
  } else {
    return {
      status: 'error',
      error: simple.error instanceof Error ? simple.error.message : String(simple.error),
      code: options?.code ?? ErrorCode.UNKNOWN,
      cause: options?.cause ?? simple.error,
      ...(options?.meta && { meta: options.meta }),
    };
  }
}

/**
 * Enhanced Result → Simple Result 변환 (레거시 호환용)
 *
 * @param enhanced - Enhanced Result (result.types.ts)
 * @returns Simple Result (core-types.ts)
 *
 * @example
 * ```typescript
 * const enhanced: Result<string> = { status: 'success', data: 'test', code: ErrorCode.NONE };
 * const simple = toSimpleResult(enhanced);
 * // { success: true, data: 'test' }
 * ```
 *
 * @remarks
 * - 'partial' status는 success로 변환 (데이터 반환)
 * - ErrorCode는 Error 객체의 code 프로퍼티로 첨부
 */
export function toSimpleResult<T>(enhanced: EnhancedResult<T>): SimpleResult<T> {
  if (enhanced.status === 'success' || enhanced.status === 'partial') {
    return { success: true, data: (enhanced as { data: T }).data };
  } else {
    const error = new Error(enhanced.error || 'Unknown error');
    // ErrorCode를 Error 객체에 첨부 (선택)
    if (enhanced.code) {
      (error as Error & { code?: ErrorCode }).code = enhanced.code;
    }
    return { success: false, error };
  }
}

/**
 * Simple Result 배열을 Enhanced Result로 일괄 변환
 *
 * @param results - Simple Result 배열
 * @returns Enhanced Result 배열
 */
export function toEnhancedResults<T>(
  results: Array<SimpleResult<T>>,
  options?: {
    code?: ErrorCode;
    meta?: Record<string, unknown>;
  }
): Array<EnhancedResult<T>> {
  return results.map(result => toEnhancedResult(result, options));
}

/**
 * Enhanced Result 배열을 Simple Result로 일괄 변환
 *
 * @param results - Enhanced Result 배열
 * @returns Simple Result 배열
 */
export function toSimpleResults<T>(results: Array<EnhancedResult<T>>): Array<SimpleResult<T>> {
  return results.map(toSimpleResult);
}
