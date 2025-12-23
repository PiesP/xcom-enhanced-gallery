/**
 * Common Result pattern (Phase: Result Unification)
 * @version 2.2.0 - Phase 4: Type system optimization (enum → const object)
 */
type BaseResultStatus = 'success' | 'partial' | 'error' | 'cancelled';

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
// Type Guards (inline usage recommended for tree-shaking)
// ============================================================================

/**
 * Check if Result is success (type guard)
 * For inline usage: `result.status === 'success'`
 */
export function isSuccess<T>(result: Result<T>): result is ResultSuccess<T> {
  return result.status === 'success';
}

/**
 * Check if Result is failure (type guard)
 * For inline usage: `result.status === 'error' || result.status === 'cancelled'`
 */
export function isFailure<T>(result: Result<T>): result is ResultError {
  return result.status === 'error' || result.status === 'cancelled';
}

/**
 * Check if Result is partial success (type guard)
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

/**
 * Unwrap Result value or return default on failure
 *
 * @example
 * ```typescript
 * const value = unwrapOr(result, []);
 * // Returns data if success, [] if failure
 * ```
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.status === 'success' || result.status === 'partial' ? result.data : defaultValue;
}

/**
 * Map success data to a new value
 *
 * @example
 * ```typescript
 * const mapped = map(result, data => data.length);
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
 * @example
 * ```typescript
 * const mapped = mapErr(result, msg => `Failed: ${msg}`);
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
 * @example
 * ```typescript
 * const chained = andThen(result, data => ok(data.items));
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
