/**
 * @fileoverview Gallery DOM Utilities
 * @description DOM manipulation and inspection utilities specific to the gallery
 */

import {
  CSS as CSS_CONST,
  SELECTORS,
  VIDEO_CONTROL_ARIA_TOKENS,
  VIDEO_CONTROL_DATASET_PREFIXES,
  VIDEO_CONTROL_ROLES,
  VIDEO_CONTROL_SELECTORS,
} from '@constants';
import { logger } from '@shared/logging';
import { isHTMLElement } from '@shared/utils/types/guards';

// Gallery element selectors (constants)
const GALLERY_SELECTORS = CSS_CONST.INTERNAL_SELECTORS;

/**
 * Ensure gallery scroll is available by enforcing scrollable containers to allow overflow.
 */
export function ensureGalleryScrollAvailable(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  // Find scrollable elements and enable default scroll
  const scrollableElements = element.querySelectorAll(
    '[data-xeg-role="items-list"], .itemsList, .content'
  ) as NodeListOf<HTMLElement>;

  scrollableElements.forEach((el) => {
    if (el.style.overflowY !== 'auto' && el.style.overflowY !== 'scroll') {
      el.style.overflowY = 'auto';
    }
  });
}

/**
 * Check if element is a video control element
 */
const VIDEO_PLAYER_CONTEXT_SELECTORS = [
  SELECTORS.VIDEO_PLAYER,
  '[data-testid="videoComponent"]',
  '[data-testid="videoPlayerControls"]',
  '[data-testid="videoPlayerOverlay"]',
  '[role="application"]',
  '[aria-label*="Video"]',
];
const VIDEO_CONTROL_ROLE_SET = new Set(VIDEO_CONTROL_ROLES.map((role) => role.toLowerCase()));

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

function isWithinVideoPlayer(element: HTMLElement): boolean {
  return VIDEO_PLAYER_CONTEXT_SELECTORS.some((selector) => safeClosest(element, selector) !== null);
}

function matchesVideoControlSelectors(element: HTMLElement): boolean {
  return VIDEO_CONTROL_SELECTORS.some(
    (selector) => safeMatches(element, selector) || safeClosest(element, selector) !== null
  );
}

function hasInputRangeSignature(element: HTMLElement): boolean {
  if (typeof element.matches !== 'function') {
    return false;
  }

  return safeMatches(element, 'input[type="range"]');
}

type ControlAttributeSnapshot = {
  role: string | null;
  dataTestId: string | null;
  ariaLabel: string | null;
};

interface VideoControlEvidence {
  selectorMatch: boolean;
  datasetToken: boolean;
  ariaToken: boolean;
  playerScoped: boolean;
  roleMatch: boolean;
  rangeSignature: boolean;
}

function getNearestAttributeValue(
  element: HTMLElement,
  attribute: 'data-testid' | 'aria-label'
): string | null {
  if (element.hasAttribute(attribute)) {
    return element.getAttribute(attribute);
  }

  const host = safeClosest(element, `[${attribute}]`) as HTMLElement | null;
  return host?.getAttribute(attribute) ?? null;
}

function containsControlToken(value: string | null, tokens: readonly string[]): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function collectControlAttributeSnapshot(element: HTMLElement): ControlAttributeSnapshot {
  return {
    role: element.getAttribute('role'),
    dataTestId: getNearestAttributeValue(element, 'data-testid'),
    ariaLabel: getNearestAttributeValue(element, 'aria-label'),
  };
}

function gatherVideoControlEvidence(element: HTMLElement): VideoControlEvidence {
  if (matchesVideoControlSelectors(element)) {
    return {
      selectorMatch: true,
      datasetToken: false,
      ariaToken: false,
      playerScoped: true,
      roleMatch: false,
      rangeSignature: hasInputRangeSignature(element),
    };
  }

  const attributes = collectControlAttributeSnapshot(element);
  const datasetToken = containsControlToken(attributes.dataTestId, VIDEO_CONTROL_DATASET_PREFIXES);
  const ariaToken = containsControlToken(attributes.ariaLabel, VIDEO_CONTROL_ARIA_TOKENS);
  const roleMatch = attributes.role
    ? VIDEO_CONTROL_ROLE_SET.has(attributes.role.toLowerCase())
    : false;

  return {
    selectorMatch: false,
    datasetToken,
    ariaToken,
    playerScoped: isWithinVideoPlayer(element),
    roleMatch,
    rangeSignature: hasInputRangeSignature(element),
  };
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

  const evidence = gatherVideoControlEvidence(element);

  if (evidence.selectorMatch) {
    return true;
  }

  if (evidence.datasetToken || evidence.ariaToken) {
    return true;
  }

  if (!evidence.playerScoped) {
    return false;
  }

  if (evidence.roleMatch || evidence.rangeSignature) {
    return true;
  }

  return false;
}

/**
 * Check if element is inside gallery
 * Phase 237: Strengthen element.matches type guard
 */
export function isGalleryInternalElement(element: HTMLElement | null): boolean {
  if (!element) return false;

  // Phase 242: Guard against non-HTMLElement nodes (e.g., Document during capture phase)
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  // Phase 237: Check existence of matches method (strengthen type guard)
  if (typeof element.matches !== 'function') {
    logger.warn('Invalid element: matches is not a function', element);
    return false;
  }

  return GALLERY_SELECTORS.some((selector) => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch (error) {
      logger.warn('Invalid selector:', selector, error);
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
