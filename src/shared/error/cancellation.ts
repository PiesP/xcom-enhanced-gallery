/**
 * @fileoverview User cancellation helpers
 * @description Centralized cancellation semantics for download/retry layers.
 */

const USER_CANCELLED_MESSAGE = 'Download cancelled by user' as const;
const DEFAULT_ABORT_MESSAGE = 'This operation was aborted' as const;

/**
 * Check if value represents an AbortError-like cancellation.
 * Treats DOMException("AbortError"/"TimeoutError") and Error named AbortError/TimeoutError as abort-like.
 * Also preserves legacy heuristic: Error message containing "aborted" is abort-like.
 * @param value - Value to check
 * @returns true if the value represents an abort-like error
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
 * Check if value represents a timeout error.
 * Broader than AbortError: TimeoutError may surface as DOMException or Error subclass.
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
 * Attach a cause property to an error if supported.
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
 * Attempts to create a DOMException first (preferred), falling back to Error.
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
 * Uses standardized USER_CANCELLED_MESSAGE for consistent detection.
 * @param cause - Optional cause to attach (e.g., original AbortSignal reason)
 * @returns Error with name "AbortError" and standardized message
 */
export function createUserCancelledAbortError(cause?: unknown): Error {
  const error = new Error(USER_CANCELLED_MESSAGE);
  error.name = 'AbortError';
  attachCause(error, cause);
  return error;
}

/**
 * Check if value represents the standardized user cancellation.
 * Only returns true for errors created by createUserCancelledAbortError.
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
 * Preserves TimeoutError semantics when signal reason represents timeout.
 * Preserves already-standardized cancellation errors.
 * Otherwise creates a new user-cancelled error with original reason as cause.
 * @param signal - AbortSignal to extract error from
 * @returns DOMException or Error representing the cancellation
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
 * Preserves DOMException/Error reasons.
 * When reason is missing or non-error, returns standardized AbortError with original reason as cause.
 * Different from getUserCancelledAbortErrorFromSignal, which normalizes to user-cancelled message.
 * @param signal - AbortSignal to extract error from
 * @returns DOMException or Error representing the abort
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
