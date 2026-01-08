/**
 * @fileoverview Gallery DOM utilities
 * @description DOM inspection and element detection for gallery feature.
 */

import { CSS as CSS_CONST } from '@constants/css';
import {
  VIDEO_CONTROL_ARIA_TOKENS,
  VIDEO_CONTROL_DATASET_PREFIXES,
  VIDEO_CONTROL_ROLES,
} from '@constants/video-controls';
import { VIDEO_PLAYER_CONTEXT_SELECTOR } from '@shared/dom/selectors';
import { logger } from '@shared/logging/logger';
import { isHTMLElement } from '@shared/utils/types/guards';

const GALLERY_SELECTORS = CSS_CONST.INTERNAL_SELECTORS;
const VIDEO_CONTROL_SELECTORS = ['.video-controls', '.video-progress button'] as const;

/**
 * Safely call element.closest with error handling.
 * @param element - Element to query from
 * @param selector - CSS selector to match
 * @returns Closest matching ancestor or null
 */
function safeClosest(element: Element, selector: string): Element | null {
  try {
    return element.closest(selector);
  } catch (error) {
    if (__DEV__) {
      logger.debug('[dom/utils] element.closest failed (ignored)', { selector, error });
    }
    return null;
  }
}

/**
 * Safely call element.matches with error handling.
 * @param element - Element to test
 * @param selector - CSS selector to match
 * @returns True if element matches, false otherwise
 */
function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch (error) {
    if (__DEV__) {
      logger.debug('[dom/utils] element.matches failed (ignored)', { selector, error });
    }
    return false;
  }
}

/**
 * Check if string value contains any control tokens (case-insensitive).
 * @param value - String value to check (nullable)
 * @param tokens - Array of tokens to search for
 * @returns True if value contains any token
 */
function containsControlToken(value: string | null, tokens: readonly string[]): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token.toLowerCase()));
}

/**
 * Get attribute value from element or nearest ancestor.
 * @param element - Element to query from
 * @param attribute - Attribute name to retrieve
 * @returns Attribute value or null if not found
 */
function getNearestAttributeValue(
  element: HTMLElement,
  attribute: 'data-testid' | 'aria-label'
): string | null {
  const host = safeClosest(element, `[${attribute}]`) as HTMLElement | null;
  const value = host?.getAttribute(attribute) ?? null;
  return value;
}

/**
 * Check if element is within a video player context.
 * @param element - Element to test
 * @returns True if element is within video player
 */
function isWithinVideoPlayer(element: HTMLElement): boolean {
  return safeClosest(element, VIDEO_PLAYER_CONTEXT_SELECTOR) !== null;
}

/**
 * Check if element matches any video control selector.
 * @param element - Element to test
 * @returns True if element matches any selector
 */
function matchesVideoControlSelectors(element: HTMLElement): boolean {
  return VIDEO_CONTROL_SELECTORS.some(
    (selector) => safeMatches(element, selector) || safeClosest(element, selector) !== null
  );
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Determine if element is a video control.
 * Checks tag name, selectors, data attributes, ARIA labels, roles, and input types.
 * @param element - Element to test (nullable)
 * @returns True if element is a video control
 */
export function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!isHTMLElement(element)) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'video') return true;

  // Keep legacy safety behavior: if the element's selector engine is not
  // available (e.g., a mocked/invalid element), treat it as non-control.
  if (typeof element.matches !== 'function') {
    return false;
  }

  if (matchesVideoControlSelectors(element)) {
    return true;
  }

  const dataTestId = getNearestAttributeValue(element, 'data-testid');
  const dataTestIdMatch = containsControlToken(dataTestId, VIDEO_CONTROL_DATASET_PREFIXES);
  if (dataTestIdMatch) {
    return true;
  }

  const ariaLabel = getNearestAttributeValue(element, 'aria-label');
  if (containsControlToken(ariaLabel, VIDEO_CONTROL_ARIA_TOKENS)) {
    return true;
  }

  if (!isWithinVideoPlayer(element)) {
    return false;
  }

  const role = element.getAttribute('role');
  if (
    role &&
    VIDEO_CONTROL_ROLES.includes(role.toLowerCase() as (typeof VIDEO_CONTROL_ROLES)[number])
  ) {
    return true;
  }

  return safeMatches(element, 'input[type="range"]');
}

/**
 * Check if element is inside the gallery UI.
 * Tests if element or ancestors match gallery internal selectors.
 * @param element - Element to test (nullable)
 * @returns True if element is within gallery
 */
export function isGalleryInternalElement(element: HTMLElement | null): boolean {
  if (!isHTMLElement(element)) return false;
  if (typeof element.matches !== 'function') {
    if (__DEV__) {
      logger.warn('Invalid element: matches is not a function', element);
    }
    return false;
  }

  return GALLERY_SELECTORS.some((selector) => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch (error) {
      if (__DEV__) {
        logger.warn('Invalid selector:', selector, error);
      }
      return false;
    }
  });
}

/**
 * Check if event originated from gallery UI.
 * Tests if event target is a gallery internal element.
 * @param event - DOM event to test
 * @returns True if event originated from gallery
 */
export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target;
  if (!isHTMLElement(target)) return false;
  return isGalleryInternalElement(target);
}
