// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) HTTP request adapter.
 *
 * Wraps GM_xmlhttpRequest for cross-origin HTTP requests in userscript environments.
 */

import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import { getUserscript } from '@shared/external/userscript/adapter';
import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
import { isAllowedUrl } from '@shared/utils/url/url-safety';
import { safeResponseMetadata } from './http-response-metadata';
import type {
  HttpErrorCategory,
  HttpRequestAdapter,
  HttpRequestControl,
  HttpRequestDetails,
  HttpRequestResponse,
} from './types';

/**
 * Validate that a URL target is allowed by the shared SSRF prevention policy.
 * Throws synchronously if the URL is invalid, not in the allowed host set,
 * or violates path-level restrictions for Twitter hosts.
 */
function validateUrl(url: string): void {
  if (!isAllowedUrl(url)) {
    throw Object.assign(new Error('URL not in allowed whitelist'), {
      category: 'invalid_url' as const,
    });
  }
}

function safeFailureResponse(
  _url: string,
  source: HttpRequestResponse,
  category: HttpErrorCategory,
  statusText: string
): HttpRequestResponse {
  return {
    finalUrl: '',
    readyState: 0,
    statusText,
    response: null,
    responseText: '',
    ...safeResponseMetadata(source, false, category),
  };
}

const pendingAmbiguousSettlements = new Set<() => void>();

function arrayBufferByteLength(value: unknown): number | undefined {
  try {
    // The native getter checks the backing-store brand across manager realms.
    return Reflect.get(ArrayBuffer.prototype, 'byteLength', value) as number;
  } catch {
    return undefined;
  }
}

function onPageHide(event: PageTransitionEvent): void {
  if (!event.isTrusted || event.persisted) {
    return;
  }
  for (const settle of [...pendingAmbiguousSettlements]) {
    try {
      settle();
    } catch {
      // Continue settling other requests as this page realm ends.
    }
  }
}

function retainAmbiguousSettlement(settle: () => void): void {
  if (pendingAmbiguousSettlements.size === 0) {
    window.addEventListener('pagehide', onPageHide);
  }
  pendingAmbiguousSettlements.add(settle);
}

function forgetAmbiguousSettlement(settle: () => void): void {
  pendingAmbiguousSettlements.delete(settle);
  if (pendingAmbiguousSettlements.size === 0) {
    window.removeEventListener('pagehide', onPageHide);
  }
}

export class GMHttpRequestAdapter implements HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl {
    // SSRF prevention: validate URL before making the request
    validateUrl(details.url);

    const gm = getUserscript();
    const maxResponseBytes = details.maxResponseBytes;
    const boundedJson = details.responseType === 'json' && maxResponseBytes !== undefined;
    if (
      maxResponseBytes !== undefined &&
      (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes < 0)
    ) {
      throw new RangeError('maxResponseBytes must be a non-negative safe integer');
    }

    let gmControl: { abort: () => void } | null = null;
    let resourceLimitExceeded = false;
    let abortAfterStart = false;
    let transportSettled = false;
    const reportSettled = (): void => {
      if (transportSettled) {
        return;
      }
      transportSettled = true;
      if (details.onsettled) {
        forgetAmbiguousSettlement(reportSettled);
      }
      details.onsettled?.();
    };

    const reportResourceLimit = (receivedBytes?: number, source?: HttpRequestResponse): void => {
      if (maxResponseBytes === undefined || resourceLimitExceeded) {
        return;
      }
      resourceLimitExceeded = true;
      const error = new HttpResponseSizeLimitError(maxResponseBytes, receivedBytes);
      const sourceMetadata = source ? safeResponseMetadata(source, false) : undefined;
      if (gmControl) {
        gmControl.abort();
      } else {
        abortAfterStart = true;
      }
      details.onerror?.({
        finalUrl: '',
        readyState: 0,
        status: sourceMetadata?.status ?? 0,
        statusText: 'RESOURCE_LIMIT',
        responseHeaders: '',
        response: error,
        responseText: '',
        readable: false,
        errorCategory: 'resource_limit',
        ...(sourceMetadata?.retryAfterMs !== undefined
          ? { retryAfterMs: sourceMetadata.retryAfterMs }
          : {}),
      });
    };

    const getResponseSize = (response: unknown): number | undefined => {
      if (response instanceof Blob) {
        return response.size;
      }
      const bufferBytes = arrayBufferByteLength(response);
      if (bufferBytes !== undefined) {
        return bufferBytes;
      }
      if (ArrayBuffer.isView(response)) {
        return response.byteLength;
      }
      if (typeof response === 'string') {
        return new TextEncoder().encode(response).byteLength;
      }
      return undefined;
    };

    // Build GM-compatible details object respecting exactOptionalPropertyTypes
    const gmDetails: GMXMLHttpRequestDetails = {
      url: details.url,
    };

    if (details.method !== undefined) {
      gmDetails.method = details.method;
    }
    if (details.headers !== undefined) {
      gmDetails.headers = details.headers;
    }
    if (details.data !== undefined) {
      gmDetails.data = details.data;
    }
    if (details.responseType !== undefined) {
      // Managers may parse responseType=json before exposing a callback. Own
      // JSON parsing only after measuring the encoded body, even without progress.
      gmDetails.responseType = boundedJson ? 'arraybuffer' : details.responseType;
    }
    if (details.timeout !== undefined) {
      gmDetails.timeout = details.timeout;
    }
    if (details.onload !== undefined || maxResponseBytes !== undefined || details.onsettled) {
      gmDetails.onload = (response) => {
        try {
          if (resourceLimitExceeded) {
            return;
          }
          const responseSize = getResponseSize(response.response);
          if (
            maxResponseBytes !== undefined &&
            responseSize !== undefined &&
            responseSize > maxResponseBytes
          ) {
            reportResourceLimit(responseSize, response);
            return;
          }
          let responseBody = response.response;
          if (boundedJson) {
            if (arrayBufferByteLength(responseBody) === undefined) {
              details.onerror?.(
                safeFailureResponse(details.url, response, 'unreadable', 'UNREADABLE')
              );
              return;
            }
            try {
              responseBody = JSON.parse(new TextDecoder().decode(responseBody as ArrayBuffer));
            } catch {
              details.onerror?.(
                safeFailureResponse(details.url, response, 'unreadable', 'UNREADABLE')
              );
              return;
            }
          }
          if (
            !boundedJson &&
            details.responseType === 'json' &&
            response.response == null &&
            (typeof response.responseText !== 'string' || response.responseText.trim() !== 'null')
          ) {
            details.onerror?.(
              safeFailureResponse(details.url, response, 'unreadable', 'UNREADABLE')
            );
            return;
          }
          details.onload?.({
            finalUrl: '',
            readyState: 4,
            statusText: '',
            response: responseBody,
            responseText: '',
            ...safeResponseMetadata(response, true),
          });
        } finally {
          reportSettled();
        }
      };
    }
    if (details.onerror !== undefined || maxResponseBytes !== undefined || details.onsettled) {
      gmDetails.onerror = (response) => {
        try {
          if (!resourceLimitExceeded) {
            const status = safeResponseMetadata(response, false).status;
            details.onerror?.(
              safeFailureResponse(
                details.url,
                response,
                status > 0 ? 'unreadable' : 'network',
                status > 0 ? 'UNREADABLE' : 'NETWORK_ERROR'
              )
            );
          }
        } finally {
          reportSettled();
        }
      };
    }
    if (details.ontimeout !== undefined || details.onsettled) {
      gmDetails.ontimeout = (response) => {
        try {
          if (!resourceLimitExceeded) {
            details.ontimeout?.(safeFailureResponse(details.url, response, 'timeout', 'TIMEOUT'));
          }
        } finally {
          reportSettled();
        }
      };
    }
    if (details.onabort !== undefined || details.onsettled) {
      gmDetails.onabort = (response) => {
        try {
          if (!resourceLimitExceeded) {
            details.onabort?.(safeFailureResponse(details.url, response, 'abort', 'ABORT'));
          }
        } finally {
          reportSettled();
        }
      };
    }
    if (details.onprogress !== undefined || maxResponseBytes !== undefined) {
      gmDetails.onprogress = (response) => {
        if (resourceLimitExceeded) {
          return;
        }
        if (
          maxResponseBytes !== undefined &&
          (response.loaded > maxResponseBytes ||
            (response.lengthComputable && response.total > maxResponseBytes))
        ) {
          reportResourceLimit(Math.max(response.loaded, response.total), response);
          return;
        }
        const safe = safeResponseMetadata(response, false);
        details.onprogress?.({
          finalUrl: '',
          readyState: response.readyState,
          status: safe.status,
          statusText: '',
          responseHeaders: '',
          response: null,
          responseText: '',
          ...(safe.retryAfterMs !== undefined ? { retryAfterMs: safe.retryAfterMs } : {}),
          lengthComputable: response.lengthComputable,
          loaded: response.loaded,
          total: response.total,
        });
      };
    }

    try {
      gmControl = gm.xmlHttpRequest(gmDetails);
      if (abortAfterStart) {
        gmControl.abort();
      }
    } catch (_error) {
      // A GM implementation may dispatch and then throw without returning a
      // control object. Keep a bounded response owner until a real callback or
      // this page realm ends; caller failure alone is not terminal evidence.
      if (details.onsettled && !transportSettled) {
        retainAmbiguousSettlement(reportSettled);
      }
      if (transportSettled) {
        return { abort: () => {} };
      }
      if (resourceLimitExceeded) {
        return { abort: () => {} };
      }
      // L2: GM_xmlhttpRequest can throw synchronously outside of validateUrl
      try {
        details.onerror?.({
          finalUrl: '',
          readyState: 0,
          status: 0,
          statusText: 'NETWORK_ERROR',
          responseHeaders: '',
          response: null,
          responseText: '',
          readable: false,
          errorCategory: 'network',
        });
      } catch {
        // A caller callback failure cannot prove an opaque GM request ended.
      }
      return { abort: () => {} };
    }

    return {
      abort: () => gmControl?.abort(),
    };
  }
}
