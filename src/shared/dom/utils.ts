/**
 * @fileoverview Gallery DOM Utilities
 * @description DOM manipulation and inspection utilities specific to the gallery
 */

import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { isHTMLElement } from '@shared/utils/types/guards';
import {
  CSS as CSS_CONST,
  SELECTORS,
  VIDEO_CONTROL_ARIA_TOKENS,
  VIDEO_CONTROL_DATASET_PREFIXES,
  VIDEO_CONTROL_ROLES,
  VIDEO_CONTROL_SELECTORS,
} from '@/constants';

// Gallery element selectors (constants)
const GALLERY_SELECTORS = CSS_CONST.INTERNAL_SELECTORS;
const GALLERY_CONTAINER_QUERY = [
  CSS_CONST.SELECTORS.CONTAINER,
  CSS_CONST.SELECTORS.DATA_CONTAINER,
  CSS_CONST.SELECTORS.ROOT,
  CSS_CONST.SELECTORS.DATA_GALLERY,
].join(', ');

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

  scrollableElements.forEach(el => {
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
const VIDEO_CONTROL_ROLE_SET = new Set(VIDEO_CONTROL_ROLES.map(role => role.toLowerCase()));

function hasDatasetControlToken(element: HTMLElement): boolean {
  const dataTestId = element.getAttribute('data-testid');
  if (!dataTestId) {
    return false;
  }

  const normalized = dataTestId.toLowerCase();
  return VIDEO_CONTROL_DATASET_PREFIXES.some(token => normalized.includes(token));
}

function hasAriaControlToken(element: HTMLElement): boolean {
  const ariaLabel = element.getAttribute('aria-label');
  if (!ariaLabel) {
    return false;
  }

  const normalized = ariaLabel.toLowerCase();
  return VIDEO_CONTROL_ARIA_TOKENS.some(token => normalized.includes(token));
}

function isWithinVideoPlayer(element: HTMLElement): boolean {
  return VIDEO_PLAYER_CONTEXT_SELECTORS.some(selector => {
    try {
      return element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

function matchesVideoControlSelectors(element: HTMLElement): boolean {
  return VIDEO_CONTROL_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

function hasInputRangeSignature(element: HTMLElement): boolean {
  if (typeof element.matches !== 'function') {
    return false;
  }
  return element.matches('input[type="range"]');
}

export function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!isHTMLElement(element)) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'video') return true;

  if (matchesVideoControlSelectors(element)) {
    return true;
  }

  if (!isWithinVideoPlayer(element)) {
    return false;
  }

  const role = element.getAttribute('role');
  if (role && VIDEO_CONTROL_ROLE_SET.has(role.toLowerCase())) {
    return true;
  }

  const datasetHost = element.closest('[data-testid]') as HTMLElement | null;
  if (datasetHost && hasDatasetControlToken(datasetHost)) {
    return true;
  }

  const labeledHost = element.closest('[aria-label]') as HTMLElement | null;
  if (labeledHost && hasAriaControlToken(labeledHost)) {
    return true;
  }

  if (hasDatasetControlToken(element) || hasAriaControlToken(element)) {
    return true;
  }

  return hasInputRangeSignature(element);
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
 * Check if gallery can be triggered
 */
export function canTriggerGallery(target: HTMLElement | null): boolean {
  if (!target) return false;

  // Phase 21.6: Migrated to use gallerySignals
  // Don't trigger if gallery is already open
  if (gallerySignals.isOpen.value) {
    return false;
  }

  // Check if it's a video control element
  if (isVideoControlElement(target)) {
    return false;
  }

  // Check if it's an internal gallery element
  if (isGalleryInternalElement(target)) {
    return false;
  }

  return true;
}

/**
 * Check if element is gallery container
 */
export function isGalleryContainer(element: HTMLElement | null): boolean {
  if (!element) return false;

  try {
    return element.matches(GALLERY_CONTAINER_QUERY);
  } catch {
    return false;
  }
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
