import { delay, isAbortError } from '@shared/async/delay';
import { HttpRequestService } from '@shared/services/http-request-service';

export const DEFAULT_BACKOFF_BASE_MS = 200;

export async function fetchArrayBufferWithRetry(
  url: string,
  retries: number,
  signal?: AbortSignal,
  backoffBaseMs: number = DEFAULT_BACKOFF_BASE_MS
): Promise<Uint8Array> {
  const httpService = HttpRequestService.getInstance();
  let attempt = 0;

  while (true) {
    if (signal?.aborted) throw new Error('Download cancelled by user');
    try {
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
    } catch (err) {
      // Re-throw abort errors immediately
      if (isAbortError(err)) {
        throw new Error('Download cancelled by user');
      }
      if (attempt >= retries) throw err;
      attempt += 1;
      const backoffMs = Math.max(0, Math.floor(backoffBaseMs * 2 ** (attempt - 1)));
      try {
        await delay(backoffMs, signal);
      } catch (delayErr) {
        // Convert abort error during delay to user-friendly message
        if (isAbortError(delayErr)) {
          throw new Error('Download cancelled by user');
        }
        throw delayErr;
      }
    }
  }
}
