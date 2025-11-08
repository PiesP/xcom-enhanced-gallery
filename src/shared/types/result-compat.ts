/**
 * Result type compatibility layer (Phase 355.2)
 * @description Conversion functions between Simple Result ↔ Enhanced Result
 * @version 1.1.0 - Phase 355.4: Simple Result local definition
 */

import type { Result as EnhancedResult } from './result.types';
import { ErrorCode } from './result.types';

/**
 * Simple Result type (legacy compatibility)
 * @deprecated Removed in Phase 355.4 from core-types.ts
 * @note This type is used only inside the compatibility layer
 */
type SimpleResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Convert Simple Result → Enhanced Result
 *
 * @param simple - Simple Result (core-types.ts)
 * @param options - Additional metadata options
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
 * Convert Enhanced Result → Simple Result (legacy compatibility)
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
 * - 'partial' status is converted to success (data is returned)
 * - ErrorCode is attached as code property of Error object
 */
export function toSimpleResult<T>(enhanced: EnhancedResult<T>): SimpleResult<T> {
  if (enhanced.status === 'success' || enhanced.status === 'partial') {
    return { success: true, data: (enhanced as { data: T }).data };
  } else {
    const error = new Error(enhanced.error || 'Unknown error');
    // Attach ErrorCode to Error object (optional)
    if (enhanced.code) {
      (error as Error & { code?: ErrorCode }).code = enhanced.code;
    }
    return { success: false, error };
  }
}

/**
 * Convert array of Simple Results to Enhanced Results
 *
 * @param results - Simple Result array
 * @returns Enhanced Result array
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
 * Convert array of Enhanced Results to Simple Results
 *
 * @param results - Enhanced Result array
 * @returns Simple Result array
 */
export function toSimpleResults<T>(results: Array<EnhancedResult<T>>): Array<SimpleResult<T>> {
  return results.map(toSimpleResult);
}
