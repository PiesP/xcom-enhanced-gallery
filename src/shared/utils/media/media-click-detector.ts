/**
 * @fileoverview Media Click Detector - Modern, concise media click detection
 * @description Handles image, video thumbnail, and video element click detection
 */

import { CSS } from '@constants/css';
import { SELECTORS } from '@constants/selectors';
import { isVideoControlElement } from '@shared/dom/utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
} from '@shared/utils/media/media-element-utils';
import { isValidMediaUrl } from '@shared/utils/url';

// ============================================================================
// Constants
// ============================================================================

const MEDIA_SELECTORS = {
  TWEET_PHOTO: SELECTORS.TWEET_PHOTO,
  VIDEO_PLAYER: SELECTORS.VIDEO_PLAYER,
  MEDIA_LINK: SELECTORS.STATUS_LINK,
} as const;

/** Interactive elements that should block gallery trigger */
const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  '[role="button"]',
  '[data-testid="like"]',
  '[data-testid="retweet"]',
  '[data-testid="reply"]',
  '[data-testid="share"]',
  '[data-testid="bookmark"]',
].join(', ');

// ============================================================================
// Media Validation
// ============================================================================

/**
 * Check if URL is a valid media source (Twitter URL or blob)
 */
export function isValidMediaSource(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) return true;
  return isValidMediaUrl(url);
}

// ============================================================================
// Block Detection
// ============================================================================

/**
 * Check if the click target should block gallery trigger
 */
export function shouldBlockMediaTrigger(target: HTMLElement | null): boolean {
  if (!target) return false;

  // Video controls should be blocked
  if (isVideoControlElement(target)) return true;

  // Gallery internal elements
  if (target.closest(CSS.SELECTORS.ROOT) || target.closest(CSS.SELECTORS.OVERLAY)) return true;

  // Interactive elements (buttons, links, etc.)
  const interactive = target.closest(INTERACTIVE_SELECTOR);
  if (interactive) {
    // Exception: Media links (links containing media)
    const isMediaLink =
      interactive.matches(MEDIA_SELECTORS.MEDIA_LINK) ||
      interactive.querySelector(MEDIA_SELECTORS.TWEET_PHOTO) !== null ||
      interactive.querySelector(MEDIA_SELECTORS.VIDEO_PLAYER) !== null;
    return !isMediaLink;
  }

  return false;
}

/**
 * Check if element is processable media
 */
export function isProcessableMedia(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (gallerySignals.isOpen.value) return false;
  if (shouldBlockMediaTrigger(target)) return false;

  const mediaElement = findMediaElementInDOM(target);
  if (mediaElement) {
    const mediaUrl = extractMediaUrlFromElement(mediaElement);
    if (isValidMediaSource(mediaUrl)) {
      return true;
    }
  }

  // Inside media containers (images/videos that have not fully loaded yet)
  return Boolean(
    target.closest(MEDIA_SELECTORS.TWEET_PHOTO) || target.closest(MEDIA_SELECTORS.VIDEO_PLAYER),
  );
}
