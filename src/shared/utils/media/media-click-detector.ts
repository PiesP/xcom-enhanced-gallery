/**
 * @fileoverview Media Click Detector - Handles media click detection and validation
 * @description Detects clicks on image, video thumbnail, and video elements to trigger
 * the XEG gallery. Prevents triggering in contexts where native navigation should be preserved
 * (link cards, X Articles, media viewers). Validates media sources and element types.
 */

import { CSS } from '@constants/css';
import {
  STABLE_MEDIA_CONTAINERS_SELECTORS,
  STABLE_MEDIA_VIEWERS_SELECTORS,
  STATUS_LINK_SELECTOR,
} from '@shared/dom/selectors';
import { isVideoControlElement } from '@shared/dom/utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
} from '@shared/utils/media/media-element-utils';
import { isValidMediaUrl } from '@shared/utils/url/validator';

// ============================================================================
// Constants
// ============================================================================

/**
 * Media link selectors for profile grid and timeline media.
 * Includes /photo/ and /video/ links that should trigger gallery.
 *
 * @see STATUS_LINK_SELECTOR - Core selector for status/tweet links
 */
const MEDIA_LINK_SELECTORS = [
  STATUS_LINK_SELECTOR, // a[href*="/status/"]
  'a[href*="/photo/"]', // Photo links (profile grid)
  'a[href*="/video/"]', // Video links (profile grid)
] as const;

/**
 * Combined selector string for media link detection.
 * Generated from MEDIA_LINK_SELECTORS for efficient DOM queries.
 */
const MEDIA_LINK_SELECTOR: string = MEDIA_LINK_SELECTORS.join(', ');

/**
 * Combined selector string for media container detection.
 * Covers images, videos, and other media containers.
 */
const MEDIA_CONTAINER_SELECTOR: string = STABLE_MEDIA_CONTAINERS_SELECTORS.join(', ');

/**
 * Interactive element selectors that may contain or trigger gallery.
 * Used to differentiate interactive elements from media containers.
 *
 * Includes buttons, links, and Twitter-specific action elements
 * (like, retweet, reply, share, bookmark).
 */
const INTERACTIVE_SELECTOR: string = [
  'button',
  'a',
  '[role="button"]',
  '[data-testid="like"]',
  '[data-testid="retweet"]',
  '[data-testid="reply"]',
  '[data-testid="share"]',
  '[data-testid="bookmark"]',
].join(', ');

/**
 * Context selectors where media clicks should NOT trigger XEG gallery.
 * Preserves native navigation for link cards, X Articles, and native media viewers.
 *
 * Includes:
 * - Link preview cards (external links, YouTube cards)
 * - X Articles / longform reader UI
 * - Article cover images
 * - Native X media viewers/lightboxes
 * - Additional stable X media viewer DOM hooks
 */
const BLOCKED_MEDIA_CONTEXT_SELECTOR: string = [
  // Link preview cards (external links, YouTube cards, etc.)
  '[data-testid="card.wrapper"]',
  // X Articles / longform reader UI
  '[data-testid="twitterArticleReadView"]',
  '[data-testid="longformRichTextComponent"]',
  '[data-testid="twitterArticleRichTextView"]',
  // X Article cover image (thumbnail) should preserve native navigation
  '[data-testid="article-cover-image"]',
  // Native X media viewers/lightboxes (prevent re-trigger inside the modal)
  ...STABLE_MEDIA_VIEWERS_SELECTORS,
  // Additional stable hooks observed in X media viewer DOM
  '[data-testid="swipe-to-dismiss"]',
  '[data-testid="mask"]',
].join(', ');

// ============================================================================
// Media Validation
// ============================================================================

/**
 * Check if URL is a valid media source (Twitter URL or blob).
 *
 * @param url - The URL to validate
 * @returns true if the URL is a valid media source
 */
function isValidMediaSource(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) return true;
  return isValidMediaUrl(url);
}

// ============================================================================
// Block Detection
// ============================================================================

/**
 * Check if the click target should block gallery trigger.
 *
 * Evaluates target element against multiple block conditions:
 * - Video control elements
 * - Gallery internal elements (root, overlay)
 * - Contexts that should preserve native navigation (link cards, X Articles)
 * - Non-media interactive elements (buttons, links, etc.)
 *
 * @param target - The element that was clicked
 * @returns true if the click should block gallery trigger
 */
function shouldBlockMediaTrigger(target: HTMLElement | null): boolean {
  if (!target) return false;

  // Video controls should be blocked
  if (isVideoControlElement(target)) return true;

  // Gallery internal elements
  if (target.closest(CSS.SELECTORS.ROOT) || target.closest(CSS.SELECTORS.OVERLAY)) return true;

  // Block media triggers inside contexts that should preserve native navigation
  // (e.g., link cards and X Articles where media clicks open the card/article)
  if (target.closest(BLOCKED_MEDIA_CONTEXT_SELECTOR)) return true;

  // Interactive elements (buttons, links, etc.)
  const interactive = target.closest(INTERACTIVE_SELECTOR);
  if (interactive) {
    const matchesMediaLinkSelector = interactive.matches(MEDIA_LINK_SELECTOR);

    // If the user clicked inside an anchor that is not a tweet/status/media link,
    // do not trigger the gallery. This preserves native navigation for articles,
    // external link cards, profiles, etc. even when they contain images.
    if (interactive.tagName === 'A' && !matchesMediaLinkSelector) {
      return true;
    }

    // Keep existing behavior for non-anchor interactive elements (buttons, role=button, etc.).
    const matchesMediaContainerSelector = interactive.matches(MEDIA_CONTAINER_SELECTOR);
    const hasMediaContainerDescendant =
      interactive.querySelector(MEDIA_CONTAINER_SELECTOR) !== null;

    const isMediaLink =
      matchesMediaLinkSelector || matchesMediaContainerSelector || hasMediaContainerDescendant;
    return !isMediaLink;
  }

  return false;
}

/**
 * Check if element is processable media that should trigger the gallery.
 *
 * Validates that:
 * 1. Gallery is not already open
 * 2. Click target is not in a blocked context
 * 3. Target contains valid media with extractable URL, or
 * 4. Target is within a media container (for unloaded media)
 *
 * @param target - The element that was clicked
 * @returns true if the element represents valid media that should open the gallery
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
  return !!target.closest(MEDIA_CONTAINER_SELECTOR);
}
