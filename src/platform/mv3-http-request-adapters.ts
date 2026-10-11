// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension HTTP request adapter.
 *
 * Uses fetch() in the content-script context with the shared URL allowlist.
 * Browser policy can leave responses or their headers inaccessible. This
 * adapter has no service-worker HTTP relay and reports that uncertainty.
 */

import { DEFAULT_REQUEST_TIMEOUT_MS } from '@constants/performance';
import { isHttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import { readResponseBody } from '@shared/network/bounded-response';
import { isAllowedUrl } from '@shared/utils/url/url-safety';
import { parseRetryAfter, validatedHttpStatus } from './http-response-metadata';
import type {
  HttpRequestAdapter,
  HttpRequestControl,
  HttpRequestDetails,
  HttpRequestResponse,
} from './types';

class HttpBodyReadError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs: number | undefined,
    override readonly cause: unknown
  ) {
    super('HTTP response body unreadable');
  }
}

export class MV3HttpRequestAdapter implements HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl {
    // SSRF prevention: validate URL before making the request (M1)
    if (!isAllowedUrl(details.url)) {
      try {
        details.onerror?.(
          this.createErrorResponse(details.url, 0, 'NETWORK_ERROR', null, 'invalid_url')
        );
      } finally {
        details.onsettled?.();
      }
      return { abort: () => {} };
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, details.timeout ?? DEFAULT_REQUEST_TIMEOUT_MS);

    void this.fetchWithController(details, controller)
      .then(
        (response) => {
          if (controller.signal.aborted) {
            const callback = timedOut ? details.ontimeout : details.onabort;
            callback?.(
              this.createErrorResponse(
                details.url,
                response.status,
                timedOut ? 'TIMEOUT' : 'ABORT',
                null,
                timedOut ? 'timeout' : 'abort',
                response.retryAfterMs
              )
            );
          } else {
            details.onload?.(response);
          }
        },
        (error: unknown) => {
          clearTimeout(timeoutId);
          if (error instanceof HttpBodyReadError) {
            const resourceLimit = isHttpResponseSizeLimitError(error.cause);
            if (resourceLimit) {
              details.onerror?.(
                this.createErrorResponse(
                  details.url,
                  error.status,
                  'RESOURCE_LIMIT',
                  error.cause,
                  'resource_limit',
                  error.retryAfterMs
                )
              );
            } else if (timedOut) {
              details.ontimeout?.(
                this.createErrorResponse(
                  details.url,
                  error.status,
                  'TIMEOUT',
                  null,
                  'timeout',
                  error.retryAfterMs
                )
              );
            } else if (controller.signal.aborted) {
              details.onabort?.(
                this.createErrorResponse(
                  details.url,
                  error.status,
                  'ABORT',
                  null,
                  'abort',
                  error.retryAfterMs
                )
              );
            } else {
              details.onerror?.(
                this.createErrorResponse(
                  details.url,
                  error.status,
                  'UNREADABLE',
                  null,
                  'unreadable',
                  error.retryAfterMs
                )
              );
            }
          } else if (isHttpResponseSizeLimitError(error)) {
            details.onerror?.(
              this.createErrorResponse(details.url, 0, 'RESOURCE_LIMIT', error, 'resource_limit')
            );
          } else if (timedOut) {
            // M3: Distinguish timeout from abort — set timedOut flag before abort
            details.ontimeout?.(
              this.createErrorResponse(details.url, 0, 'TIMEOUT', null, 'timeout')
            );
          } else if (error instanceof DOMException && error.name === 'AbortError') {
            details.onabort?.(this.createErrorResponse(details.url, 0, 'ABORT', null, 'abort'));
          } else {
            details.onerror?.(
              this.createErrorResponse(details.url, 0, 'NETWORK_ERROR', null, 'network')
            );
          }
        }
      )
      .finally(() => {
        clearTimeout(timeoutId);
        details.onsettled?.();
      })
      // Caller callbacks are outside fetch; their exceptions must not strand the task promise.
      .catch(() => undefined);

    return {
      abort: () => {
        clearTimeout(timeoutId);
        controller.abort();
      },
    };
  }

  private async fetchWithController(
    details: HttpRequestDetails,
    controller: AbortController
  ): Promise<HttpRequestResponse> {
    const method = details.method ?? 'GET';
    const fetchInit: RequestInit = {
      method,
      signal: controller.signal,
    };

    if (details.headers !== undefined) {
      fetchInit.headers = details.headers;
    }

    if (details.data !== undefined && method !== 'GET' && method !== 'HEAD') {
      fetchInit.body =
        typeof details.data === 'string' ||
        details.data instanceof FormData ||
        details.data instanceof Blob ||
        details.data instanceof ArrayBuffer ||
        details.data instanceof URLSearchParams ||
        details.data instanceof ReadableStream
          ? details.data
          : typeof details.data === 'object'
            ? JSON.stringify(details.data)
            : details.data;
    }

    const response = await fetch(details.url, fetchInit);

    const responseType = details.responseType ?? 'text';
    const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
    let responseBody: unknown;
    try {
      responseBody = await readResponseBody(
        response,
        responseType,
        details.maxResponseBytes,
        (reason) => controller.abort(reason)
      );
    } catch (error) {
      throw new HttpBodyReadError(validatedHttpStatus(response.status), retryAfterMs, error);
    }
    if (controller.signal.aborted) {
      throw new HttpBodyReadError(
        validatedHttpStatus(response.status),
        retryAfterMs,
        new DOMException('Aborted', 'AbortError')
      );
    }

    return {
      finalUrl: '',
      readyState: 4,
      status: validatedHttpStatus(response.status),
      statusText: response.statusText,
      responseHeaders: '',
      response: responseBody,
      readable: true,
      ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
      // L1: Only stringify for text responses; return empty string for binary types
      responseText:
        responseType === 'text' || responseType === 'json' || responseType === undefined
          ? typeof responseBody === 'string'
            ? responseBody
            : JSON.stringify(responseBody)
          : '',
    } satisfies HttpRequestResponse;
  }

  private createErrorResponse(
    _url: string,
    status: number,
    statusText = status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`,
    response: unknown = null,
    errorCategory: HttpRequestResponse['errorCategory'] = 'network',
    retryAfterMs?: number
  ): HttpRequestResponse {
    return {
      finalUrl: '',
      readyState: 0,
      status: validatedHttpStatus(status),
      statusText,
      responseHeaders: '',
      response,
      responseText: '',
      readable: false,
      errorCategory,
      ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
    };
  }
}
