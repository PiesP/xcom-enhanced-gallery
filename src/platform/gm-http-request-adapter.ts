// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) HTTP request adapter.
 *
 * Wraps GM_xmlhttpRequest for cross-origin HTTP requests in userscript environments.
 */

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

export class GMHttpRequestAdapter implements HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl {
    // SSRF prevention: validate URL before making the request
    validateUrl(details.url);

    const gm = getUserscript();

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
    if (details.onload !== undefined) {
      gmDetails.onload = details.onload;
    }
    if (details.onerror !== undefined) {
      gmDetails.onerror = details.onerror;
    }
    if (details.ontimeout !== undefined) {
      gmDetails.ontimeout = details.ontimeout;
    }
    if (details.onabort !== undefined) {
      gmDetails.onabort = details.onabort;
    }
    if (details.onprogress !== undefined) {
      gmDetails.onprogress = details.onprogress;
    }

    let gmControl: { abort: () => void };
    try {
      gmControl = gm.xmlHttpRequest(gmDetails);
    } catch (_error) {
      // L2: GM_xmlhttpRequest can throw synchronously outside of validateUrl
      details.onerror?.({
        finalUrl: details.url,
        readyState: 0,
        status: 0,
        statusText: 'NETWORK_ERROR',
        responseHeaders: '',
        response: null,
        responseText: '',
      });
      return { abort: () => {} };
    }

    return {
      abort: () => gmControl.abort(),
    };
  }
}
