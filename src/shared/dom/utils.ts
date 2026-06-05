// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery DOM utilities
 * @description DOM inspection and element detection for gallery feature.
 */

import { CSS as CSS_CONST } from '@constants/css';
import { VIDEO_PLAYER_CONTEXT_SELECTOR } from '@constants/selectors';
import { logger } from '@shared/logging/logger';
import { isHTMLElement } from '@shared/utils/types/guards';

const VIDEO_CONTROL_DATASET_PREFIXES = [
  'play',
  'pause',
  'mute',
  'unmute',
  'volume',
  'slider',
  'seek',
  'scrub',
  'progress',
  'fullscreen',
  'pip',
  'settings',
  'captions',
  'subtitles',
  'cc',
] as const;

const VIDEO_CONTROL_ROLES = ['slider', 'progressbar'] as const;

const VIDEO_CONTROL_ARIA_TOKENS = [
  'volume',
  'mute',
  'unmute',
  'seek',
  'scrub',
  'timeline',
  'progress',
  'fullscreen',
  'caption',
] as const;

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
 *
 * Detection strategy (in order):
 * 1. <video> element itself
 * 2. Known CSS control selectors (.video-controls, .video-progress button)
 * 3. data-testid attribute containing control tokens (on element or nearest ancestor)
 * 4. aria-label containing control tokens (on element or nearest ancestor)
 * 5. Inside video player context: role="slider"/"progressbar" or <input[type="range"]>
 * 6. Inside video player context: ALL elements are treated as video controls
 *    (any interactive element inside a video player is assumed to be a control)
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

  if (element.matches('input[type="range"]')) return true;

  // Inside video player context, any element is considered a video control.
  // This covers custom controls that don't use standard ARIA roles or
  // data-testid tokens (e.g., X.com's custom volume slider, seek bar, etc.).
  return true;
}

/**
 * Determine if any element in the event's composed path is a video control.
 *
 * This is more robust than isVideoControlElement alone because it checks the
 * entire event path (from target up through ancestors), catching cases where
 * the immediate target is a generic element inside a video control container.
 *
 * @param element - The event target element
 * @param getComposedPath - Optional function returning the event's composed path
 *                          (pass event.composedPath() when available)
 * @returns true if any element in the path is a video control
 */
export function isVideoControlEvent(
  element: HTMLElement | null,
  getComposedPath?: () => EventTarget[]
): boolean {
  if (!isHTMLElement(element)) return false;

  // Fast path: check the element itself first
  if (isVideoControlElement(element)) return true;

  // Check composed path if provided (covers Shadow DOM and nested components)
  if (typeof getComposedPath === 'function') {
    try {
      const path = getComposedPath();
      if (Array.isArray(path)) {
        for (const pathTarget of path) {
          if (pathTarget instanceof HTMLElement && isVideoControlElement(pathTarget)) {
            return true;
          }
        }
      }
    } catch {
      // composedPath() may throw in rare cases; fall through to element-only check
    }
  }

  return false;
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
