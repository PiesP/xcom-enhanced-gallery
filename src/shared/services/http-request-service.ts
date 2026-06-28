// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview HTTP client using platform adapter for cross-origin support.
 *
 * SSOT: All HTTP requests go through getHttpRequestAdapter() which selects
 * the correct implementation (GM_xmlhttpRequest for userscripts, fetch/MV3
 * for extensions).
 */

import { getHttpRequestAdapter } from '@platform/index';
import type { HttpRequestDetails } from '@platform/types';
import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';
import { SingletonBase } from '@shared/services/singleton-base';
import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
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

/** Map internal response type to adapter response type */
function mapResponseType(
  type: HttpRequestOptions['responseType']
): NonNullable<HttpRequestDetails['responseType']> {
  return (type ?? 'text') as NonNullable<HttpRequestDetails['responseType']>;
}

export class HttpRequestService {
  private constructor() {}

  static getInstance(): HttpRequestService {
    return SingletonBase.get(
      () => _httpInstance,
      (inst) => {
        _httpInstance = inst;
      },
      () => new HttpRequestService()
    );
  }

  /** @internal Test helper */
  static resetForTests(): void {
    SingletonBase.reset(
      () => _httpInstance,
      (inst) => {
        _httpInstance = inst;
      }
    );
  }

  /** Destroy service */
  destroy(): void {
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

    let settled = false;

    const onAbort = (): void => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal!));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    const settle = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      fn();
    };

    // SS1: Use platform adapter (GM_xmlhttpRequest or MV3 fetch) instead of
    // calling GM API directly. This ensures proper SSOT — all HTTP requests
    // go through the adapter layer.
    const requestDetails: HttpRequestDetails = {
      method: (method || 'GET') as NonNullable<HttpRequestDetails['method']>,
      url,
      timeout: options?.timeout ?? 10000,
      responseType: mapResponseType(options?.responseType),
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

    // Add optional fields only when present (exactOptionalPropertyTypes compliance)
    if (options?.headers) {
      requestDetails.headers = options.headers;
    }
    if (options?.data !== undefined) {
      requestDetails.data = options.data as NonNullable<HttpRequestDetails['data']>;
    }

    const control = getHttpRequestAdapter().request(requestDetails);

    // Wire up AbortSignal to adapter's abort control
    const signalAbortHandler = (): void => {
      control.abort();
    };
    signal?.addEventListener('abort', signalAbortHandler, { once: true });

    // Ensure all listeners are cleaned up
    return deferred.promise.finally(() => {
      signal?.removeEventListener('abort', onAbort);
      signal?.removeEventListener('abort', signalAbortHandler);
    });
  }
}
