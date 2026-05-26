// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery DOM utilities
 * @description DOM inspection and element detection for gallery feature.
 */

import { CSS as CSS_CONST } from '@constants/css';
import { VIDEO_PLAYER_CONTEXT_SELECTOR } from '@constants/selectors';
import {
  VIDEO_CONTROL_ARIA_TOKENS,
  VIDEO_CONTROL_DATASET_PREFIXES,
  VIDEO_CONTROL_ROLES,
} from '@constants/video-controls';
import { logger } from '@shared/logging/logger';
import { isHTMLElement } from '@shared/utils/types/guards';

const GALLERY_SELECTORS = CSS_CONST.INTERNAL_SELECTORS;
const VIDEO_CONTROL_SELECTORS = ['.video-controls', '.video-progress button'] as const;

/**
 * Check if string value contains any control tokens (case-insensitive).
 */
function containsControlToken(value: string | null, tokens: readonly string[]): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token.toLowerCase()));
}

/**
 * Get attribute value from element or nearest ancestor.
 */
function getNearestAttributeValue(
  element: HTMLElement,
  attribute: 'data-testid' | 'aria-label'
): string | null {
  const host = element.closest(`[${attribute}]`) as HTMLElement | null;
  return host?.getAttribute(attribute) ?? null;
}

function isWithinVideoPlayer(element: HTMLElement): boolean {
  return element.closest(VIDEO_PLAYER_CONTEXT_SELECTOR) !== null;
}

function matchesVideoControlSelectors(element: HTMLElement): boolean {
  return VIDEO_CONTROL_SELECTORS.some(
    (selector) => element.matches(selector) || element.closest(selector) !== null
  );
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Determine if element is a video control.
 */
export function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!isHTMLElement(element)) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'video') return true;

  if (typeof element.matches !== 'function') return false;

  if (matchesVideoControlSelectors(element)) return true;

  const dataTestId = getNearestAttributeValue(element, 'data-testid');
  if (containsControlToken(dataTestId, VIDEO_CONTROL_DATASET_PREFIXES)) return true;

  const ariaLabel = getNearestAttributeValue(element, 'aria-label');
  if (containsControlToken(ariaLabel, VIDEO_CONTROL_ARIA_TOKENS)) return true;

  if (!isWithinVideoPlayer(element)) return false;

  const role = element.getAttribute('role');
  if (
    role &&
    VIDEO_CONTROL_ROLES.includes(role.toLowerCase() as (typeof VIDEO_CONTROL_ROLES)[number])
  ) {
    return true;
  }

  return element.matches('input[type="range"]');
}

/**
 * Check if element is inside the gallery UI.
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
    return element.matches(selector) || element.closest(selector) !== null;
  });
}

/**
 * Check if event originated from gallery UI.
 */
export function isGalleryInternalEvent(event: Event): boolean {
  const target = event.target;
  if (!isHTMLElement(target)) return false;
  return isGalleryInternalElement(target);
}
