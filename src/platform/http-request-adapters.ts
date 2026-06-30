// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { createAdapter } from './adapter-factory';
import { GMHttpRequestAdapter } from './gm-http-request-adapter';
import { MV3HttpRequestAdapter } from './mv3-http-request-adapters';
import type { HttpRequestAdapter } from './types';

/**
 * Returns the singleton HTTP request adapter for the current platform.
 *
 * - MV3 extension: {@link MV3HttpRequestAdapter} (`fetch`-based)
 * - Userscript: {@link GMHttpRequestAdapter} (`GM_xmlhttpRequest`)
 */
export const getHttpRequestAdapter: () => HttpRequestAdapter = createAdapter(
  () => new MV3HttpRequestAdapter(),
  () => new GMHttpRequestAdapter()
);
