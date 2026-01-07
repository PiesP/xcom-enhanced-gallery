/**
 * Common Result pattern (Phase: Result Unification)
 * @version 2.2.0 - Phase 4: Type system optimization (enum → const object)
 */
const BaseResultStatusValues = ['success', 'partial', 'error', 'cancelled'] as const;
type BaseResultStatus = (typeof BaseResultStatusValues)[number];

/**
 * Integrated error codes (generic + media extraction)
 *
 * Using const object instead of enum for tree-shaking optimization.
 * Enum generates runtime code, while const object is purely compile-time.
 *
 * Generic error codes:
 *   - NONE: No error
 *   - CANCELLED: Operation cancelled
 *   - EMPTY_INPUT: Input is empty
 *   - ALL_FAILED: All operations failed
 *   - PARTIAL_FAILED: Some operations failed
 *   - UNKNOWN: Unknown error
 *
 * Network/Timeout:
 *   - NETWORK: Network error
 *   - TIMEOUT: Operation timeout
 *
 * Media extraction specific (Phase 195: ExtractionErrorCode integrated):
 *   - ELEMENT_NOT_FOUND: Element not found
 *   - INVALID_ELEMENT: Invalid element
 *   - NO_MEDIA_FOUND: No media found
 *   - INVALID_URL: Invalid URL
 *   - PERMISSION_DENIED: Permission denied
 */
export const ErrorCode = {
  // Generic error codes
  NONE: 'NONE',
  CANCELLED: 'CANCELLED',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  EMPTY_INPUT: 'EMPTY_INPUT',
  ALL_FAILED: 'ALL_FAILED',
  PARTIAL_FAILED: 'PARTIAL_FAILED',
  UNKNOWN: 'UNKNOWN',

  // Media extraction specific error codes (previous ExtractionErrorCode integrated)
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  INVALID_ELEMENT: 'INVALID_ELEMENT',
  NO_MEDIA_FOUND: 'NO_MEDIA_FOUND',
  INVALID_URL: 'INVALID_URL',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

/** Type for ErrorCode values */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

interface BaseResult {
  status: BaseResultStatus;
  error?: string;
  /** Machine readable code */
  code?: ErrorCode; // RED test will require this when status !== 'success'
  /** Optional original error message or object serialized */
  cause?: unknown;
  /** Arbitrary diagnostic metadata (timings, counts, etc.) */
  meta?: Record<string, unknown>;
  failures?: Array<{ url: string; error: string }>; // Partial failure summary
}

type ResultSuccess<T> = BaseResult & {
  status: 'success';
  data: T;
  code?: typeof ErrorCode.NONE;
};
type ResultPartial<T> = BaseResult & {
  status: 'partial';
  data: T;
  error: string;
  code: typeof ErrorCode.PARTIAL_FAILED;
  failures: Array<{ url: string; error: string }>;
};
type ResultError = BaseResult & { status: 'error' | 'cancelled' };
export type Result<T> = ResultSuccess<T> | ResultPartial<T> | ResultError;

/**
 * Asynchronous Result type - wraps Result in Promise
 * Commonly used for async operations (Phase 353)
 *
 * @example
 * async function processFile(): AsyncResult<FileData> {
 *   return { status: 'success', data: {...} };
 * }
 */
export type AsyncResult<T> = Promise<Result<T>>;

// ============================================================================
// Result Utility Functions (Phase 355.2)
// ============================================================================

/**
 * Create success Result
 *
 * @param data - Success data
 * @param meta - Optional metadata
 * @returns Enhanced Result (success)
 *
 * @example
 * ```typescript
 * const result = success({ id: 1, name: 'test' });
 * // { status: 'success', data: { id: 1, name: 'test' }, code: ErrorCode.NONE }
 * ```
 */
export function success<T>(data: T, meta?: Record<string, unknown>): Result<T> {
  return {
    status: 'success',
    data,
    code: ErrorCode.NONE,
    ...(meta && { meta }),
  };
}

/**
 * Create failure Result
 *
 * @param error - Error message
 * @param code - ErrorCode (default: UNKNOWN)
 * @param options - Additional options (cause, meta, failures)
 * @returns Enhanced Result (error)
 *
 * @example
 * ```typescript
 * const result = failure('Task not found', ErrorCode.ELEMENT_NOT_FOUND);
 * // { status: 'error', error: 'Task not found', code: ErrorCode.ELEMENT_NOT_FOUND }
 * ```
 */
export function failure<T = never>(
  error: string,
  code: ErrorCode = ErrorCode.UNKNOWN,
  options?: {
    cause?: unknown;
    meta?: Record<string, unknown>;
    failures?: Array<{ url: string; error: string }>;
  }
): Result<T> {
  return {
    status: 'error',
    error,
    code,
    ...options,
  };
}

// ============================================================================
// ============================================================================
// Type Guards (inline usage recommended for tree-shaking)
// ============================================================================

/**
 * Check if Result is success (type guard)
 *
 * Narrows Result type to ResultSuccess<T>.
 * For inline usage: `result.status === 'success'`
 *
 * @param result - Result instance to test
 * @returns True if result status is 'success'
 *
 * @example
 * ```typescript
 * const result = success({ id: 1 });
 * if (isSuccess(result)) {
 *   console.log(result.data); // Typed as T
 * }
 * ```
 */
export function isSuccess<T>(result: Result<T>): result is ResultSuccess<T> {
  return result.status === 'success';
}

/**
 * Check if Result is failure (type guard)
 *
 * Narrows Result type to ResultError (status 'error' | 'cancelled').
 * For inline usage: `result.status === 'error' || result.status === 'cancelled'`
 *
 * @param result - Result instance to test
 * @returns True if result status is 'error' or 'cancelled'
 *
 * @example
 * ```typescript
 * const result = failure('Not found');
 * if (isFailure(result)) {
 *   console.log(result.error); // error message available
 * }
 * ```
 */
export function isFailure<T>(result: Result<T>): result is ResultError {
  return result.status === 'error' || result.status === 'cancelled';
}

/**
 * Check if Result is partial success (type guard)
 *
 * Narrows Result type to ResultPartial<T>.
 *
 * @param result - Result instance to test
 * @returns True if result status is 'partial'
 *
 * @example
 * ```typescript
 * const result = partial(items, 'Some items failed');
 * if (isPartial(result)) {
 *   console.log(result.data); // Available data
 *   console.log(result.failures); // Individual failures
 * }
 * ```
 */
export function isPartial<T>(result: Result<T>): result is ResultPartial<T> {
  return result.status === 'partial';
}

// ============================================================================
// Rust-style Aliases (Phase: Result Unification)
// ============================================================================

/**
 * Create success Result (Rust-style alias for `success`)
 *
 * Convenience alias for Rust-like API. Same behavior as `success()`.
 *
 * @param data - Success data
 * @param meta - Optional metadata
 * @returns Enhanced Result (success)
 *
 * @example
 * ```typescript
 * const result = ok({ id: 1 });
 * // { status: 'success', data: { id: 1 }, code: ErrorCode.NONE }
 * ```
 */
export const ok = success;

/**
 * Create failure Result (Rust-style alias for `failure`)
 *
 * Convenience alias for Rust-like API. Same behavior as `failure()`.
 *
 * @param error - Error message
 * @param code - ErrorCode (default: UNKNOWN)
 * @param options - Additional options (cause, meta, failures)
 * @returns Enhanced Result (error)
 *
 * @example
 * ```typescript
 * const result = err('Not found', ErrorCode.ELEMENT_NOT_FOUND);
 * // { status: 'error', error: 'Not found', code: ErrorCode.ELEMENT_NOT_FOUND }
 * ```
 */
export const err = failure;

// ============================================================================
// Result Utility Functions (Rust-style combinators)
// ============================================================================

// ============================================================================
// Result Utility Functions (Rust-style combinators)
// ============================================================================

/**
 * Unwrap Result value or return default on failure
 *
 * Extracts data from success/partial results or returns default value on error/cancellation.
 *
 * @param result - Result instance to unwrap
 * @param defaultValue - Default value if result is error/cancelled
 * @returns Extracted data or default value
 *
 * @example
 * ```typescript
 * const value = unwrapOr(result, []);
 * // Returns data if success or partial, [] if failure
 * ```
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.status === 'success' || result.status === 'partial' ? result.data : defaultValue;
}

/**
 * Map success data to a new value
 *
 * Transforms success result data using provided function.
 * Preserves failure state.
 *
 * @param result - Result instance to map
 * @param fn - Transformation function applied to success data
 * @returns New Result with transformed data (or unchanged failure)
 *
 * @example
 * ```typescript
 * const mapped = map(result, data => data.length);
 * // Transforms data from T to U, preserves errors
 * ```
 */
export function map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
  if (result.status === 'success') {
    return success(fn(result.data), result.meta);
  }
  if (result.status === 'partial') {
    return {
      ...result,
      data: fn(result.data),
    } as ResultPartial<U>;
  }
  return result as ResultError;
}

/**
 * Map error message to a new message
 *
 * Transforms error/cancelled result message using provided function.
 * Leaves success/partial results unchanged.
 *
 * @param result - Result instance to map
 * @param fn - Error message transformation function
 * @returns Result with transformed error message (or unchanged success)
 *
 * @example
 * ```typescript
 * const mapped = mapErr(result, msg => `Failed: ${msg}`);
 * // Wraps error message with context
 * ```
 */
export function mapErr<T>(result: Result<T>, fn: (error: string) => string): Result<T> {
  if (result.status === 'error' || result.status === 'cancelled') {
    return { ...result, error: fn(result.error ?? '') };
  }
  return result;
}

/**
 * Chain Result operations (flatMap)
 *
 * Chains multiple Result-returning operations.
 * Short-circuits on first error, but preserves partial state.
 *
 * @param result - Result instance to chain
 * @param fn - Function returning a new Result
 * @returns Chained Result
 *
 * @example
 * ```typescript
 * const chained = andThen(result, data => ok(data.items));
 * // Applies transformation only if result is successful
 * ```
 */
export function andThen<T, U>(result: Result<T>, fn: (data: T) => Result<U>): Result<U> {
  if (result.status === 'success') {
    return fn(result.data);
  }
  if (result.status === 'partial') {
    const mapped = fn(result.data);
    if (mapped.status === 'success') {
      return {
        ...result,
        data: mapped.data,
      } as unknown as ResultPartial<U>;
    }
    return mapped;
  }
  return result as ResultError;
}
