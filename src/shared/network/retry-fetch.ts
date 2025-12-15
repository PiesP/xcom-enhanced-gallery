import { isAbortError } from '@shared/async/delay';
import { withRetry } from '@shared/async/retry';
import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { HttpRequestService } from '@shared/services/http-request-service';

export const DEFAULT_BACKOFF_BASE_MS = 200;

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
