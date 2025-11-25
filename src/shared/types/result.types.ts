/**
 * Common Result pattern (Phase: Result Unification)
 * @version 2.1.0 - Phase 353: ExtractionErrorCode alias removed
 */
export type BaseResultStatus = 'success' | 'partial' | 'error' | 'cancelled';

/**
 * Integrated error codes (generic + media extraction)
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
export enum ErrorCode {
  // Generic error codes
  NONE = 'NONE',
  CANCELLED = 'CANCELLED',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  EMPTY_INPUT = 'EMPTY_INPUT',
  ALL_FAILED = 'ALL_FAILED',
  PARTIAL_FAILED = 'PARTIAL_FAILED',
  UNKNOWN = 'UNKNOWN',

  // Media extraction specific error codes (previous ExtractionErrorCode integrated)
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  INVALID_ELEMENT = 'INVALID_ELEMENT',
  NO_MEDIA_FOUND = 'NO_MEDIA_FOUND',
  INVALID_URL = 'INVALID_URL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export interface BaseResult {
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

export type ResultSuccess<T> = BaseResult & {
  status: 'success';
  data: T;
  code?: ErrorCode.NONE;
};
export type ResultPartial<T> = BaseResult & {
  status: 'partial';
  data: T;
  error: string;
  code: ErrorCode.PARTIAL_FAILED;
  failures: Array<{ url: string; error: string }>;
};
export type ResultError = BaseResult & { status: 'error' | 'cancelled' };
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

/**
 * Create partial failure Result
 *
 * @param data - Partially successful data
 * @param error - Error message
 * @param failures - List of failed items
 * @param meta - Optional metadata
 * @returns Enhanced Result (partial)
 *
 * @example
 * ```typescript
 * const result = partial([item1, item2], '1 failed', [{ url: 'bad.jpg', error: '404' }]);
 * // { status: 'partial', data: [...], code: ErrorCode.PARTIAL_FAILED, failures: [...] }
 * ```
 */
export function partial<T>(
  data: T,
  error: string,
  failures: Array<{ url: string; error: string }>,
  meta?: Record<string, unknown>
): ResultPartial<T> {
  return {
    status: 'partial',
    data,
    error,
    code: ErrorCode.PARTIAL_FAILED,
    failures,
    ...(meta && { meta }),
  };
}

/**
 * Create cancelled Result
 *
 * @param error - Error message (default: 'Operation cancelled')
 * @param meta - Optional metadata
 * @returns Enhanced Result (cancelled)
 *
 * @example
 * ```typescript
 * const result = cancelled('User cancelled download');
 * // { status: 'cancelled', error: 'User cancelled download', code: ErrorCode.CANCELLED }
 * ```
 */
export function cancelled<T = never>(
  error = 'Operation cancelled',
  meta?: Record<string, unknown>
): Result<T> {
  return {
    status: 'cancelled',
    error,
    code: ErrorCode.CANCELLED,
    ...(meta && { meta }),
  };
}

/**
 * Check if Result is success (type guard)
 *
 * @param result - Result to check
 * @returns Whether result is ResultSuccess
 */
export function isSuccess<T>(result: Result<T>): result is ResultSuccess<T> {
  return result.status === 'success';
}

/**
 * Check if Result is failure (type guard)
 *
 * @param result - Result to check
 * @returns Whether result is error or cancelled
 */
export function isFailure<T>(result: Result<T>): result is ResultError {
  return result.status === 'error' || result.status === 'cancelled';
}

/**
 * Check if Result is partial failure (type guard)
 *
 * @param result - Result to check
 * @returns Whether result is partial
 */
export function isPartial<T>(result: Result<T>): result is ResultPartial<T> {
  return result.status === 'partial';
}

/**
 * Extract value from Result (provide default)
 *
 * @param result - Result to extract from
 * @param defaultValue - Default value on failure
 * @returns Data on success, defaultValue on failure
 *
 * @example
 * ```typescript
 * const value = unwrapOr(result, 'fallback');
 * ```
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return isSuccess(result) ? result.data : defaultValue;
}

/**
 * Safely execute async function and return Result
 *
 * @param fn - Async function to execute
 * @param options - ErrorCode and meta options
 * @returns Promise<Result<T>>
 *
 * @example
 * ```typescript
 * const result = await safeAsync(
 *   async () => fetchData(),
 *   { code: ErrorCode.NETWORK }
 * );
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options?: {
    code?: ErrorCode;
    meta?: Record<string, unknown>;
  }
): Promise<Result<T>> {
  try {
    const data = await fn();
    return success(data, options?.meta);
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : String(error),
      options?.code ?? ErrorCode.UNKNOWN,
      {
        cause: error,
        ...(options?.meta && { meta: options.meta }),
      }
    );
  }
}

/**
 * Safely execute sync function and return Result
 *
 * @param fn - Sync function to execute
 * @param options - ErrorCode and meta options
 * @returns Result<T>
 *
 * @example
 * ```typescript
 * const result = safe(
 *   () => JSON.parse(data),
 *   { code: ErrorCode.INVALID_ELEMENT }
 * );
 * ```
 */
export function safe<T>(
  fn: () => T,
  options?: {
    code?: ErrorCode;
    meta?: Record<string, unknown>;
  }
): Result<T> {
  try {
    const data = fn();
    return success(data, options?.meta);
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : String(error),
      options?.code ?? ErrorCode.UNKNOWN,
      {
        cause: error,
        ...(options?.meta && { meta: options.meta }),
      }
    );
  }
}

/**
 * Result chaining (flatMap)
 *
 * @param result - Input Result
 * @param fn - Transform function (returns Result)
 * @returns Chained Result
 *
 * @example
 * ```typescript
 * const result2 = chain(result1, (data) => processData(data));
 * ```
 */
export function chain<T, U>(result: Result<T>, fn: (value: T) => Result<U>): Result<U> {
  if (!isSuccess(result)) {
    return result as unknown as Result<U>;
  }
  return fn(result.data);
}

/**
 * Result mapping (map)
 *
 * @param result - Input Result
 * @param fn - Transform function (returns value)
 * @returns Mapped Result
 *
 * @example
 * ```typescript
 * const result2 = map(result1, (data) => data.id);
 * ```
 */
export function map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  if (!isSuccess(result)) {
    return result as unknown as Result<U>;
  }
  return success(fn(result.data), result.meta);
}
