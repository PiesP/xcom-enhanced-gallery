// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) HTTP request adapter.
 *
 * Wraps GM_xmlhttpRequest for cross-origin HTTP requests in userscript environments.
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type { GMXMLHttpRequestDetails } from '@shared/types/core/userscript';
import type { HttpRequestAdapter, HttpRequestControl, HttpRequestDetails } from './types';

export class GMHttpRequestAdapter implements HttpRequestAdapter {
  request(details: HttpRequestDetails): HttpRequestControl {
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

    const gmControl = gm.xmlHttpRequest(gmDetails);

    return {
      abort: () => gmControl.abort(),
    };
  }
}
