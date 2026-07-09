// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview HTTP client using GM_xmlhttpRequest for cross-origin support.
 */

import { getHttpRequestAdapter } from '@platform/index';
import type { HttpRequestDetails } from '@platform/types';
import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';
import { createDeferred } from '@shared/utils/async/promise-helpers';

interface HttpRequestOptions {
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  readonly data?: HttpRequestDetails['data'];
  readonly signal?: AbortSignal;
}

interface HttpResponse<T = unknown> {
  readonly ok: boolean;
  readonly status: number;
  readonly data: T;
}

export class HttpRequestService {
  /**
   * Default timeout for GM_xmlhttpRequest-based API calls (Twitter GraphQL etc.).
   *
   * NOTE: 10s vs DEFAULT_REQUEST_TIMEOUT_MS (30s) in @constants/performance:
   * - 10s (this): Short timeout for light JSON API requests (Twitter GraphQL calls
   *   via GM_xmlhttpRequest). These should complete in <3s; 10s is generous.
   * - 30s (DEFAULT_REQUEST_TIMEOUT_MS): Longer timeout used for media-download
   *   fetch operations (single-download, retry-fetch) and as the MV3 adapter's
   *   fallback default. Media files are larger and take longer to transfer.
   * Both values are intentionally different — not a drift bug.
   */
  private readonly defaultTimeout = 10000;

  async get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, options);
  }

  private async request<T>(
    method: string,
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const deferred = createDeferred<HttpResponse<T>>();
    const signal = options?.signal;

    let settled = false;

    const onAbort = (): void => {
      if (settled) return;
      settled = true;
      deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal!));
    };

    // Register the abort listener BEFORE checking signal.aborted to
    // eliminate the timing window where the signal becomes aborted
    // between the check and listener registration. The settled guard
    // prevents double-resolution in all cases.
    signal?.addEventListener('abort', onAbort, { once: true });

    if (signal?.aborted) {
      // Signal was already aborted — the { once: true } listener may
      // have fired synchronously during registration (implementation-
      // dependent). The settled guard prevents double reject.
      onAbort();
      return deferred.promise;
    }

    const settle = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      fn();
    };

    const details: HttpRequestDetails = {
      method: method as Exclude<HttpRequestDetails['method'], undefined>,
      url,
      timeout: options?.timeout ?? this.defaultTimeout,
      ...(options?.headers ? { headers: options.headers } : {}),
      responseType: options?.responseType as Exclude<HttpRequestDetails['responseType'], undefined>,
      ...(options?.data !== undefined ? { data: options.data } : {}),
      onload: (response) => {
        settle(() => {
          deferred.resolve({
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            data: response.response as T,
          });
        });
      },
      onerror: (response) => {
        settle(() => {
          const status = response.status ?? 0;
          const error = new Error(status === 0 ? 'NET' : `HTTP:${status}`) as Error & {
            status?: number;
          };
          error.status = status;
          deferred.reject(error);
        });
      },
      ontimeout: () => {
        settle(() => {
          const error = new Error('TIMEOUT') as Error & { status?: number };
          error.status = 0;
          deferred.reject(error);
        });
      },
      onabort: () => {
        settle(() => {
          if (signal) {
            deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
          } else {
            deferred.reject(new DOMException('Aborted', 'AbortError'));
          }
        });
      },
    };

    getHttpRequestAdapter().request(details);

    // Ensure abort listener is always cleaned up, even if the request
    // completes via an unexpected path (race condition guard).
    return deferred.promise.finally(() => {
      signal?.removeEventListener('abort', onAbort);
    });
  }
}

let httpServiceInstance: HttpRequestService | null = null;

export function getHttpRequestService(): HttpRequestService {
  if (!httpServiceInstance) {
    httpServiceInstance = new HttpRequestService();
  }
  return httpServiceInstance;
}

/** Reset singleton instance (for testing only) */
export function resetHttpRequestServiceForTests(): void {
  httpServiceInstance = null;
}
