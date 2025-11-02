/**
 * HTTP Request Service - Phase 310
 *
 * Wraps Tampermonkey's GM_xmlHttpRequest API to provide a type-safe,
 * Promise-based HTTP client with support for timeouts, error handling,
 * and consistent request/response patterns.
 *
 * Usage:
 * ```typescript
 * const httpService = HttpRequestService.getInstance();
 * const response = await httpService.get<ApiData>(url, { timeout: 5000 });
 * if (response.ok) {
 *   console.log(response.data);
 * }
 * ```
 */

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number; // milliseconds, default: 10000
  responseType?: 'json' | 'text' | 'blob';
  data?: unknown;
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
 * Type definition for GM_xmlHttpRequest function
 */
interface GMXmlHttpRequestOptions {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  responseType?: 'json' | 'text' | 'blob';
  timeout?: number;
  onload?: (response: GMXmlHttpRequestResponse) => void;
  onerror?: (error: unknown) => void;
  ontimeout?: () => void;
}

interface GMXmlHttpRequestResponse {
  status: number;
  statusText: string;
  response: unknown;
  responseHeaders: string;
}

/**
 * Get GM_xmlHttpRequest function from userscript environment
 */
function getGMXmlHttpRequest(): ((options: GMXmlHttpRequestOptions) => void) | undefined {
  const gm = globalThis as Record<string, unknown> & {
    GM_xmlHttpRequest?: (options: GMXmlHttpRequestOptions) => void;
  };
  return gm.GM_xmlHttpRequest;
}

/**
 * Parse response headers from string format to object
 */
function parseResponseHeaders(headersStr: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!headersStr) return headers;

  headersStr.split('\r\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const name = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      headers[name.toLowerCase()] = value;
    }
  });

  return headers;
}

/**
 * Parse response data based on content type
 */
function parseResponseData(data: unknown, responseType?: 'json' | 'text' | 'blob'): unknown {
  if (responseType === 'json' || responseType === undefined) {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  }

  if (responseType === 'text') {
    return String(data);
  }

  return data;
}

/**
 * Singleton HTTP Request Service
 *
 * Provides a type-safe wrapper around Tampermonkey's GM_xmlHttpRequest API.
 * Supports GET, POST, PUT, and DELETE methods with Promise-based interface.
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
   * Perform a generic HTTP request
   */
  private request<T = unknown>(
    method: string,
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
      const gmXhr = getGMXmlHttpRequest();
      if (!gmXhr) {
        reject(
          new Error('GM_xmlHttpRequest is not available. This service requires Tampermonkey.')
        );
        return;
      }

      const timeout = options?.timeout ?? this.defaultTimeout;
      const timeoutHandle = globalThis.setTimeout(() => {
        reject(new HttpError(`Request timeout after ${timeout}ms`, 0, 'Timeout'));
      }, timeout);

      const requestOptions: GMXmlHttpRequestOptions = {
        ...(options?.headers ? { headers: options.headers } : {}),
        method,
        url,
        ...(options?.data ? { data: JSON.stringify(options.data) } : {}),
        responseType: (options?.responseType ?? 'json') as 'json' | 'text' | 'blob',
        onload: response => {
          clearTimeout(timeoutHandle);

          const ok = response.status >= 200 && response.status < 300;
          const parsedData = parseResponseData(response.response, options?.responseType);
          const parsedHeaders = parseResponseHeaders(response.responseHeaders);

          resolve({
            ok,
            status: response.status,
            statusText: response.statusText,
            data: parsedData as T,
            headers: parsedHeaders,
          });
        },
        onerror: error => {
          clearTimeout(timeoutHandle);
          reject(new HttpError(`Network error: ${String(error)}`, 0, 'Network Error'));
        },
        ontimeout: () => {
          clearTimeout(timeoutHandle);
          reject(new HttpError(`Request timeout after ${timeout}ms`, 0, 'Timeout'));
        },
      };

      gmXhr(requestOptions);
    });
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
}

/**
 * Singleton instance export for convenience
 */
export const httpRequestService = HttpRequestService.getInstance();
