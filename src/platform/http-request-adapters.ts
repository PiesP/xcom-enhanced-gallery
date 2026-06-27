// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { IS_MV3 } from './detect';
import { GMHttpRequestAdapter } from './gm-http-request-adapter';
import { MV3HttpRequestAdapter } from './mv3-http-request-adapters';
import type { HttpRequestAdapter } from './types';

let _httpRequestAdapter: HttpRequestAdapter | null = null;

export function getHttpRequestAdapter(): HttpRequestAdapter {
  if (_httpRequestAdapter) return _httpRequestAdapter;
  _httpRequestAdapter = IS_MV3 ? new MV3HttpRequestAdapter() : new GMHttpRequestAdapter();
  return _httpRequestAdapter;
}
