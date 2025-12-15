import { isAbortError } from '@shared/async/delay';
import { withRetry } from '@shared/async/retry';
import { HttpRequestService } from '@shared/services/http-request-service';

export const DEFAULT_BACKOFF_BASE_MS = 200;

export async function fetchArrayBufferWithRetry(
  url: string,
  retries: number,
  signal?: AbortSignal,
  backoffBaseMs: number = DEFAULT_BACKOFF_BASE_MS
): Promise<Uint8Array> {
  const httpService = HttpRequestService.getInstance();

  if (signal?.aborted) throw new Error('Download cancelled by user');

  // Interpret `retries` as additional attempts after the initial one.
  const maxAttempts = Math.max(1, retries + 1);

  const result = await withRetry(
    async () => {
      if (signal?.aborted) {
        throw signal.reason ?? new DOMException('Download cancelled by user', 'AbortError');
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

  if (isAbortError(result.error) || signal?.aborted) {
    throw new Error('Download cancelled by user');
  }

  throw result.error;
}
