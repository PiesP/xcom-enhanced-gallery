// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) HTTP request adapter.
 *
 * Wraps GM_xmlhttpRequest for cross-origin HTTP requests in userscript environments.
 */

import { MEDIA } from '@constants/media';
import { getUserscript } from '@shared/external/userscript/adapter';
import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
import { TWITTER_HOSTS } from '@shared/utils/url/host';
import type { HttpRequestAdapter, HttpRequestControl, HttpRequestDetails } from './types';

/**
 * Allowed hosts for SSRF prevention in the GM environment.
 * GM_xmlhttpRequest bypasses CORS, so we must validate the target URL
 * to prevent abuse (same whitelist as MV3 background SW).
 */
const ALLOWED_HOSTS: ReadonlySet<string> = new Set([...TWITTER_HOSTS, ...MEDIA.DOMAINS]);

/**
 * Validate that a URL target is an allowed host (SSRF prevention).
 * Throws synchronously if the URL is invalid or not in the allowed set.
 */
function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(`URL host not in allowed whitelist: ${parsed.hostname}`);
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

    const gmControl = gm.xmlHttpRequest(gmDetails);

    return {
      abort: () => gmControl.abort(),
    };
  }
}
