/**
 * @fileoverview User cancellation helpers.
 *
 * Centralizes the cancellation semantics used across download/retry layers.
 */

const USER_CANCELLED_MESSAGE = 'Download cancelled by user' as const;
const DEFAULT_ABORT_MESSAGE = 'This operation was aborted' as const;

/**
 * Check whether an unknown value represents an AbortError-like cancellation.
 *
 * Policy:
 * - Treat DOMException("AbortError") and DOMException("TimeoutError") as abort-like.
 * - Treat Error named "AbortError"/"TimeoutError" as abort-like.
 * - Preserve legacy heuristic: Error message containing "aborted" is considered abort-like.
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
 */
export function createUserCancelledAbortError(cause?: unknown): Error {
  const error = new Error(USER_CANCELLED_MESSAGE);
  error.name = 'AbortError';
  attachCause(error, cause);
  return error;
}

/**
 * Check whether an unknown value represents the standardized user cancellation.
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
