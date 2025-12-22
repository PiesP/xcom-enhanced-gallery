import { delay, isAbortError } from './delay';

export function getExponentialBackoffDelayMs(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * 2 ** attempt;
}

/**
 * Options for retry operations
 */
export interface RetryOptions {
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
 * Result of a retry operation
 */
export interface RetryResultBase {
  /** Whether the operation succeeded */
  readonly success: boolean;
  /** Number of attempts made */
  readonly attempts: number;
}

export type RetryResultSuccess<T> = RetryResultBase & {
  readonly success: true;
  /** The result value if successful */
  readonly data: T;
  readonly error?: undefined;
};

export type RetryResultFailure = RetryResultBase & {
  readonly success: false;
  readonly data?: undefined;
  /** The error if failed */
  readonly error: unknown;
};

export type RetryResult<T> = RetryResultSuccess<T> | RetryResultFailure;

/**
 * Default retry options
 */
const DEFAULT_OPTIONS = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 10000,
} as const;

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
 * Automatically retries failed operations with exponential backoff.
 * Supports cancellation via AbortSignal and custom retry conditions.
 *
 * @param operation - Async function to execute
 * @param options - Retry options
 * @returns Result object with success, data, error, and attempts
 *
 * @example
 * ```typescript
 * // Basic retry
 * const result = await withRetry(() => fetchData());
 *
 * // With options
 * const controller = new AbortController();
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     maxAttempts: 5,
 *     baseDelayMs: 500,
 *     signal: controller.signal,
 *     onRetry: (attempt, error) => {
 *       console.log(`Retry ${attempt}: ${error}`);
 *     },
 *     shouldRetry: (error) => error instanceof NetworkError,
 *   }
 * );
 *
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(`Failed after ${result.attempts} attempts:`, result.error);
 * }
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
