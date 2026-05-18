/**
 * @fileoverview HTTP client using GM_xmlhttpRequest for cross-origin support.
 */

import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';
import { getUserscript } from '@shared/external/userscript/adapter';
import type {
  GMXMLHttpRequestControl,
  GMXMLHttpRequestDetails,
} from '@shared/types/core/userscript';
import { createDeferred } from '@shared/utils/async/promise-helpers';

interface HttpRequestOptions {
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  readonly data?: GMXMLHttpRequestDetails['data'];
  readonly signal?: AbortSignal;
}

interface HttpResponse<T = unknown> {
  readonly ok: boolean;
  readonly status: number;
  readonly data: T;
}

let _httpInstance: HttpRequestService | null = null;

export class HttpRequestService {
  private readonly defaultTimeout = 10000;

  private constructor() {}

  static getInstance(): HttpRequestService {
    if (!_httpInstance) _httpInstance = new HttpRequestService();
    return _httpInstance;
  }

  /** @internal Test helper */
  static resetForTests(): void {
    _httpInstance = null;
  }

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

    if (signal?.aborted) {
      deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
      return deferred.promise;
    }

    const onAbort = (): void => {
      deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    const settle = (fn: () => void): void => {
      signal?.removeEventListener('abort', onAbort);
      fn();
    };

    const details: GMXMLHttpRequestDetails = {
      method: method as Exclude<GMXMLHttpRequestDetails['method'], undefined>,
      url,
      timeout: options?.timeout ?? this.defaultTimeout,
      headers: options?.headers,
      responseType: options?.responseType as Exclude<
        GMXMLHttpRequestDetails['responseType'],
        undefined
      >,
      data: options?.data,
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
          deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal));
        });
      },
    };

    const control = getUserscript().xmlHttpRequest(details);

    return deferred.promise;
  }
}
