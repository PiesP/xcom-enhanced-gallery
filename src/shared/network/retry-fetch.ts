import { isAbortError } from '@shared/async/delay';
import { withRetry } from '@shared/async/retry';
import { HttpRequestService } from '@shared/services/http-request-service';

export const DEFAULT_BACKOFF_BASE_MS = 200;

function createAbortError(message: string, cause?: unknown): Error {
  const error = new Error(message);
  error.name = 'AbortError';

  // Preserve the original abort reason for debugging without changing the user-facing message.
  if (cause !== undefined) {
    try {
      (error as Error & { cause?: unknown }).cause = cause;
    } catch {
      // ignore
    }
  }

  return error;
}

function getAbortErrorFromSignal(signal?: AbortSignal): DOMException | Error {
  const reason = signal?.reason;

  // Preserve timeout semantics when a timeout signal is used.
  if (reason instanceof DOMException && reason.name === 'TimeoutError') {
    return reason;
  }

  if (reason instanceof Error && reason.name === 'TimeoutError') {
    return reason;
  }

  // Preserve an already-standardized AbortError message.
  if (
    reason instanceof DOMException &&
    reason.name === 'AbortError' &&
    reason.message === 'Download cancelled by user'
  ) {
    return reason;
  }

  if (
    reason instanceof Error &&
    reason.name === 'AbortError' &&
    reason.message === 'Download cancelled by user'
  ) {
    return reason;
  }

  return createAbortError('Download cancelled by user', reason);
}

export async function fetchArrayBufferWithRetry(
  url: string,
  retries: number,
  signal?: AbortSignal,
  backoffBaseMs: number = DEFAULT_BACKOFF_BASE_MS
): Promise<Uint8Array> {
  if (signal?.aborted) {
    throw getAbortErrorFromSignal(signal);
  }

  const httpService = HttpRequestService.getInstance();

  // Interpret `retries` as additional attempts after the initial one.
  const maxAttempts = Math.max(1, retries + 1);

  const result = await withRetry(
    async () => {
      if (signal?.aborted) {
        throw getAbortErrorFromSignal(signal);
      }

      const options = {
        responseType: 'arraybuffer' as const,
        timeout: 30000,
        ...(signal ? { signal } : {}),
      };
      const response = await httpService.get<ArrayBuffer>(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return new Uint8Array(response.data);
    },
    {
      maxAttempts,
      baseDelayMs: backoffBaseMs,
      ...(signal ? { signal } : {}),
    }
  );

  if (result.success) {
    return result.data as Uint8Array;
  }

  if (isAbortError(result.error)) {
    throw result.error;
  }

  if (signal?.aborted) {
    throw getAbortErrorFromSignal(signal);
  }

  throw result.error;
}
