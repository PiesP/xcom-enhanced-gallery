// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview DOM query helpers with fallback selector support.
 */

import { logger } from '@shared/logging/logger';

const warnedInvalidSelectors: Record<string, true> = Object.create(null);

const warnInvalidSelectorOnce = (selector: string, error: unknown): void => {
  if (!__DEV__) return;
  if (warnedInvalidSelectors[selector]) return;
  warnedInvalidSelectors[selector] = true;
  logger.warn(`[query-helpers] Invalid selector skipped: ${selector}`, { error });
};

export function querySelectorWithFallback<T extends Element = Element>(
  container: Element | Document,
  selectors: readonly string[]
): T | null {
  for (const selector of selectors) {
    try {
      const element = container.querySelector<T>(selector);
      if (element) return element;
    } catch (error) {
      warnInvalidSelectorOnce(selector, error);
    }
  }
  return null;
}

export function queryAllWithFallback<T extends Element = Element>(
  container: Element | Document,
  selectors: readonly string[]
): T[] {
  const seen = new WeakSet<Element>();
  const results: T[] = [];

  for (const selector of selectors) {
    try {
      for (const element of container.querySelectorAll<T>(selector)) {
        if (!seen.has(element)) {
          seen.add(element);
          results.push(element);
        }
      }
    } catch (error) {
      warnInvalidSelectorOnce(selector, error);
    }
  }

  return results;
}

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
