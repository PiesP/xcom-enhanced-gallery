/**
 * @fileoverview User cancellation helpers.
 *
 * Centralizes the cancellation semantics used across download/retry layers.
 * Provides standardized AbortError creation and detection for user-initiated
 * cancellations and timeout scenarios.
 */

/**
 * Standard message for user-initiated cancellations.
 * @internal
 */
const USER_CANCELLED_MESSAGE = 'Download cancelled by user' as const;

/**
 * Default message for generic abort operations.
 * @internal
 */
const DEFAULT_ABORT_MESSAGE = 'This operation was aborted' as const;

/**
 * Check whether an unknown value represents an AbortError-like cancellation.
 *
 * Policy:
 * - Treat DOMException("AbortError") and DOMException("TimeoutError") as abort-like.
 * - Treat Error named "AbortError"/"TimeoutError" as abort-like.
 * - Preserve legacy heuristic: Error message containing "aborted" is considered abort-like.
 *
 * @param value - Value to check
 * @returns true if the value represents an abort-like error
 *
 * @example
 * ```typescript
 * try {
 *   await fetch(url, { signal });
 * } catch (error) {
 *   if (isAbortError(error)) {
 *     console.log('Request was aborted');
 *   }
 * }
 * ```
 */
export function isAbortError(value: unknown): boolean {
  if (value instanceof DOMException) {
    return value.name === 'AbortError' || value.name === 'TimeoutError';
  }

  if (value instanceof Error) {
    return (
      value.name === 'AbortError' ||
      value.name === 'TimeoutError' ||
      value.message.toLowerCase().includes('aborted')
    );
  }

  return false;
}

/**
 * Check whether an unknown value represents a timeout error.
 *
 * This is intentionally broader than AbortError detection: timeouts may surface as
 * DOMException("TimeoutError") (AbortSignal.timeout/our timeout controller) or as
 * an Error subclass named "TimeoutError".
 *
 * @internal
 * @param value - Value to check
 * @returns true if the value represents a timeout error
 */
function isTimeoutError(value: unknown): boolean {
  if (value instanceof DOMException) {
    return value.name === 'TimeoutError';
  }

  if (value instanceof Error) {
    return value.name === 'TimeoutError';
  }

  return false;
}

/**
 * Attach a cause property to an error object if supported.
 *
 * @internal
 * @param target - Error or DOMException to attach cause to
 * @param cause - Cause value to attach
 */
function attachCause(target: Error | DOMException, cause: unknown): void {
  if (cause === undefined) {
    return;
  }

  try {
    (target as Error & { cause?: unknown }).cause = cause;
  } catch {
    // Ignore: older runtimes may not allow assigning cause
  }
}

/**
 * Create an AbortError with the specified message.
 *
 * Attempts to create a DOMException first (preferred), falling back to Error
 * if DOMException is not supported or throws.
 *
 * @internal
 * @param message - Error message
 * @param cause - Optional cause to attach
 * @returns DOMException or Error with name "AbortError"
 */
function createAbortError(message: string, cause?: unknown): DOMException | Error {
  try {
    const error = new DOMException(message, 'AbortError');
    attachCause(error, cause);
    return error;
  } catch {
    const error = new Error(message);
    error.name = 'AbortError';
    attachCause(error, cause);
    return error;
  }
}

/**
 * Create an AbortError representing a user-initiated cancellation.
 *
 * Uses the standardized USER_CANCELLED_MESSAGE for consistent detection
 * across the application.
 *
 * @param cause - Optional cause to attach (e.g., original AbortSignal reason)
 * @returns Error with name "AbortError" and standardized message
 *
 * @example
 * ```typescript
 * const error = createUserCancelledAbortError();
 * throw error;
 * ```
 */
export function createUserCancelledAbortError(cause?: unknown): Error {
  const error = new Error(USER_CANCELLED_MESSAGE);
  error.name = 'AbortError';
  attachCause(error, cause);
  return error;
}

/**
 * Check whether an unknown value represents the standardized user cancellation.
 *
 * Only returns true for errors created by createUserCancelledAbortError or
 * manually constructed errors matching the exact message and name.
 *
 * @internal
 * @param error - Value to check
 * @returns true if the error represents a user-initiated cancellation
 */
function isUserCancelledAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError' && error.message === USER_CANCELLED_MESSAGE;
  }

  if (error instanceof Error) {
    return error.name === 'AbortError' && error.message === USER_CANCELLED_MESSAGE;
  }

  return false;
}

/**
 * Convert an AbortSignal state/reason into a standardized AbortError.
 *
 * - Preserves TimeoutError semantics when the signal reason represents a timeout.
 * - Preserves an already-standardized cancellation error.
 * - Otherwise creates a new user-cancelled error with the original reason as cause.
 *
 * @param signal - AbortSignal to extract error from
 * @returns DOMException or Error representing the cancellation
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation(signal);
 * } catch {
 *   throw getUserCancelledAbortErrorFromSignal(signal);
 * }
 * ```
 */
export function getUserCancelledAbortErrorFromSignal(signal?: AbortSignal): DOMException | Error {
  const reason = signal?.reason;

  // Preserve timeout semantics when a timeout signal is used.
  if (isTimeoutError(reason)) {
    return reason;
  }

  // Preserve an already-standardized AbortError message.
  if (isUserCancelledAbortError(reason)) {
    return reason as DOMException | Error;
  }

  return createUserCancelledAbortError(reason);
}

/**
 * Convert an AbortSignal reason into a throwable error without losing explicit reasons.
 *
 * Policy:
 * - Preserve DOMException/Error reasons (including custom errors).
 * - When the reason is missing or non-error (string/object/etc), return a standardized AbortError
 *   and attach the original reason as `cause`.
 *
 * This is intentionally different from `getUserCancelledAbortErrorFromSignal()`, which always
 * normalizes to the user-cancelled message. Some primitives (e.g. delay) rely on preserving
 * explicit reasons for debugging and testability.
 */
export function getAbortReasonOrAbortErrorFromSignal(signal?: AbortSignal): DOMException | Error {
  const reason = signal?.reason;

  if (reason instanceof DOMException) {
    return reason;
  }

  if (reason instanceof Error) {
    return reason;
  }

  // Reason is missing or not an Error/DOMException.
  // Standardize to a native AbortError shape for consistency with AbortController().
  return createAbortError(DEFAULT_ABORT_MESSAGE, reason);
}
