// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension HTTP request adapter.
 *
 * Uses fetch() directly for same-origin requests.
 * For cross-origin requests, docstring previously claimed SW relay but
 * cross-origin requests go through fetch() directly in the content script
 * context (which has host_permissions to bypass CORS for allowed hosts).
 * If Twitter's CSP or CORS headers ever block content-script fetch(),
 * a SW relay can be implemented by extending the message protocol.
 */

import { DEFAULT_REQUEST_TIMEOUT_MS } from '@constants/performance';
import { isAllowedUrl } from '@shared/utils/url/url-safety';
import type {
  HttpRequestAdapter,
  HttpRequestControl,
  HttpRequestDetails,
  HttpRequestResponse,
} from './types';

export class MV3HttpRequestAdapter implements HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl {
    // SSRF prevention: validate URL before making the request (M1)
    if (!isAllowedUrl(details.url)) {
      details.onerror?.(this.createErrorResponse(details.url, 0));
      return { abort: () => {} };
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, details.timeout ?? DEFAULT_REQUEST_TIMEOUT_MS);

    this.fetchWithController(details, controller)
      .then((response) => {
        clearTimeout(timeoutId);
        details.onload?.(response);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        if (timedOut) {
          // M3: Distinguish timeout from abort — set timedOut flag before abort
          details.ontimeout?.(this.createErrorResponse(details.url, 0));
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          details.onabort?.(this.createErrorResponse(details.url, 0));
        } else {
          details.onerror?.(this.createErrorResponse(details.url, 0));
        }
      });

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
    const fetchInit: RequestInit = {
      method: details.method ?? 'GET',
      signal: controller.signal,
    };

    if (details.headers !== undefined) {
      fetchInit.headers = details.headers;
    }

    if (details.data !== undefined && details.method !== 'GET' && details.method !== 'HEAD') {
      fetchInit.body =
        typeof details.data === 'string' ||
        details.data instanceof Blob ||
        details.data instanceof ArrayBuffer ||
        details.data instanceof URLSearchParams
          ? details.data
          : typeof details.data === 'object'
            ? JSON.stringify(details.data)
            : details.data;
    }

    const response = await fetch(details.url, fetchInit);

    // Read response body based on responseType
    let responseBody: unknown;
    const responseType = details.responseType ?? 'text';
    switch (responseType) {
      case 'json':
        responseBody = await response.json();
        break;
      case 'blob':
        responseBody = await response.blob();
        break;
      case 'arraybuffer':
        responseBody = await response.arrayBuffer();
        break;
      default:
        responseBody = await response.text();
    }

    // Parse response headers into a single string
    const headersArray: string[] = [];
    response.headers.forEach((value, key) => {
      headersArray.push(`${key}: ${value}`);
    });

    return {
      finalUrl: response.url,
      readyState: 4,
      status: response.status,
      statusText: response.statusText,
      responseHeaders: headersArray.join('\r\n'),
      response: responseBody,
      // L1: Only stringify for text responses; return empty string for binary types
      responseText:
        responseType === 'text' || responseType === 'json' || responseType === undefined
          ? typeof responseBody === 'string'
            ? responseBody
            : JSON.stringify(responseBody)
          : '',
    } satisfies HttpRequestResponse;
  }

  private createErrorResponse(url: string, status: number): HttpRequestResponse {
    return {
      finalUrl: url,
      readyState: 0,
      status,
      statusText: status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`,
      responseHeaders: '',
      response: null,
      responseText: '',
    };
  }
}
