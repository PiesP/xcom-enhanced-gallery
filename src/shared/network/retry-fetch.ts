import { isAbortError } from '@shared/async/delay';
import { withRetry } from '@shared/async/retry';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { HttpRequestService } from '@shared/services/http-request-service';

export const DEFAULT_BACKOFF_BASE_MS = 200;

class HttpStatusError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`HTTP status ${status}`);
    this.name = 'HttpStatusError';
    this.status = status;
  }
}

function isRetryableStatus(status: number): boolean {
  return (
    status === 0 ||
    status === 408 ||
    status === 425 ||
    status === 429 ||
    (status >= 500 && status < 600)
  );
}

function getStatusFromError(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    const statusValue = (error as { status?: unknown }).status;
    if (typeof statusValue === 'number') return statusValue;
  }
  return null;
}

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

  // Interpret `retries` as additional attempts after the initial one.
  const maxAttempts = Math.max(1, retries + 1);

  const result = await withRetry(
    async () => {
      if (signal?.aborted) {
        throw getUserCancelledAbortErrorFromSignal(signal);
      }

      const options = {
        responseType: 'arraybuffer' as const,
        timeout: 30000,
        ...(signal ? { signal } : {}),
      };
      const response = await httpService.get<ArrayBuffer>(url, options);
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
        if (status === null) return false;
        return isRetryableStatus(status);
      },
    }
  );

  if (result.success) {
    return result.data;
  }

  // If the caller's signal is aborted (including during retry backoff),
  // always normalize to our user-facing AbortError message.
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }

  if (isAbortError(result.error)) {
    throw result.error;
  }

  throw result.error;
}
