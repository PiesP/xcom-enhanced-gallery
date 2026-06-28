// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery DOM utilities
 * @description DOM inspection and element detection for gallery feature.
 */

import { CSS as CSS_CONST } from '@constants/css';
import { VIDEO_PLAYER_CONTEXT_SELECTOR } from '@constants/selectors';
import { logger } from '@shared/logging/logger';
import type { VideoClickMode } from '@shared/types/settings.types';
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

/** Characters treated as word boundaries for token matching */
const WORD_SEPARATORS: readonly string[] = ['-', '_', ' '];

/**
 * Check if string value contains any control tokens (case-insensitive).
 * Uses word-boundary matching to avoid false positives
 * (e.g., "display" will NOT match token "play").
 *
 * Optimized: pre-tokenizes the input value into a Set of word-boundary-delimited
 * tokens, then checks membership in O(1) per token instead of O(n*m) scanning.
 */
function containsControlToken(value: string | null, tokens: readonly string[]): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();

  // Fast exact match against full string
  if ((tokens as readonly string[]).includes(normalized)) return true;

  // Pre-tokenize the input into word-boundary-delimited segments
  const valueTokens = new Set<string>();
  // Split on word separators and add each segment
  const parts = normalized.split(/[-_\s]+/);
  for (const part of parts) {
    if (part) valueTokens.add(part);
    // Also add progressively stripped prefixes/suffixes for partial matches
    // e.g., "seek-button" → "seek", "button"
  }

  // Also add the full normalized string and substrings between separators
  // to handle cases like "fullscreenwrapper" (no separators) — fall back to
  // checking if any token is a substring at a word boundary
  return tokens.some((token) => {
    const tokenLower = token.toLowerCase();
    // O(1) Set lookup for exact token match
    if (valueTokens.has(tokenLower)) return true;

    // Fallback: check word-boundary substring match for compound identifiers
    // without separators (e.g., "volumeslider" should match "volume")
    let searchIndex = 0;
    while (searchIndex < normalized.length) {
      const foundIndex = normalized.indexOf(tokenLower, searchIndex);
      if (foundIndex === -1) break;

      const beforeOk =
        foundIndex === 0 || WORD_SEPARATORS.includes(normalized[foundIndex - 1] ?? '');
      const afterEnd = foundIndex + tokenLower.length;
      const afterOk =
        afterEnd >= normalized.length || WORD_SEPARATORS.includes(normalized[afterEnd] ?? '');

      if (beforeOk && afterOk) return true;

      searchIndex = foundIndex + 1;
    }

    return false;
  });
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
 * Determine if element is a video control UI element.
 *
 * Detects interactive video player controls (play, pause, volume, seek,
 * fullscreen, etc.) while allowing clicks on the video media area itself
 * to trigger the gallery viewer.
 *
 * Detection strategy (in order):
 * 1. Known CSS control selectors (.video-controls, .video-progress button)
 * 2. data-testid attribute containing control tokens (on element or nearest ancestor)
 * 3. aria-label containing control tokens (on element or nearest ancestor)
 * 4. Inside video player context: role="slider"/"progressbar" or <input[type="range"]>
 *
 * Elements NOT considered controls:
 * - <video> tag itself (this is the media area, gallery launch is allowed)
 * - Generic elements inside the video player context without control tokens
 *   (these are typically overlay areas, poster images, or dead space)
 */
function isVideoControlElement(element: HTMLElement | null): boolean {
  if (!isHTMLElement(element)) return false;

  // <video> itself is the media area, not a control — allow gallery launch.
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'video') return false;

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

  // Inside video player context but no explicit control tokens detected.
  // This is the video media area, poster, or overlay — allow gallery launch.
  return false;
}

/**
 * Determine if any element in the event's composed path is a video control UI.
 *
 * Traverses the event's composed path (event.target → ancestors) to detect
 * video player control elements (volume slider, play button, seek bar, etc.).
 * Elements that are inside a video player context but do NOT match any
 * control token (e.g., video media area, poster, overlay) are NOT flagged.
 *
 * This is more robust than isVideoControlElement alone because it checks the
 * entire event path (from target up through ancestors), catching cases where
 * the immediate target is a generic element inside a video control container.
 *
 * @param element - The event target element
 * @param getComposedPath - Optional function returning the event's composed path
 *                          (pass event.composedPath() when available)
 * @returns true if any element in the path is a video control UI element
 */
function isVideoControlEvent(
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
          if (!(pathTarget instanceof HTMLElement)) continue;
          // Stop if we leave the video player context — no need to check further
          if (!isWithinVideoPlayer(pathTarget)) break;
          // Check if this path element is a recognized video control UI
          if (isVideoControlElement(pathTarget)) return true;
        }
      }
    } catch {
      // composedPath() may throw in rare cases; fall through to element-only check
    }
  }

  return false;
}

/**
 * Check if a click on a video player element should be allowed to trigger
 * gallery launch, based on the configured VideoClickMode.
 *
 * This is the single entry point for video-click decision logic — all
 * callers (L1 capture handler, L2b secondary check) should use this function
 * instead of calling isVideoControlElement/isVideoControlEvent directly.
 *
 * @param element - The click target element
 * @param getComposedPath - Event.composedPath() accessor (for composedPath traversal)
 * @param mode - Video click handling mode from user settings
 * @returns true if the click should be allowed (gallery launch), false if blocked
 */
export function isVideoClickAllowed(
  element: HTMLElement | null,
  getComposedPath: (() => EventTarget[]) | undefined,
  mode: VideoClickMode
): boolean {
  if (!isHTMLElement(element)) return true;

  switch (mode) {
    case 'allow-all':
      return true;

    case 'block-all':
      return !isAnyInVideoPlayerPath(element, getComposedPath);

    case 'block-controls-only':
      return !isVideoControlEvent(element, getComposedPath);

    default:
      // Corrupted/missing setting — log in dev and fall back to
      // block-controls-only (safe default that blocks control UI
      // but allows video area clicks).
      if (__DEV__) {
        logger.warn(
          '[isVideoClickAllowed] Unknown videoClickMode, falling back to block-controls-only',
          { mode }
        );
      }
      return !isVideoControlEvent(element, getComposedPath);
  }
}

/** Check if any element in element + composedPath is inside a video player context */
function isAnyInVideoPlayerPath(
  element: HTMLElement,
  getComposedPath: (() => EventTarget[]) | undefined
): boolean {
  if (isWithinVideoPlayer(element)) return true;

  if (typeof getComposedPath === 'function') {
    try {
      const path = getComposedPath();
      if (Array.isArray(path)) {
        for (const pathTarget of path) {
          if (pathTarget instanceof HTMLElement && isWithinVideoPlayer(pathTarget)) {
            return true;
          }
        }
      }
    } catch {
      // composedPath() may throw; fall through
    }
  }

  return false;
}

/**
 * Check if element is inside the gallery UI.
 */
export function isGalleryInternalElement(element: Element | null): boolean {
  if (!(element instanceof Element)) return false;
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
 * Check if a click event targets a video element or any of its descendants.
 *
 * Uses both `Element.contains()` and `Event.composedPath()` for robustness
 * with Shadow DOM and nested components. Returns true when the click
 * is on the video element itself or any of its children (including native
 * controls rendered by the browser).
 *
 * @param event - The click event
 * @param video - The video element to check against
 * @returns true if the click target is inside the video element
 */
export function isClickOnVideoElement(event: MouseEvent, video: HTMLVideoElement): boolean {
  if (event.target instanceof Node && video.contains(event.target)) return true;

  if (typeof event.composedPath === 'function') {
    try {
      const path = event.composedPath();
      if (Array.isArray(path)) {
        for (const pathTarget of path) {
          if (pathTarget === video) return true;
          if (pathTarget instanceof Node && video.contains(pathTarget)) return true;
        }
      }
    } catch {
      // composedPath() may throw; fall through
    }
  }

  return false;
}
