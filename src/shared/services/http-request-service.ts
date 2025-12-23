/**
 * HTTP Request Service - Phase 373
 *
 * Provides a type-safe, Promise-based HTTP client using GM_xmlhttpRequest.
 *
 * Features:
 * - GM_xmlhttpRequest as primary HTTP method (Cross-Origin support)
 * - Support for GET, POST, PUT, DELETE, PATCH methods
 * - Timeout handling and abort signal support
 * - Multiple response types: json, text, blob, arraybuffer
 * - Requires @connect directives for cross-origin requests
 *
 * Usage:
 * ```typescript
 * const httpService = HttpRequestService.getInstance();
 * const response = await httpService.get<ApiData>(url, { timeout: 5000 });
 * if (response.ok) {
 *   console.log(response.data);
 * }
 * ```
 *
 * @connect Requirements:
 * Add target domains to UserScript header for CORS:
 * // @connect api.twitter.com
 * // @connect pbs.twimg.com
 */

import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';
import { getUserscript } from '@shared/external/userscript';
import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
import { createDeferred } from '@shared/utils/async/promise-helpers';
import { createSingleton } from '@shared/utils/types/singleton';

type HttpRequestData = Exclude<GMXMLHttpRequestDetails['data'], undefined>;

/**
 * HTTP request options
 */
interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number; // milliseconds, default: 10000
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  data?: HttpRequestData;
  signal?: AbortSignal; // for cancellation
}

/**
 * HTTP response wrapper
 */
interface HttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Singleton HTTP Request Service
 *
 * Provides HTTP client for Tampermonkey environment.
 * Uses GM_xmlhttpRequest as primary method for cross-origin support.
 *
 * Features:
 * - Phase 373: GM_xmlhttpRequest as primary HTTP method
 * - Detects Tampermonkey, test, extension, and console environments
 * - Requires @connect directives for cross-origin requests
 */
export class HttpRequestService {
  private static readonly singleton = createSingleton(() => new HttpRequestService());

  private readonly defaultTimeout = 10000; // 10 seconds

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Perform HTTP request using GM_xmlhttpRequest
   * Phase 373: Re-introduced for cross-origin support
   */
  private async request<T>(
    method: string,
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const deferred = createDeferred<HttpResponse<T>>();

    let abortListener: (() => void) | null = null;
    const cleanupAbortListener = (): void => {
      if (abortListener && options?.signal) {
        options.signal.removeEventListener('abort', abortListener);
        abortListener = null;
      }
    };

    let settled = false;
    const safeResolve = (value: HttpResponse<T>): void => {
      if (settled) return;
      settled = true;
      try {
        cleanupAbortListener();
      } catch {
        // ignore
      }
      deferred.resolve(value);
    };
    const safeReject = (reason: unknown): void => {
      if (settled) return;
      settled = true;
      try {
        cleanupAbortListener();
      } catch {
        // ignore
      }
      deferred.reject(reason);
    };

    try {
      const userscript = getUserscript();

      if (options?.signal?.aborted) {
        safeReject(getAbortReasonOrAbortErrorFromSignal(options.signal));
        return deferred.promise;
      }

      const headers = options?.headers;

      const details: GMXMLHttpRequestDetails = {
        method: method as Exclude<GMXMLHttpRequestDetails['method'], undefined>,
        url,
        ...(headers ? { headers } : {}),
        timeout: options?.timeout ?? this.defaultTimeout,
        onload: (response) => {
          safeResolve({
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            data: response.response as T,
          });
        },
        onerror: (response) => {
          const status = response.status ?? 0;
          const errorMessage = status === 0 ? 'NET' : `HTTP:${status}`;

          const error = new Error(errorMessage) as Error & { status?: number };
          error.status = status;
          safeReject(error);
        },
        ontimeout: () => {
          const error = new Error('TIMEOUT') as Error & { status?: number };
          error.status = 0;
          safeReject(error);
        },
        onabort: () => {
          safeReject(getAbortReasonOrAbortErrorFromSignal(options?.signal));
        },
      };

      // Avoid passing `responseType: undefined` to GM implementations.
      if (options?.responseType) {
        details.responseType = options.responseType as Exclude<
          GMXMLHttpRequestDetails['responseType'],
          undefined
        >;
      }

      const data = options?.data;
      if (data !== undefined) {
        details.data = data;
      }

      const control = userscript.xmlHttpRequest(details);

      if (options?.signal) {
        abortListener = () => {
          control.abort();
        };

        options.signal.addEventListener('abort', abortListener, { once: true });

        // Handle races where the signal is aborted right after the request starts.
        if (options.signal.aborted) {
          abortListener();
        }
      }
    } catch (error) {
      safeReject(error);
    }

    return deferred.promise;
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(): HttpRequestService {
    return HttpRequestService.singleton.get();
  }

  /** @internal Test helper */
  static resetForTests(): void {
    HttpRequestService.singleton.reset?.();
  }

  /**
   * Perform a GET request
   */
  async get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, options);
  }

  /**
   * Perform a POST request
   */
  async post<T = unknown>(
    url: string,
    data?: HttpRequestData,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const nextOptions = data === undefined ? options : { ...options, data };
    return this.request<T>('POST', url, nextOptions);
  }

  /**
   * Perform a PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: HttpRequestData,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const nextOptions = data === undefined ? options : { ...options, data };
    return this.request<T>('PUT', url, nextOptions);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, options);
  }

  /**
   * Perform a PATCH request
   */
  async patch<T = unknown>(
    url: string,
    data?: HttpRequestData,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const nextOptions = data === undefined ? options : { ...options, data };
    return this.request<T>('PATCH', url, nextOptions);
  }
}
