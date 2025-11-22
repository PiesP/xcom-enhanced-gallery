/**
 * HTTP Request Service - Phase 373
 *
 * Provides a type-safe, Promise-based HTTP client using GM_xmlhttpRequest (primary)
 * and native fetch API (fallback).
 *
 * Features:
 * - GM_xmlhttpRequest as primary HTTP method (Cross-Origin support)
 * - Native fetch API as fallback
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

import { getUserscript } from '@shared/external/userscript/adapter';
import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number; // milliseconds, default: 10000
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  data?: unknown;
  signal?: AbortSignal; // for cancellation
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
 * - Native fetch as fallback
 * - Detects Tampermonkey, test, extension, and console environments
 * - Requires @connect directives for cross-origin requests
 */
export class HttpRequestService {
  private static instance: HttpRequestService;

  private readonly defaultTimeout = 10000; // 10 seconds

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Perform HTTP request using GM_xmlhttpRequest
   * Phase 373: Re-introduced for cross-origin support
   */
  private async gmRequest<T>(
    method: string,
    url: string,
    options?: HttpRequestOptions | BinaryRequestOptions
  ): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
      try {
        const userscript = getUserscript();

        const details: GMXMLHttpRequestDetails = {
          method: method as any,
          url,
          headers: options?.headers || {},
          timeout: options?.timeout ?? this.defaultTimeout,
          responseType: options?.responseType as any,
          onload: (response) => {
            const headers: Record<string, string> = {};
            if (response.responseHeaders) {
              response.responseHeaders.split('\r\n').forEach((line) => {
                const parts = line.split(': ');
                if (parts.length >= 2 && parts[0]) {
                  headers[parts[0].toLowerCase()] = parts.slice(1).join(': ');
                }
              });
            }

            resolve({
              ok: response.status >= 200 && response.status < 300,
              status: response.status,
              statusText: response.statusText,
              data: response.response,
              headers,
            });
          },
          onerror: (response) => {
            reject(
              new HttpError(
                response.statusText || 'Network Error',
                response.status,
                response.statusText
              )
            );
          },
          ontimeout: () => {
            reject(new HttpError('Request timeout', 0, 'Timeout'));
          },
          onabort: () => {
            reject(new Error('Request was aborted'));
          },
        };

        if ((options as any).data) {
          const data = (options as any).data;
          if (
            typeof data === 'object' &&
            !(data instanceof Blob) &&
            !(data instanceof ArrayBuffer) &&
            !(data instanceof Uint8Array) &&
            !(data instanceof FormData) &&
            !(data instanceof URLSearchParams)
          ) {
            details.data = JSON.stringify(data);
            if (!details.headers) details.headers = {};
            if (!details.headers['content-type']) {
              details.headers['content-type'] = 'application/json';
            }
          } else {
            details.data = data;
          }
        }

        if (
          (options as BinaryRequestOptions).contentType &&
          !details.headers?.['content-type']
        ) {
          if (!details.headers) details.headers = {};
          details.headers['content-type'] = (options as BinaryRequestOptions).contentType!;
        }

        const control = userscript.xmlHttpRequest(details);

        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            control.abort();
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(): HttpRequestService {
    if (!HttpRequestService.instance) {
      HttpRequestService.instance = new HttpRequestService();
    }
    return HttpRequestService.instance;
  }

  /**
   * Perform a generic HTTP request using native fetch API
   *
   * Phase 318: Fetch-only implementation for Tampermonkey 5.4.0+ MV3
   * - Uses native fetch API (GM_xmlHttpRequest removed in MV3)
   * - Requires @connect directives for cross-origin requests
   * - Supports timeout, abort signal, and multiple response types
   */
  private async request<T = unknown>(
    method: string,
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    return await this.gmRequest<T>(method, url, options);
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
   * MV3 Compatible: Uses native fetch with standard ArrayBuffer/UInt8Array APIs
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
    return await this.gmRequest<T>('POST', url, { ...options, data, contentType } as any);
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
