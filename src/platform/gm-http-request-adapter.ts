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
import type { HttpRequestAdapter, HttpRequestControl, HttpRequestDetails } from './types';

/**
 * Validate that a URL target is allowed by the shared SSRF prevention policy.
 * Throws synchronously if the URL is invalid, not in the allowed host set,
 * or violates path-level restrictions for Twitter hosts.
 */
function validateUrl(url: string): void {
  if (!isAllowedUrl(url)) {
    throw new Error(`URL not in allowed whitelist: ${url}`);
  }
}

const pendingAmbiguousSettlements = new Set<() => void>();

function onPageHide(event: PageTransitionEvent): void {
  if (event.persisted) return;
  for (const settle of [...pendingAmbiguousSettlements]) {
    try {
      settle();
    } catch {
      // Continue settling other requests as this page realm ends.
    }
  }
}

function retainAmbiguousSettlement(settle: () => void): void {
  if (pendingAmbiguousSettlements.size === 0) window.addEventListener('pagehide', onPageHide);
  pendingAmbiguousSettlements.add(settle);
}

function forgetAmbiguousSettlement(settle: () => void): void {
  pendingAmbiguousSettlements.delete(settle);
  if (pendingAmbiguousSettlements.size === 0) window.removeEventListener('pagehide', onPageHide);
}

export class GMHttpRequestAdapter implements HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl {
    // SSRF prevention: validate URL before making the request
    validateUrl(details.url);

    const gm = getUserscript();
    const maxResponseBytes = details.maxResponseBytes;
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
      if (transportSettled) return;
      transportSettled = true;
      if (details.onsettled) forgetAmbiguousSettlement(reportSettled);
      details.onsettled?.();
    };

    const reportResourceLimit = (receivedBytes?: number): void => {
      if (maxResponseBytes === undefined || resourceLimitExceeded) return;
      resourceLimitExceeded = true;
      const error = new HttpResponseSizeLimitError(maxResponseBytes, receivedBytes);
      if (gmControl) gmControl.abort();
      else abortAfterStart = true;
      details.onerror?.({
        finalUrl: details.url,
        readyState: 0,
        status: 0,
        statusText: 'RESOURCE_LIMIT',
        responseHeaders: '',
        response: error,
        responseText: '',
      });
    };

    const getResponseSize = (response: unknown): number | undefined => {
      if (response instanceof Blob) return response.size;
      if (response instanceof ArrayBuffer) return response.byteLength;
      if (ArrayBuffer.isView(response)) return response.byteLength;
      if (typeof response === 'string') return new TextEncoder().encode(response).byteLength;
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
      gmDetails.responseType = details.responseType;
    }
    if (details.timeout !== undefined) {
      gmDetails.timeout = details.timeout;
    }
    if (details.onload !== undefined || maxResponseBytes !== undefined || details.onsettled) {
      gmDetails.onload = (response) => {
        try {
          if (resourceLimitExceeded) return;
          const responseSize = getResponseSize(response.response);
          if (
            maxResponseBytes !== undefined &&
            responseSize !== undefined &&
            responseSize > maxResponseBytes
          ) {
            reportResourceLimit(responseSize);
            return;
          }
          details.onload?.(response);
        } finally {
          reportSettled();
        }
      };
    }
    if (details.onerror !== undefined || maxResponseBytes !== undefined || details.onsettled) {
      gmDetails.onerror = (response) => {
        try {
          if (!resourceLimitExceeded) details.onerror?.(response);
        } finally {
          reportSettled();
        }
      };
    }
    if (details.ontimeout !== undefined || details.onsettled) {
      gmDetails.ontimeout = (response) => {
        try {
          if (!resourceLimitExceeded) details.ontimeout?.(response);
        } finally {
          reportSettled();
        }
      };
    }
    if (details.onabort !== undefined || details.onsettled) {
      gmDetails.onabort = (response) => {
        try {
          if (!resourceLimitExceeded) details.onabort?.(response);
        } finally {
          reportSettled();
        }
      };
    }
    if (details.onprogress !== undefined || maxResponseBytes !== undefined) {
      gmDetails.onprogress = (response) => {
        if (resourceLimitExceeded) return;
        if (
          maxResponseBytes !== undefined &&
          (response.loaded > maxResponseBytes ||
            (response.lengthComputable && response.total > maxResponseBytes))
        ) {
          reportResourceLimit(Math.max(response.loaded, response.total));
          return;
        }
        details.onprogress?.(response);
      };
    }

    try {
      gmControl = gm.xmlHttpRequest(gmDetails);
      if (abortAfterStart) gmControl.abort();
    } catch (_error) {
      // A GM implementation may dispatch and then throw without returning a
      // control object. Keep a bounded response owner until a real callback or
      // this page realm ends; caller failure alone is not terminal evidence.
      if (details.onsettled && !transportSettled) {
        retainAmbiguousSettlement(reportSettled);
      }
      if (transportSettled) return { abort: () => {} };
      if (resourceLimitExceeded) {
        return { abort: () => {} };
      }
      // L2: GM_xmlhttpRequest can throw synchronously outside of validateUrl
      try {
        details.onerror?.({
          finalUrl: details.url,
          readyState: 0,
          status: 0,
          statusText: 'NETWORK_ERROR',
          responseHeaders: '',
          response: null,
          responseText: '',
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
