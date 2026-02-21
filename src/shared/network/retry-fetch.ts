import { isAbortError } from '@shared/async/delay';
import { withRetry } from '@shared/async/retry';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { HttpRequestService } from '@shared/services/http-request-service';

export const DEFAULT_BACKOFF_BASE_MS = 200;

class HttpStatusError extends Error {
  override readonly name = 'HttpStatusError';

  constructor(readonly status: number) {
    super(`HTTP error: ${status}`);
  }
}

const isRetryableStatus = (status: number): boolean =>
  status === 0 ||
  status === 408 ||
  status === 425 ||
  status === 429 ||
  (status >= 500 && status < 600);

const getStatusFromError = (error: unknown): number | null => {
  if (!error || typeof error !== 'object' || !('status' in error)) return null;
  const statusValue = (error as { status?: unknown }).status;
  return typeof statusValue === 'number' ? statusValue : null;
};

export async function fetchArrayBufferWithRetry(
  url: string,
  retries: number,
  signal?: AbortSignal,
  backoffBaseMs: number = DEFAULT_BACKOFF_BASE_MS
): Promise<Uint8Array> {
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }

  const httpService = HttpRequestService.getInstance();
  const maxAttempts = Math.max(1, retries + 1);

  const result = await withRetry(
    async () => {
      if (signal?.aborted) {
        throw getUserCancelledAbortErrorFromSignal(signal);
      }

      const response = await httpService.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer' as const,
        timeout: 30000,
        ...(signal ? { signal } : {}),
      });

      if (!response.ok) {
        throw new HttpStatusError(response.status);
      }

      return new Uint8Array(response.data);
    },
    {
      maxAttempts,
      baseDelayMs: backoffBaseMs,
      ...(signal ? { signal } : {}),
      shouldRetry: (error) => {
        if (isAbortError(error)) return false;
        const status = getStatusFromError(error);
        if (status === null) return true;
        return isRetryableStatus(status);
      },
    }
  );

  // If successful, return data
  if (result.success) {
    return result.data;
  }

  // If the caller's signal is aborted, always normalize to user-facing AbortError
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }

  // Otherwise, throw the error from the last failed attempt
  throw result.error;
}
