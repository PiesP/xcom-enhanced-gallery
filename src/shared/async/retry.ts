import { delay, isAbortError } from './delay';

/**
 * Calculate exponential backoff delay
 *
 * Computes delay using exponential backoff algorithm: baseDelayMs * 2^attempt
 *
 * @param attempt - Zero-based attempt number (0 = first retry)
 * @param baseDelayMs - Base delay in milliseconds
 * @returns Delay in milliseconds without jitter or cap
 *
 * @example
 * ```typescript
 * getExponentialBackoffDelayMs(0, 200); // 200ms
 * getExponentialBackoffDelayMs(1, 200); // 400ms
 * getExponentialBackoffDelayMs(2, 200); // 800ms
 * ```
 */
export function getExponentialBackoffDelayMs(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * 2 ** attempt;
}

/**
 * Options for retry operations
 *
 * @property maxAttempts - Maximum number of retry attempts (default: 3)
 * @property baseDelayMs - Base delay in milliseconds for exponential backoff (default: 200)
 * @property maxDelayMs - Maximum delay in milliseconds (default: 10000)
 * @property signal - Optional AbortSignal for cancellation
 * @property onRetry - Optional callback for retry events, receives attempt number, error, and next delay
 * @property shouldRetry - Custom function to determine if error should trigger retry (default: all errors retry)
 */
interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  readonly maxAttempts?: number;
  /** Base delay in milliseconds for exponential backoff (default: 200) */
  readonly baseDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  readonly maxDelayMs?: number;
  /** Optional AbortSignal for cancellation */
  readonly signal?: AbortSignal;
  /** Optional callback for retry events */
  readonly onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
  /** Custom function to determine if error should trigger retry (default: all errors) */
  readonly shouldRetry?: (error: unknown) => boolean;
}

/**
 * Base properties shared by all retry results
 *
 * @property success - Whether the operation succeeded
 * @property attempts - Number of attempts made (including initial attempt)
 */
interface RetryResultBase {
  /** Whether the operation succeeded */
  readonly success: boolean;
  /** Number of attempts made */
  readonly attempts: number;
}

/**
 * Successful retry result
 *
 * @template T - Type of the operation result data
 * @property success - Always true for success case
 * @property data - The result value from successful operation
 * @property error - Always undefined for success case
 */
type RetryResultSuccess<T> = RetryResultBase & {
  readonly success: true;
  /** The result value if successful */
  readonly data: T;
  readonly error?: undefined;
};

/**
 * Failed retry result
 *
 * @property success - Always false for failure case
 * @property data - Always undefined for failure case
 * @property error - The error from the last failed attempt
 */
type RetryResultFailure = RetryResultBase & {
  readonly success: false;
  readonly data?: undefined;
  /** The error if failed */
  readonly error: unknown;
};

/**
 * Discriminated union of retry results
 *
 * @template T - Type of the operation result data
 */
type RetryResult<T> = RetryResultSuccess<T> | RetryResultFailure;

/**
 * Default retry options
 */
const DEFAULT_OPTIONS = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 10000,
} as const;

/**
 * Calculate backoff delay with jitter
 *
 * Computes exponential backoff with random jitter (0-25%) to prevent thundering herd.
 * Result is capped at maxDelayMs.
 *
 * @param attempt - Zero-based attempt number
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap in milliseconds
 * @returns Floor-rounded delay in milliseconds with jitter applied
 *
 * @example
 * ```typescript
 * // First retry: ~200-250ms (200 * 2^0 + jitter)
 * calculateBackoff(0, 200, 10000);
 * // Second retry: ~400-500ms (200 * 2^1 + jitter)
 * calculateBackoff(1, 200, 10000);
 * ```
 */
function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponentialDelay = getExponentialBackoffDelayMs(attempt, baseDelayMs);
  // Add jitter (0-25% of delay) to prevent thundering herd
  const jitter = Math.random() * 0.25 * exponentialDelay;
  const totalDelay = exponentialDelay + jitter;
  // Cap at maximum
  return Math.min(Math.floor(totalDelay), maxDelayMs);
}

/**
 * Execute an async operation with retry and exponential backoff
 *
 * Automatically retries failed operations with exponential backoff and jitter.
 * Supports cancellation via AbortSignal and custom retry conditions.
 * AbortErrors are never retried and return immediately.
 *
 * @template T - Type of the operation result
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to discriminated union result (success/failure with metadata)
 *
 * @example
 * ```typescript
 * // Basic retry with defaults (3 attempts, 200ms base delay)
 * const result = await withRetry(() => fetchData());
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(`Failed after ${result.attempts} attempts:`, result.error);
 * }
 *
 * // Advanced usage with all options
 * const controller = new AbortController();
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     maxAttempts: 5,
 *     baseDelayMs: 500,
 *     maxDelayMs: 30000,
 *     signal: controller.signal,
 *     onRetry: (attempt, error, nextDelayMs) => {
 *       console.log(`Retry ${attempt} after ${nextDelayMs}ms:`, error);
 *     },
 *     shouldRetry: (error) => error instanceof NetworkError,
 *   }
 * );
 *
 * // Cancel ongoing operation
 * controller.abort();
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = DEFAULT_OPTIONS.maxAttempts,
    baseDelayMs = DEFAULT_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    signal,
    onRetry,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt < maxAttempts) {
    // Check for cancellation before each attempt
    if (signal?.aborted) {
      return {
        success: false,
        error: signal.reason ?? new DOMException('Operation was aborted', 'AbortError'),
        attempts: attempt,
      };
    }

    try {
      const data = await operation();
      return {
        success: true,
        data,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;
      attempt++;

      // Don't retry abort errors
      if (isAbortError(error)) {
        return {
          success: false,
          error,
          attempts: attempt,
        };
      }

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        return {
          success: false,
          error,
          attempts: attempt,
        };
      }

      // Check if we have more attempts
      if (attempt >= maxAttempts) {
        break;
      }

      // Calculate delay and wait
      const delayMs = calculateBackoff(attempt - 1, baseDelayMs, maxDelayMs);

      // Notify about retry
      onRetry?.(attempt, error, delayMs);

      // Wait with cancellation support
      try {
        await delay(delayMs, signal);
      } catch (delayError) {
        // If delay was aborted, return abort error
        if (isAbortError(delayError)) {
          return {
            success: false,
            error: delayError,
            attempts: attempt,
          };
        }
        throw delayError;
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt,
  };
}
