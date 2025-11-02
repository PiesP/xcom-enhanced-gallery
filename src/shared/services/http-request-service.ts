/**
 * HTTP Request Service - Phase 318
 *
 * Provides a type-safe, Promise-based HTTP client using native fetch API.
 * Designed for Tampermonkey 5.4.0+ Manifest V3 environments where
 * GM_xmlHttpRequest is no longer available.
 *
 * Features:
 * - Native fetch API as primary HTTP method
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

import { logger } from '@shared/logging';

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
 * Validation result for HTTP request availability
 */
export interface AvailabilityCheckResult {
  available: boolean;
  environment: string;
  message: string;
  canFallback: boolean;
}

/**
 * Singleton HTTP Request Service
 *
 * Provides fetch-based HTTP client for Tampermonkey 5.4.0+ MV3 environment.
 * Uses native fetch API as primary method (GM_xmlHttpRequest removed in MV3).
 *
 * Features:
 * - Phase 318: Native fetch as primary HTTP method (MV3 compatible)
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
   * Get or create the singleton instance
   */
  static getInstance(): HttpRequestService {
    if (!HttpRequestService.instance) {
      HttpRequestService.instance = new HttpRequestService();
    }
    return HttpRequestService.instance;
  }

  /**
   * Validate HTTP request availability in current environment
   *
   * Phase 318: Fetch-based validation for MV3 compatibility
   * Note: Always returns available=true since fetch is a standard browser API
   *
   * @returns Availability status with environment info
   *
   * @example
   * ```typescript
   * const validation = await httpService.validateAvailability();
   * console.log(validation.message); // Environment and fetch availability
   * ```
   */
  async validateAvailability(): Promise<AvailabilityCheckResult> {
    // Dynamically import to avoid circular dependencies
    const { detectEnvironment, getEnvironmentDescription } = await import(
      '@shared/external/userscript'
    );

    const env = detectEnvironment();
    const hasFetch = typeof globalThis.fetch === 'function';

    return {
      available: hasFetch,
      environment: env.environment,
      message: hasFetch
        ? `✅ Fetch API available in ${env.environment} environment (Tampermonkey 5.4.0+ MV3 compatible)`
        : `⚠️ Fetch API not available. ${getEnvironmentDescription(env)}. This should not happen in modern browsers.`,
      canFallback: false, // No fallback needed, fetch is primary
    };
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
    const timeout = options?.timeout ?? this.defaultTimeout;

    try {
      // Check for abort signal before starting
      if (options?.signal?.aborted) {
        throw new Error('Request was aborted');
      }

      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method,
        signal: options?.signal || controller.signal,
      };

      // Add headers if present
      if (options?.headers) {
        fetchOptions.headers = options.headers;
      }

      // Only add body if data exists and method requires it
      if (options?.data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(options.data);
        // Ensure content-type header is set for JSON data
        if (!options?.headers?.['content-type']) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'content-type': 'application/json',
          };
        }
      }

      logger.debug(`[HttpRequestService] ${method} request to ${url}`, {
        hasHeaders: !!options?.headers,
        hasData: !!options?.data,
        timeout,
      });

      const response = await fetch(url, fetchOptions);
      globalThis.clearTimeout(timeoutId);

      let data: unknown;

      // Parse response based on requested type
      if (options?.responseType === 'blob') {
        data = await response.blob();
      } else if (options?.responseType === 'arraybuffer') {
        data = await response.arrayBuffer();
      } else if (options?.responseType === 'text') {
        data = await response.text();
      } else {
        // Default to JSON, fallback to text if parse fails
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
      }

      // Convert Headers to plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      logger.debug(`[HttpRequestService] ${method} response from ${url}`, {
        status: response.status,
        ok: response.ok,
        contentType: headers['content-type'],
      });

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data as T,
        headers,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(`Request timeout after ${timeout}ms`, 0, 'Timeout');
      }
      if (error instanceof Error && error.message === 'Request was aborted') {
        throw new Error('Request was aborted');
      }
      throw new HttpError(
        `Fetch error: ${error instanceof Error ? error.message : String(error)}`,
        0,
        'Network Error'
      );
    }
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
    const timeout = options?.timeout ?? this.defaultTimeout;
    const contentType = options?.contentType ?? 'application/octet-stream';

    try {
      // Validate binary data
      if (!data || (!(data instanceof ArrayBuffer) && !(data instanceof Uint8Array))) {
        throw new Error('Data must be ArrayBuffer or Uint8Array');
      }

      // Check for abort signal before starting
      if (options?.signal?.aborted) {
        throw new Error('Request was aborted');
      }

      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), timeout);

      // Convert Uint8Array to ArrayBuffer if needed (for consistent body handling)
      let bodyData: ArrayBufferLike;
      if (data instanceof Uint8Array) {
        // Create a proper copy to avoid SharedArrayBuffer type issues
        const copy = new Uint8Array(data);
        bodyData = copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength);
      } else {
        bodyData = data;
      }

      const fetchOptions: RequestInit = {
        method: 'POST',
        signal: options?.signal || controller.signal,
        body: bodyData,
        headers: {
          'content-type': contentType,
          ...options?.headers,
        },
      };

      logger.debug(`[HttpRequestService] POST binary request to ${url}`, {
        size: bodyData.byteLength,
        contentType,
        timeout,
        hasHeaders: !!options?.headers,
      });

      const response = await fetch(url, fetchOptions);
      globalThis.clearTimeout(timeoutId);

      let responseData: unknown;

      // Parse response based on requested type
      if (options?.responseType === 'blob') {
        responseData = await response.blob();
      } else if (options?.responseType === 'arraybuffer') {
        responseData = await response.arrayBuffer();
      } else if (options?.responseType === 'text') {
        responseData = await response.text();
      } else {
        // Default to JSON, fallback to text if parse fails
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }
      }

      // Convert Headers to plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      logger.debug(`[HttpRequestService] POST binary response from ${url}`, {
        status: response.status,
        ok: response.ok,
        contentType: headers['content-type'],
      });

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData as T,
        headers,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(`Binary request timeout after ${timeout}ms`, 0, 'Timeout');
      }
      if (error instanceof Error && error.message === 'Request was aborted') {
        throw new Error('Request was aborted');
      }
      throw new HttpError(
        `Binary request error: ${error instanceof Error ? error.message : String(error)}`,
        0,
        'Network Error'
      );
    }
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
