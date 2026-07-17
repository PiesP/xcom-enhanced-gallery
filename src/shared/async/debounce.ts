// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { debounce } from '@piesp/browser-core/async';
import { DEFAULT_DEBOUNCE_MS } from '@constants/performance';

export type { DebouncedFunction } from '@piesp/browser-core/async';

/** @deprecated Import debounce from @piesp/browser-core/async instead */
export function createDebounced<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  delayMs: number = DEFAULT_DEBOUNCE_MS
) {
  return debounce(fn, delayMs);
}
