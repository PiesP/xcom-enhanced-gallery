/**
 * @fileoverview Media Click Detector - Modern, concise media click detection
 * @description Handles image, video thumbnail, and video element click detection
 */

import { isVideoControlElement } from '@shared/dom/utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { isValidMediaUrl } from '@shared/utils/url/validator';
import { CSS } from '@/constants/css';
import { SELECTORS } from '@/constants/selectors';

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
// URL Extraction
// ============================================================================

/**
 * Extract URL from an image element
 */
export function extractImageUrl(img: HTMLImageElement): string {
  return img.src || img.currentSrc || '';
}

/**
 * Extract URL from a video element (handles blob URLs)
 */
export function extractVideoUrl(video: HTMLVideoElement): string {
  const src = video.src || video.currentSrc || '';
  return src;
}

// ============================================================================
// Media Validation
// ============================================================================

/**
 * Check if URL is a valid media source (Twitter URL or blob)
 */
export function isValidMediaSource(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) return true;
  return isValidMediaUrl(url);
}

/**
 * Check if element is a valid Twitter media element
 */
function isTwitterMediaElement(element: HTMLElement): boolean {
  if (element.tagName === 'IMG') {
    return isValidMediaSource(extractImageUrl(element as HTMLImageElement));
  }
  if (element.tagName === 'VIDEO') {
    const video = element as HTMLVideoElement;
    return isValidMediaSource(extractVideoUrl(video)) || isValidMediaSource(video.poster);
  }
  return false;
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

  // Direct media elements
  if ((target.tagName === 'IMG' || target.tagName === 'VIDEO') && isTwitterMediaElement(target)) {
    return true;
  }

  // Inside media containers
  return !!(
    target.closest(MEDIA_SELECTORS.TWEET_PHOTO) || target.closest(MEDIA_SELECTORS.VIDEO_PLAYER)
  );
}
