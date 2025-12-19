/**
 * @fileoverview Gallery DOM Utilities
 * @description DOM inspection utilities specific to the gallery
 */

import { CSS as CSS_CONST } from '@constants/css';
import {
  VIDEO_CONTROL_ARIA_TOKENS,
  VIDEO_CONTROL_DATASET_PREFIXES,
  VIDEO_CONTROL_ROLES,
  VIDEO_CONTROL_SELECTORS,
} from '@constants/video-controls';
import { VIDEO_PLAYER_SELECTOR } from '@shared/dom/selectors';
import { logger } from '@shared/logging';
import { isHTMLElement } from '@shared/utils/types/guards';

// Gallery element selectors (constants)
const GALLERY_SELECTORS = CSS_CONST.INTERNAL_SELECTORS;

/**
 * Check if element is a video control element
 */
const VIDEO_PLAYER_CONTEXT_SELECTORS = [
  VIDEO_PLAYER_SELECTOR,
  '[data-testid="videoComponent"]',
  '[data-testid="videoPlayerControls"]',
  '[data-testid="videoPlayerOverlay"]',
  '[role="application"]',
  '[aria-label*="Video"]',
];

function safeClosest(element: Element, selector: string): Element | null {
  try {
    return element.closest(selector);
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.debug('[dom/utils] element.closest failed (ignored)', { selector, error });
    }
    return null;
  }
}

function safeMatches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.debug('[dom/utils] element.matches failed (ignored)', { selector, error });
    }
    return false;
  }
}

function containsControlToken(value: string | null, tokens: readonly string[]): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function getNearestAttributeValue(
  element: HTMLElement,
  attribute: 'data-testid' | 'aria-label'
): string | null {
  const host = safeClosest(element, `[${attribute}]`) as HTMLElement | null;
  return host?.getAttribute(attribute) ?? null;
}

function isWithinVideoPlayer(element: HTMLElement): boolean {
  return VIDEO_PLAYER_CONTEXT_SELECTORS.some((selector) => safeClosest(element, selector) !== null);
}

function matchesVideoControlSelectors(element: HTMLElement): boolean {
  return VIDEO_CONTROL_SELECTORS.some(
    (selector) => safeMatches(element, selector) || safeClosest(element, selector) !== null
  );
}

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
  if (containsControlToken(dataTestId, VIDEO_CONTROL_DATASET_PREFIXES)) {
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
 * Check if element is inside gallery
 * Phase 237: Strengthen element.matches type guard
 */
export function isGalleryInternalElement(element: HTMLElement | null): boolean {
  if (!isHTMLElement(element)) return false;
  if (typeof element.matches !== 'function') {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.warn('Invalid element: matches is not a function', element);
    }
    return false;
  }

  return GALLERY_SELECTORS.some((selector) => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        logger.warn('Invalid selector:', selector, error);
      }
      return false;
    }
  });
}

/**
 * Check if event is internal to gallery
 * Phase 241: Apply event.target type guard
 */
export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target;
  if (!isHTMLElement(target)) return false;
  return isGalleryInternalElement(target);
}
