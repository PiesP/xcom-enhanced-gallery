// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview DOM query helpers with fallback selector support.
 */

import { MAX_WARNED_SELECTORS } from '@constants/performance';
import { logger } from '@shared/logging/logger';

const warnedInvalidSelectors: Record<string, true> = Object.create(null);
let warnedSelectorCount = 0;

const warnInvalidSelectorOnce = (selector: string, error: unknown): void => {
  if (!__DEV__) return;
  if (warnedInvalidSelectors[selector]) return;
  // L7: Cap the cache to prevent unbounded growth
  if (warnedSelectorCount >= MAX_WARNED_SELECTORS) return;
  warnedInvalidSelectors[selector] = true;
  warnedSelectorCount++;
  logger.warn(`[query-helpers] Invalid selector skipped: ${selector}`, { error });
};

export function closestWithFallback<T extends Element = Element>(
  element: Element,
  selectors: readonly string[]
): T | null {
  for (const selector of selectors) {
    try {
      const match = element.closest<T>(selector);
      if (match) return match;
    } catch (error) {
      warnInvalidSelectorOnce(selector, error);
    }
  }
  return null;
}
