/**
 * @fileoverview User cancellation helpers.
 *
 * Centralizes the cancellation semantics used across download/retry layers.
 */

export const USER_CANCELLED_MESSAGE = 'Download cancelled by user' as const;

function attachCause(target: Error, cause: unknown): void {
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
export function isUserCancelledAbortError(error: unknown): boolean {
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
  if (reason instanceof DOMException && reason.name === 'TimeoutError') {
    return reason;
  }

  if (reason instanceof Error && reason.name === 'TimeoutError') {
    return reason;
  }

  // Preserve an already-standardized AbortError message.
  if (isUserCancelledAbortError(reason)) {
    return reason as DOMException | Error;
  }

  return createUserCancelledAbortError(reason);
}
