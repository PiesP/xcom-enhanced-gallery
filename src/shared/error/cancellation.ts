const USER_CANCELLED_MESSAGE = 'Download cancelled by user' as const;

export function isAbortError(value: unknown): boolean {
  if (value instanceof DOMException) {
    return value.name === 'AbortError' || value.name === 'TimeoutError';
  }
  if (value instanceof Error) {
    return value.name === 'AbortError' || value.name === 'TimeoutError';
  }
  return false;
}

function isUserCancelledAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError' && error.message === USER_CANCELLED_MESSAGE;
  }
  if (error instanceof Error) {
    return error.name === 'AbortError' && error.message === USER_CANCELLED_MESSAGE;
  }
  return false;
}

function createAbortError(message: string, cause?: unknown): DOMException {
  const error = new DOMException(message, 'AbortError');
  if (cause !== undefined) {
    (error as Error & { cause?: unknown }).cause = cause;
  }
  return error;
}

export function createUserCancelledAbortError(cause?: unknown): DOMException {
  return createAbortError(USER_CANCELLED_MESSAGE, cause);
}

export function getUserCancelledAbortErrorFromSignal(signal?: AbortSignal): DOMException | Error {
  const reason = signal?.reason;

  if (reason instanceof DOMException) {
    if (reason.name === 'TimeoutError' || isUserCancelledAbortError(reason)) return reason;
  }
  if (reason instanceof Error) {
    if (reason.name === 'TimeoutError' || isUserCancelledAbortError(reason)) return reason;
  }

  return createUserCancelledAbortError(reason);
}

export function getAbortReasonOrAbortErrorFromSignal(signal?: AbortSignal): DOMException | Error {
  const reason = signal?.reason;

  if (reason instanceof DOMException) return reason;
  if (reason instanceof Error) return reason;

  return createAbortError('This operation was aborted', reason);
}
