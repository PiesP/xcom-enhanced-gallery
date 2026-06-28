// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview HTTP client using GM_xmlhttpRequest for cross-origin support.
 */

import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';
import { getUserscript } from '@shared/external/userscript/adapter';
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

export class HttpRequestService {
  private readonly defaultTimeout = 10000;

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

    const details: GMXMLHttpRequestDetails = {
      method: method as Exclude<GMXMLHttpRequestDetails['method'], undefined>,
      url,
      timeout: options?.timeout ?? this.defaultTimeout,
      ...(options?.headers ? { headers: options.headers } : {}),
      responseType: options?.responseType as Exclude<
        GMXMLHttpRequestDetails['responseType'],
        undefined
      >,
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

    // NOTE: In MV3 environment, consider using getHttpRequestAdapter() instead.
    // For now, GM_xmlhttpRequest is used directly as it works in both environments.
    getUserscript().xmlHttpRequest(details);

    // Ensure abort listener is always cleaned up, even if the request
    // completes via an unexpected path (race condition guard).
    return deferred.promise.finally(() => {
      signal?.removeEventListener('abort', onAbort);
    });
  }
}
