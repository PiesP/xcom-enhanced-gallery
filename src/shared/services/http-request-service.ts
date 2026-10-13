// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview HTTP client using GM_xmlhttpRequest for cross-origin support.
 */

import { createDeferred } from '@piesp/browser-core/async';
import { safeResponseMetadata } from '@platform/http-response-metadata';
import { getHttpRequestAdapter } from '@platform/index';
import type {
  HttpErrorCategory,
  HttpRequestControl,
  HttpRequestDetails,
  HttpRequestResponse,
} from '@platform/types';
import { getAbortReasonOrAbortErrorFromSignal } from '@shared/error/cancellation';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import {
  downloadLiveByteBudget,
  type LiveByteBudget,
  type LiveByteLease,
  reserveBinaryResponse,
} from '@shared/services/download/live-byte-budget';

interface HttpRequestOptions {
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
  readonly responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  readonly data?: HttpRequestDetails['data'];
  readonly signal?: AbortSignal;
  readonly maxResponseBytes?: number;
}

export interface HttpResponse<T = unknown> {
  readonly ok: boolean;
  readonly status: number;
  readonly data: T;
  readonly readable?: boolean;
  readonly retryAfterMs?: number;
  readonly errorCategory?: HttpErrorCategory;
}

interface OwnedBinaryRequestOptions
  extends Omit<HttpRequestOptions, 'responseType' | 'maxResponseBytes'> {
  readonly responseType: 'blob' | 'arraybuffer';
  readonly maxResponseBytes: number;
  readonly budget?: LiveByteBudget;
}

interface OwnedBinaryResponse<T extends Blob | ArrayBuffer> extends HttpResponse<T> {
  readonly lease: LiveByteLease;
}

export class HttpRequestError extends Error {
  override readonly name = 'HttpRequestError';

  constructor(
    readonly status: number,
    readonly readable: boolean,
    readonly category: HttpErrorCategory,
    readonly retryAfterMs?: number
  ) {
    super(category === 'timeout' ? 'TIMEOUT' : status === 0 ? 'NET' : `HTTP:${status}`);
  }
}

function metadata(
  response: HttpRequestResponse,
  readable: boolean,
  category?: HttpErrorCategory
): Pick<HttpResponse, 'status' | 'readable' | 'retryAfterMs' | 'errorCategory'> {
  const safe = safeResponseMetadata(response, readable, category);
  return {
    status: safe.status,
    readable,
    ...(safe.retryAfterMs !== undefined ? { retryAfterMs: safe.retryAfterMs } : {}),
    ...(safe.errorCategory !== undefined ? { errorCategory: safe.errorCategory } : {}),
  };
}

function responseFailure(response: HttpRequestResponse): Error {
  if (response.response instanceof HttpResponseSizeLimitError) {
    return response.response;
  }
  const safe = metadata(response, false);
  return new HttpRequestError(
    safe.status,
    false,
    response.errorCategory ?? (safe.status > 0 ? 'unreadable' : 'network'),
    safe.retryAfterMs
  );
}

function timeoutFailure(response?: HttpRequestResponse): Error {
  const safe = response ? metadata(response, false) : undefined;
  return new HttpRequestError(safe?.status ?? 0, false, 'timeout', safe?.retryAfterMs);
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

  /** Reserve transport and output storage before starting a binary request. */
  async getOwnedBinary<T extends Blob | ArrayBuffer>(
    url: string,
    options: OwnedBinaryRequestOptions
  ): Promise<OwnedBinaryResponse<T>> {
    if (options.signal?.aborted) {
      throw getAbortReasonOrAbortErrorFromSignal(options.signal);
    }

    const { maxBytes, lease } = reserveBinaryResponse(
      options.budget ?? downloadLiveByteBudget,
      options.maxResponseBytes
    );
    const deferred = createDeferred<OwnedBinaryResponse<T>>();
    const signal = options.signal;
    let settled = false;
    let transportSettled = false;
    let control: HttpRequestControl | null = null;
    let abortRequested = false;
    let receivedBytes: number | null = null;

    const onTransportSettled = (): void => {
      if (transportSettled) {
        return;
      }
      transportSettled = true;
      if (receivedBytes !== null) {
        lease.shrink(receivedBytes);
      }
      lease.release();
    };
    const settle = (fn: () => void): boolean => {
      if (settled) {
        return false;
      }
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      fn();
      return true;
    };
    const abortTransport = (): void => {
      try {
        control?.abort();
      } catch {
        // A failed cancel call does not prove the opaque transport has stopped.
        // Its actual terminal callback still owns the response reservation.
      }
    };
    const onAbort = (): void => {
      abortRequested = true;
      if (!settle(() => deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal)))) {
        return;
      }
      abortTransport();
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      onTransportSettled();
      return deferred.promise;
    }

    const details: HttpRequestDetails = {
      method: 'GET',
      url,
      timeout: options.timeout ?? this.defaultTimeout,
      responseType: options.responseType,
      maxResponseBytes: maxBytes,
      ...(options.headers ? { headers: options.headers } : {}),
      onload: (response) => {
        if (settled) {
          return;
        }
        const data = response.response;
        if (
          (options.responseType === 'blob' && !(data instanceof Blob)) ||
          (options.responseType === 'arraybuffer' && !(data instanceof ArrayBuffer))
        ) {
          const safe = metadata(response, false, 'unreadable');
          settle(() =>
            deferred.reject(
              new HttpRequestError(safe.status, false, 'unreadable', safe.retryAfterMs)
            )
          );
          return;
        }
        const size = data instanceof Blob ? data.size : (data as ArrayBuffer).byteLength;
        if (size > maxBytes) {
          settle(() => deferred.reject(new HttpResponseSizeLimitError(maxBytes, size)));
          return;
        }
        receivedBytes = size;
        const safe = metadata(response, true, response.status >= 400 ? 'http' : undefined);
        settle(() =>
          deferred.resolve({
            ok: safe.status >= 200 && safe.status < 300,
            ...safe,
            data: data as T,
            lease: lease.fork(),
          })
        );
      },
      onerror: (response) => {
        settle(() => deferred.reject(responseFailure(response)));
      },
      ontimeout: (response) => {
        settle(() => deferred.reject(timeoutFailure(response)));
      },
      onabort: () => {
        settle(() =>
          deferred.reject(
            signal
              ? getAbortReasonOrAbortErrorFromSignal(signal)
              : new DOMException('Aborted', 'AbortError')
          )
        );
      },
      onsettled: onTransportSettled,
    };

    try {
      control = getHttpRequestAdapter().request(details);
      if (abortRequested) {
        abortTransport();
      }
    } catch (error) {
      settle(() => deferred.reject(error));
      onTransportSettled();
    }
    return deferred.promise;
  }

  private async request<T>(
    method: string,
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const deferred = createDeferred<HttpResponse<T>>();
    const signal = options?.signal;

    let settled = false;
    let control: HttpRequestControl | null = null;
    let abortRequested = false;

    const cleanup = (): void => {
      signal?.removeEventListener('abort', onAbort);
    };

    const settle = (fn: () => void): boolean => {
      if (settled) {
        return false;
      }
      settled = true;
      cleanup();
      fn();
      return true;
    };

    const onAbort = (): void => {
      abortRequested = true;
      if (!settle(() => deferred.reject(getAbortReasonOrAbortErrorFromSignal(signal)))) {
        return;
      }
      control?.abort();
    };

    // Register the abort listener BEFORE checking signal.aborted to
    // eliminate the timing window where the signal becomes aborted
    // between the check and listener registration. The settled guard
    // prevents double-resolution in all cases.
    signal?.addEventListener('abort', onAbort, { once: true });

    if (signal?.aborted) {
      onAbort();
      return deferred.promise;
    }

    const details: HttpRequestDetails = {
      method: method as Exclude<HttpRequestDetails['method'], undefined>,
      url,
      timeout: options?.timeout ?? this.defaultTimeout,
      ...(options?.headers ? { headers: options.headers } : {}),
      responseType: options?.responseType as Exclude<HttpRequestDetails['responseType'], undefined>,
      ...(options?.data !== undefined ? { data: options.data } : {}),
      ...(options?.maxResponseBytes !== undefined
        ? { maxResponseBytes: options.maxResponseBytes }
        : {}),
      onload: (response) => {
        settle(() => {
          const safe = metadata(response, true, response.status >= 400 ? 'http' : undefined);
          deferred.resolve({
            ok: safe.status >= 200 && safe.status < 300,
            ...safe,
            data: response.response as T,
          });
        });
      },
      onerror: (response) => {
        settle(() => deferred.reject(responseFailure(response)));
      },
      ontimeout: (response) => {
        settle(() => deferred.reject(timeoutFailure(response)));
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

    try {
      control = getHttpRequestAdapter().request(details);
      // An adapter can synchronously abort the caller's signal before it
      // returns its control object. Honor that abort after assignment.
      if (abortRequested) {
        control.abort();
      }
    } catch (error) {
      settle(() => deferred.reject(error));
    }

    return deferred.promise;
  }
}

let httpServiceInstance: HttpRequestService | null = null;

export function getHttpRequestService(): HttpRequestService {
  if (!httpServiceInstance) {
    httpServiceInstance = new HttpRequestService();
  }
  return httpServiceInstance;
}
