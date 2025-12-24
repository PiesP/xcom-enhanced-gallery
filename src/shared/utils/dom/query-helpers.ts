/**
 * @fileoverview Unified DOM query helpers with fallback selector support
 * @description Provides type-safe query functions that try multiple selectors in order.
 * Consolidates duplicate selector fallback patterns across the codebase.
 */

import { logger } from '@shared/logging';

/**
 * Cache for invalid selectors to avoid repeated warnings
 */
const warnedInvalidSelectors: Record<string, true> = Object.create(null);

/**
 * Warn about invalid selector once (dev mode only)
 */
function warnInvalidSelectorOnce(selector: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }

  if (warnedInvalidSelectors[selector]) {
    return;
  }

  warnedInvalidSelectors[selector] = true;
  logger.warn(`[query-helpers] Invalid selector skipped: ${selector}`, { error });
}

/**
 * Query a single element with fallback selectors
 * Tries each selector in order until one succeeds
 *
 * @param container - Parent element to search within
 * @param selectors - Array of selectors to try in order (first = highest priority)
 * @returns First matching element or null
 *
 * @example
 * ```ts
 * const tweet = querySelectorWithFallback(
 *   document,
 *   ['article[data-testid="tweet"]', 'article[role="article"]']
 * );
 * ```
 */
export function querySelectorWithFallback<T extends Element = Element>(
  container: Element | Document,
  selectors: readonly string[]
): T | null {
  for (const selector of selectors) {
    try {
      const element = container.querySelector<T>(selector);
      if (element) {
        return element;
      }
    } catch (error) {
      warnInvalidSelectorOnce(selector, error);
    }
  }

  return null;
}

/**
 * Query all elements with fallback selectors
 * Combines results from all matching selectors (deduplicated)
 *
 * @param container - Parent element to search within
 * @param selectors - Array of selectors to try
 * @returns Array of unique matching elements
 *
 * @example
 * ```ts
 * const mediaElements = queryAllWithFallback(
 *   tweetArticle,
 *   ['[data-testid="tweetPhoto"]', 'img[src*="pbs.twimg.com"]']
 * );
 * ```
 */
export function queryAllWithFallback<T extends Element = Element>(
  container: Element | Document,
  selectors: readonly string[]
): T[] {
  const seen = new WeakSet<Element>();
  const results: T[] = [];

  for (const selector of selectors) {
    try {
      const elements = container.querySelectorAll<T>(selector);
      for (const element of elements) {
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

/**
 * Find closest ancestor matching any of the fallback selectors
 * Tries each selector in order until one succeeds
 *
 * @param element - Starting element
 * @param selectors - Array of selectors to try in order (first = highest priority)
 * @returns Closest matching ancestor or null
 *
 * @example
 * ```ts
 * const container = closestWithFallback(
 *   clickedElement,
 *   ['article[data-testid="tweet"]', 'article[role="article"]']
 * );
 * ```
 */
export function closestWithFallback<T extends Element = Element>(
  element: Element,
  selectors: readonly string[]
): T | null {
  for (const selector of selectors) {
    try {
      const match = element.closest<T>(selector);
      if (match) {
        return match;
      }
    } catch (error) {
      warnInvalidSelectorOnce(selector, error);
    }
  }

  return null;
}
