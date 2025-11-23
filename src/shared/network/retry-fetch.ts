import { HttpRequestService } from "@shared/services/http-request-service";
import { globalTimerManager } from "@shared/utils/timer-management";

export const DEFAULT_BACKOFF_BASE_MS = 200;

export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  return new Promise<void>((resolve, reject) => {
    const timer = globalTimerManager.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new Error("Download cancelled by user"));
    };
    const cleanup = () => {
      globalTimerManager.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    if (signal) signal.addEventListener("abort", onAbort);
  });
}

export async function fetchArrayBufferWithRetry(
  url: string,
  retries: number,
  signal?: AbortSignal,
  backoffBaseMs: number = DEFAULT_BACKOFF_BASE_MS,
): Promise<Uint8Array> {
  const httpService = HttpRequestService.getInstance();
  let attempt = 0;

  while (true) {
    if (signal?.aborted) throw new Error("Download cancelled by user");
    try {
      const options = {
        responseType: "arraybuffer" as const,
        timeout: 30000,
        ...(signal ? { signal } : {}),
      };
      const response = await httpService.get<ArrayBuffer>(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return new Uint8Array(response.data);
    } catch (err) {
      if (attempt >= retries) throw err;
      attempt += 1;
      const delay = Math.max(0, Math.floor(backoffBaseMs * 2 ** (attempt - 1)));
      await sleep(delay, signal);
    }
  }
}
