/**
 * Video Media Detection and Extraction Utilities
 *
 * @fileoverview Helper functions for identifying and extracting video media from Twitter/X.
 *
 * **Responsibilities**:
 * - Detect video elements (thumbnail images, player components)
 * - Identify video types (photo, video, animated GIF)
 * - Extract tweet IDs from containers and URLs
 * - Fetch video metadata from tweet data
 *
 * **Architecture**:
 * - Stateless utility functions
 * - Used by MediaService and gallery components
 * - Part of media extraction pipeline
 *
 * **Performance**:
 * - O(1) element detection (selector queries)
 * - O(n) tweet ID extraction (DOM traversal in container)
 * - No caching or state management
 *
 * **Use Cases**:
 * - Gallery media detection: Find videos on page
 * - Tweet identification: Extract tweet ID from click target
 * - Media type detection: Distinguish photos from videos
 *
 * @example
 * ```typescript
 * // Detect if element is video
 * const img = document.querySelector('img');
 * if (isVideoElement(img)) {
 *   console.log('This is a video thumbnail');
 * }
 *
 * // Extract tweet ID
 * const article = document.querySelector('article');
 * const tweetId = getTweetIdFromContainer(article);
 * // '1234567890123456789'
 * ```
 */

import { STABLE_SELECTORS } from '@/constants';
import { logger } from '@shared/logging';
import type { TweetMediaEntry } from './types';

/**
 * Check if image element is a video thumbnail
 *
 * Detects video thumbnail images using multiple heuristics.
 *
 * **Detection Heuristics**:
 * 1. URL patterns: 'ext_tw_video_thumb', 'amplify_video_thumb', 'tweet_video_thumb'
 * 2. Alt text: 'Animated Text GIF', 'Embedded video'
 * 3. DOM position: Inside media player containers
 * 4. ARIA labels: Contains 'video' or 'Video'
 *
 * **Performance**:
 * - Fast path: URL check (string includes, O(1))
 * - Fallback: closest() selectors (DOM traversal, O(n) ancestors)
 * - Short-circuits on first match
 *
 * **Reliability**:
 * - Handles various Twitter UI versions
 * - Adapts to ARIA label changes
 * - False positives possible (gallery images with "video" label)
 *
 * @param imgElement - Image element to check
 * @returns True if element appears to be video thumbnail
 *
 * @example
 * ```typescript
 * const img = document.querySelector('img');
 * if (isVideoThumbnail(img)) {
 *   console.log('This is a video thumbnail');
 * }
 * ```
 */
export function isVideoThumbnail(imgElement: HTMLImageElement): boolean {
  const src = imgElement.src;
  const alt = imgElement.alt;

  const isVideoUrl =
    src.includes('ext_tw_video_thumb') ||
    src.includes('amplify_video_thumb') ||
    src.includes('tweet_video_thumb');

  return (
    isVideoUrl ||
    alt === 'Animated Text GIF' ||
    alt === 'Embedded video' ||
    imgElement.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', ')) !== null ||
    imgElement.closest('a[aria-label*="video"]') !== null ||
    imgElement.closest('a[aria-label*="Video"]') !== null ||
    imgElement.closest('a[aria-label="Embedded video"]') !== null
  );
}

/**
 * Check if element is a video player
 *
 * Detects video player components using selectors.
 *
 * **Detection Heuristics**:
 * 1. Element type: <video> tag
 * 2. Role attribute: role="img" with video label
 * 3. DOM position: Inside media player containers
 *
 * **Performance**:
 * - Fast path: tagName check (O(1))
 * - Fallback: closest() selectors (DOM traversal)
 *
 * @param element - Element to check
 * @returns True if element is video player
 *
 * @example
 * ```typescript
 * const video = document.querySelector('video');
 * if (isVideoPlayer(video)) {
 *   console.log('This is a video player');
 * }
 * ```
 */
export function isVideoPlayer(element: HTMLElement): boolean {
  return (
    element.tagName === 'VIDEO' ||
    element.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', ')) !== null ||
    element.closest('div[role="img"][aria-label*="video"]') !== null ||
    element.closest('div[role="img"][aria-label*="Video"]') !== null
  );
}

/**
 * Check if element is any video element
 *
 * Detects both video thumbnails and player components.
 *
 * **Logic**:
 * - Image: Check if video thumbnail
 * - Other: Check if video player
 *
 * **Use Case**:
 * - Generic media click detection
 * - Works for both preview and playback interactions
 *
 * @param element - Element to check
 * @returns True if element is video (thumbnail or player)
 *
 * @example
 * ```typescript
 * element.addEventListener('click', (e) => {
 *   if (isVideoElement(e.target as HTMLElement)) {
 *     console.log('Video clicked');
 *   }
 * });
 * ```
 */
export function isVideoElement(element: HTMLElement): boolean {
  if (element.tagName === 'IMG') {
    return isVideoThumbnail(element as HTMLImageElement);
  }
  return isVideoPlayer(element);
}

/**
 * Extract tweet ID from URL
 *
 * Parses X.com/Twitter URL to extract tweet numeric ID.
 *
 * **URL Pattern**:
 * - `https://x.com/username/status/1234567890` → '1234567890'
 * - `https://twitter.com/user/status/123` → '123'
 *
 * **Regex**:
 * - Lookbehind: `/status/` marker
 * - Digits: 15-20 character numeric ID
 *
 * **Performance**:
 * - Single regex match: O(1)
 * - No DOM access
 *
 * @param url - Tweet URL
 * @returns Tweet ID or null if not found
 *
 * @example
 * ```typescript
 * const id = extractTweetId('https://x.com/user/status/1234567890');
 * // '1234567890'
 * ```
 */
export function extractTweetId(url: string): string | null {
  try {
    // Attempt to parse as URL to safely check pathname
    const urlObj = new URL(url, 'https://x.com'); // Base allows parsing relative URLs
    const match = urlObj.pathname.match(/\/status\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    // Fallback for non-standard strings
    const match = url.match(/\/status\/(\d+)/);
    return match?.[1] ?? null;
  }
}

/**
 * Extract tweet ID from container element
 *
 * Searches container for tweet ID using multiple fallback strategies.
 *
 * **Strategies** (in order):
 * 1. Links with href containing '/status/'
 * 2. TIME elements with parent /status/ link
 * 3. data-tweet-id attribute (15-20 digits)
 * 4. aria-label text (contains tweet ID)
 * 5. Text content (search for digit sequence)
 * 6. Current URL (if on tweet page)
 *
 * **Performance**:
 * - Early exit on first match
 * - Queryselector loops (worst case: ~10 iterations)
 * - Typical: < 1ms per container
 *
 * **Robustness**:
 * - Handles different Twitter UI versions
 * - Works with dynamic/lazy-loaded content
 * - Fallback to current URL
 *
 * @param container - Element containing tweet
 * @returns Tweet ID or null if not found
 *
 * @example
 * ```typescript
 * const article = document.querySelector('article');
 * const tweetId = getTweetIdFromContainer(article);
 * // '1234567890123456789'
 * ```
 */
export function getTweetIdFromContainer(container: HTMLElement): string | null {
  const links = container.querySelectorAll('a[href*="/status/"], time');
  for (const element of links) {
    let href: string | null = null;
    if (element.tagName === 'A') {
      href = (element as HTMLAnchorElement).href;
    } else if (element.tagName === 'TIME') {
      const parentLink = element.closest('a[href*="/status/"]');
      if (parentLink) href = (parentLink as HTMLAnchorElement).href;
    }
    if (href) {
      if (href.startsWith('/')) href = `https://x.com${href}`;
      const tweetId = extractTweetId(href);
      if (tweetId) return tweetId;
    }
  }
  const dataElements = container.querySelectorAll('[data-tweet-id], [aria-label]');
  for (const element of dataElements) {
    const dataTweetId = element.getAttribute('data-tweet-id');
    if (dataTweetId && /^\d{15,20}$/.test(dataTweetId)) return dataTweetId;
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      const match = ariaLabel.match(/\b(\d{15,20})\b/);
      if (match?.[1]) return match[1];
    }
  }
  const textContent = container.textContent ?? '';
  const textMatch = textContent.match(/\b(\d{15,20})\b/);
  if (textMatch?.[1]) return textMatch[1];
  if (window.location.pathname.includes('/status/')) {
    return extractTweetId(window.location.href);
  }
  return null;
}

/**
 * Get video media entry from tweet media array
 *
 * Finds best matching video from tweet's media list.
 *
 * **Matching Strategy**:
 * 1. Filter by type (video only, skip photos)
 * 2. Match by thumbnail URL (if provided)
 * 3. Fallback to first video
 *
 * **Error Handling**:
 * - Catches fetch/parsing errors
 * - Returns null on any failure
 * - Logs error details
 *
 * **Performance**:
 * - Typical: ~5ms (includes async API call)
 * - Caching handled by TwitterAPI class
 *
 * @param getTweetMedias - Callback to fetch media (async)
 * @param tweetId - Tweet numeric ID
 * @param thumbnailUrl - Optional preview URL for matching
 * @returns Video media entry or null if not found
 *
 * @example
 * ```typescript
 * const video = await getVideoMediaEntry(
 *   tweetMediasFunc,
 *   '1234567890',
 *   'https://pbs.twimg.com/media/...'
 * );
 * ```
 */
export async function getVideoMediaEntry(
  getTweetMedias: (tweetId: string) => Promise<TweetMediaEntry[]>,
  tweetId: string,
  thumbnailUrl?: string
): Promise<TweetMediaEntry | null> {
  try {
    const medias = await getTweetMedias(tweetId);
    const videoMedias = medias.filter(media => media.type === 'video');
    if (videoMedias.length === 0) return null;
    if (thumbnailUrl) {
      const normalizedThumbnail = thumbnailUrl.replace(/\?.*$/, '');
      const matchedVideo = videoMedias.find(media =>
        media.preview_url.startsWith(normalizedThumbnail)
      );
      if (matchedVideo) return matchedVideo;
    }
    return videoMedias[0] ?? null;
  } catch (error) {
    logger.error('Failed to get video media entry:', error);
    return null;
  }
}

/**
 * Get video URL from thumbnail image
 *
 * Extracts download URL for video referenced by thumbnail.
 *
 * **Process**:
 * 1. Verify image is video thumbnail
 * 2. Extract tweet ID from container
 * 3. Fetch media metadata
 * 4. Match by thumbnail URL
 * 5. Return download URL
 *
 * **Performance**:
 * - Includes API call (cached by TwitterAPI)
 * - Typical: 5-100ms depending on cache
 *
 * **Error Handling**:
 * - Returns null if not video thumbnail
 * - Returns null if tweet ID not found
 * - Returns null on API errors
 *
 * @param getTweetMedias - Callback to fetch media
 * @param imgElement - Thumbnail image element
 * @param tweetContainer - Container with tweet info
 * @returns Download URL or null if not found
 *
 * @example
 * ```typescript
 * const url = await getVideoUrlFromThumbnail(
 *   getTweetMediasFunc,
 *   thumbImg,
 *   articleElement
 * );
 * ```
 */
export async function getVideoUrlFromThumbnail(
  getTweetMedias: (tweetId: string) => Promise<TweetMediaEntry[]>,
  imgElement: HTMLImageElement,
  tweetContainer: HTMLElement
): Promise<string | null> {
  if (!isVideoThumbnail(imgElement)) return null;
  const tweetId = getTweetIdFromContainer(tweetContainer);
  if (!tweetId) {
    logger.warn('Cannot extract tweet ID from container');
    return null;
  }
  const videoEntry = await getVideoMediaEntry(getTweetMedias, tweetId, imgElement.src);
  return videoEntry?.download_url ?? null;
}
