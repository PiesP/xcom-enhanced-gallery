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
import { createDeferred, createSingleSettler } from '@shared/utils/async/promise-helpers';
import { createSingleton } from '@shared/utils/types/singleton';

function parseResponseHeaders(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;

  for (const line of raw.split(/\r?\n/)) {
    if (!line) continue;

    const idx = line.indexOf(':');
    if (idx <= 0) continue;

    const name = line.slice(0, idx).trim().toLowerCase();
    if (!name) continue;

    const value = line.slice(idx + 1).trim();
    out[name] = value;
  }

  return out;
}

function normalizeRequestHeaders(
  headers: Record<string, string> | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;

  for (const [key, value] of Object.entries(headers)) {
    out[key.toLowerCase()] = value;
  }

  return out;
}

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number; // milliseconds, default: 10000
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  data?: unknown;
  signal?: AbortSignal; // for cancellation
  contentType?: string; // MIME type for request body
}

/**
 * Binary request options - Phase 320
 * For sending ArrayBuffer or UInt8Array as request body
 */
export interface BinaryRequestOptions {
  headers?: Record<string, string>;
  timeout?: number; // milliseconds, default: 10000
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer'; // expected response type
  contentType?: string; // MIME type for binary data, default: 'application/octet-stream'
  signal?: AbortSignal; // for cancellation
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

/**
 * HTTP error with details
 */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
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
    options?: HttpRequestOptions | BinaryRequestOptions
  ): Promise<HttpResponse<T>> {
    const deferred = createDeferred<HttpResponse<T>>();

    let abortListener: (() => void) | null = null;
    const cleanupAbortListener = (): void => {
      if (abortListener && options?.signal) {
        options.signal.removeEventListener('abort', abortListener);
        abortListener = null;
      }
    };

    const { resolve: safeResolve, reject: safeReject } = createSingleSettler(deferred, () => {
      cleanupAbortListener();
    });

    try {
      const userscript = getUserscript();

      if (options?.signal?.aborted) {
        safeReject(getAbortReasonOrAbortErrorFromSignal(options.signal));
        return deferred.promise;
      }

      const headers: Record<string, string> = normalizeRequestHeaders(options?.headers);

      const details: GMXMLHttpRequestDetails = {
        method: method as Exclude<GMXMLHttpRequestDetails['method'], undefined>,
        url,
        headers,
        timeout: options?.timeout ?? this.defaultTimeout,
        onload: (response) => {
          const responseHeaders = parseResponseHeaders(response.responseHeaders);

          safeResolve({
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            statusText: response.statusText,
            data: response.response as T,
            headers: responseHeaders,
          });
        },
        onerror: (response) => {
          const status = response.status ?? 0;
          const statusText = response.statusText || 'Network Error';
          const errorMessage =
            status === 0
              ? `Network error: Unable to connect to ${url} (CORS, network failure, or blocked request)`
              : `HTTP ${status}: ${statusText}`;

          safeReject(new HttpError(errorMessage, status, statusText));
        },
        ontimeout: () => {
          const timeoutMs = options?.timeout ?? this.defaultTimeout;
          safeReject(
            new HttpError(`Request timed out after ${timeoutMs}ms for ${url}`, 0, 'Timeout')
          );
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

      if (options && 'data' in options && options.data !== undefined) {
        const data = options.data;
        const isBinaryLike =
          data instanceof Blob ||
          data instanceof ArrayBuffer ||
          (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(data)) ||
          data instanceof FormData ||
          data instanceof URLSearchParams;

        if (typeof data === 'object' && data !== null && !isBinaryLike) {
          details.data = JSON.stringify(data);
          if (!headers['content-type']) {
            headers['content-type'] = 'application/json';
          }
        } else {
          details.data = data as Exclude<GMXMLHttpRequestDetails['data'], undefined>;
        }
      }

      if (options?.contentType && !headers['content-type']) {
        headers['content-type'] = options.contentType;
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
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, { ...options, data });
  }

  /**
   * Perform a PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, { ...options, data });
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
    data?: unknown,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', url, { ...options, data });
  }

  /**
   * Send binary data (ArrayBuffer or UInt8Array) via POST request - Phase 320
   * Optimized for large binary payloads with proper Content-Type handling
   *
   * Requires @connect directive for target domain
   *
   * @param url Target endpoint
   * @param data ArrayBuffer or UInt8Array to send
   * @param options Binary request options (contentType defaults to 'application/octet-stream')
   * @returns Promise resolving to HTTP response with parsed data
   *
   * @example
   * ```typescript
   * // Send compressed data
   * const compressed = await compressData(largeData);
   * const response = await httpService.postBinary<ApiResponse>(
   *   'https://api.example.com/upload',
   *   compressed,
   *   {
   *     contentType: 'application/gzip',
   *     responseType: 'json',
   *     timeout: 30000
   *   }
   * );
   *
   * // Send raw binary data
   * const binary = new Uint8Array([1, 2, 3, 4, 5]);
   * const result = await httpService.postBinary(url, binary);
   * ```
   */
  async postBinary<T = unknown>(
    url: string,
    data: ArrayBuffer | Uint8Array,
    options?: BinaryRequestOptions
  ): Promise<HttpResponse<T>> {
    const contentType = options?.contentType ?? 'application/octet-stream';
    return await this.request<T>('POST', url, {
      ...options,
      data,
      contentType,
    });
  }
}

/**
 * Singleton instance getter for convenience (lazy loading)
 *
 * Use this as an alternative to getInstance() if you prefer shorter syntax.
 * Returns the singleton instance, creating it on first access.
 *
 * @returns HttpRequestService singleton instance
 */
export function getHttpRequestService(): HttpRequestService {
  return HttpRequestService.getInstance();
}
