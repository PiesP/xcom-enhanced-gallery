// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Cancellation helpers: user-cancelled AbortError detection and creation.
 */

export { getErrorMessage, isCancellationError, mergeAbortSignals } from '@piesp/browser-core/error';

export const USER_CANCELLED_MESSAGE = 'Download cancelled by user' as const;

export function isAbortError(value: unknown): boolean {
  return (
    value instanceof DOMException && (value.name === 'AbortError' || value.name === 'TimeoutError')
  );
}

function isUserCancelledAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'AbortError' &&
    error.message === USER_CANCELLED_MESSAGE
  );
}

function createAbortError(message: string, cause?: unknown): DOMException {
  const error = new DOMException(message, 'AbortError');
  if (cause !== undefined) {
    (error as Error & { cause?: unknown }).cause = cause;
  }
  return error;
}

function createUserCancelledAbortError(cause?: unknown): DOMException {
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
