/**
 * @fileoverview Media Click Detector - Modern, concise media click detection
 * @description Handles image, video thumbnail, and video element click detection
 */

import { isVideoControlElement } from '@shared/dom/utils';
import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { isValidMediaUrl } from '@shared/utils/url/validator';
import { CSS } from '@/constants/css';
import { SELECTORS } from '@/constants/selectors';

// ============================================================================
// Types
// ============================================================================

/** Detected media types */
export type MediaType = 'image' | 'video' | 'none';

/** Media load state */
export type MediaLoadState = 'loaded' | 'loading' | 'error' | 'unknown';

/** Media detection result */
export interface MediaDetectionResult {
  /** Detected media type */
  type: MediaType;
  /** The actual media element (img/video) or null */
  element: HTMLElement | null;
  /** Media URL (empty string if not found) */
  mediaUrl: string;
  /** Detection confidence (0-1) */
  confidence: number;
  /** How the media was detected */
  method: 'direct' | 'container' | 'thumbnail' | 'not_found' | 'error';
  /** Media load state */
  loadState: MediaLoadState;
}

// ============================================================================
// Constants
// ============================================================================

const MEDIA_SELECTORS = {
  TWEET_PHOTO: SELECTORS.TWEET_PHOTO,
  VIDEO_PLAYER: SELECTORS.VIDEO_PLAYER,
  MEDIA_LINK: 'a[href*="/status/"]',
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
// Media Load State Detection
// ============================================================================

/**
 * Detect the load state of an image element
 */
export function getImageLoadState(img: HTMLImageElement): MediaLoadState {
  if (img.complete) {
    return img.naturalWidth > 0 ? 'loaded' : 'error';
  }
  return 'loading';
}

/**
 * Detect the load state of a video element
 */
export function getVideoLoadState(video: HTMLVideoElement): MediaLoadState {
  // readyState: 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
  if (video.error) return 'error';
  if (video.readyState >= 2) return 'loaded'; // HAVE_CURRENT_DATA or better
  return 'loading';
}

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

/**
 * Extract video thumbnail (poster) URL
 */
export function extractVideoThumbnailUrl(video: HTMLVideoElement): string {
  return video.poster || '';
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

// ============================================================================
// Result Factory
// ============================================================================

function createResult(
  type: MediaType,
  element: HTMLElement | null,
  url: string,
  confidence: number,
  method: MediaDetectionResult['method'],
  loadState: MediaLoadState = 'unknown'
): MediaDetectionResult {
  return { type, element, mediaUrl: url, confidence, method, loadState };
}

// ============================================================================
// Detection Functions
// ============================================================================

function detectDirectImage(img: HTMLImageElement): MediaDetectionResult | null {
  if (!isTwitterMediaElement(img)) return null;
  return createResult('image', img, extractImageUrl(img), 1.0, 'direct', getImageLoadState(img));
}

function detectDirectVideo(video: HTMLVideoElement): MediaDetectionResult | null {
  const videoUrl = extractVideoUrl(video);
  const posterUrl = extractVideoThumbnailUrl(video);

  if (!isValidMediaSource(videoUrl) && !isValidMediaSource(posterUrl)) return null;

  return createResult(
    'video',
    video,
    videoUrl || posterUrl,
    1.0,
    'direct',
    getVideoLoadState(video)
  );
}

function detectFromPhotoContainer(container: Element): MediaDetectionResult | null {
  const img = container.querySelector('img');
  if (!img || !isTwitterMediaElement(img)) return null;
  return createResult('image', img, extractImageUrl(img), 0.9, 'container', getImageLoadState(img));
}

function detectFromVideoContainer(container: Element): MediaDetectionResult | null {
  const video = container.querySelector('video');

  if (video) {
    const videoUrl = extractVideoUrl(video);
    const posterUrl = extractVideoThumbnailUrl(video);

    if (isValidMediaSource(videoUrl) || isValidMediaSource(posterUrl)) {
      return createResult(
        'video',
        video,
        videoUrl || posterUrl,
        0.9,
        'container',
        getVideoLoadState(video)
      );
    }
  }

  // Fallback: video thumbnail image (poster/preview before video loads)
  const thumbnailImg = container.querySelector('img');
  if (thumbnailImg && isValidMediaSource(extractImageUrl(thumbnailImg))) {
    return createResult(
      'video',
      thumbnailImg,
      extractImageUrl(thumbnailImg),
      0.8,
      'thumbnail',
      getImageLoadState(thumbnailImg)
    );
  }

  return null;
}

/**
 * Extract media information from clicked element
 *
 * Detection order:
 * 1. Direct IMG/VIDEO element
 * 2. Photo container (tweetPhoto)
 * 3. Video player container (videoPlayer) - includes thumbnail fallback
 */
export function detectMediaFromClick(target: HTMLElement): MediaDetectionResult {
  try {
    // 1. Direct element detection
    if (target.tagName === 'IMG') {
      const result = detectDirectImage(target as HTMLImageElement);
      if (result) return result;
    }

    if (target.tagName === 'VIDEO') {
      const result = detectDirectVideo(target as HTMLVideoElement);
      if (result) return result;
    }

    // 2. Container search (upwards traversal)
    const photoContainer = target.closest(MEDIA_SELECTORS.TWEET_PHOTO);
    if (photoContainer) {
      const result = detectFromPhotoContainer(photoContainer);
      if (result) return result;
    }

    const videoContainer = target.closest(MEDIA_SELECTORS.VIDEO_PLAYER);
    if (videoContainer) {
      const result = detectFromVideoContainer(videoContainer);
      if (result) return result;
    }

    return createResult('none', null, '', 0, 'not_found');
  } catch (error) {
    logger.error('[MediaClickDetector] Detection failed:', error);
    return createResult('none', null, '', 0, 'error');
  }
}
