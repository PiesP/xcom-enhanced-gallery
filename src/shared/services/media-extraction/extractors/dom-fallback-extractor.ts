/**
 * @fileoverview DOM Fallback Media Extractor
 * @description Extracts media directly from DOM when API extraction fails.
 * Primary use case: card images and other media not available via API.
 */

import { MEDIA } from '@constants/media';
import { TWEET_CONTAINER_SELECTORS } from '@constants/selectors';
import { normalizeErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';
import { createFailureResult } from '@shared/services/media-extraction/utils/extraction-result-factory';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractorStrategy,
  MediaInfo,
  TweetInfo,
} from '@shared/types/media.types';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
  isMediaElement,
} from '@shared/utils/media/media-element-utils';
import type { MediaElement } from '@shared/utils/media/media-element-utils.types';
import { extractTweetTextHTMLFromClickedElement } from '@shared/utils/media/tweet-extractor';
import { isValidMediaUrl } from '@shared/utils/url/validator';

/**
 * Find all media elements in the tweet container
 * @param container - Tweet article container or parent element
 * @returns Array of media elements (img, video)
 */
function findAllMediaInContainer(container: HTMLElement): MediaElement[] {
  const mediaElements: MediaElement[] = [];

  const cdnSelector = MEDIA.HOSTS.MEDIA_CDN.map((h) => `img[src*="${h}"]`).join(', ');
  const images = container.querySelectorAll<HTMLImageElement>(cdnSelector);
  for (const img of images) {
    if (isMediaElement(img)) {
      mediaElements.push(img);
    }
  }

  // Find all videos
  const videos = container.querySelectorAll<HTMLVideoElement>('video');
  for (const video of videos) {
    if (isMediaElement(video)) {
      mediaElements.push(video);
    }
  }

  return mediaElements;
}

/**
 * Create MediaInfo from DOM media element
 * @param element - Media element (img or video)
 * @param tweetInfo - Tweet metadata
 * @param index - Media index in array
 * @param tweetTextHTML - Tweet text HTML
 * @returns MediaInfo object or null
 */
function createMediaInfoFromDOM(
  element: MediaElement,
  tweetInfo: TweetInfo,
  index: number,
  tweetTextHTML?: string
): MediaInfo | null {
  try {
    const mediaUrl = extractMediaUrlFromElement(element);
    if (!mediaUrl || !isValidMediaUrl(mediaUrl)) {
      return null;
    }

    const mediaType = element.tagName.toLowerCase() === 'video' ? 'video' : 'image';

    // Extract dimensions if available
    let width: number | undefined;
    let height: number | undefined;

    if (element instanceof HTMLImageElement) {
      width = element.naturalWidth || element.width || undefined;
      height = element.naturalHeight || element.height || undefined;
    } else if (element instanceof HTMLVideoElement) {
      width = element.videoWidth || element.width || undefined;
      height = element.videoHeight || element.height || undefined;
    }

    return {
      id: `${tweetInfo.tweetId}_dom_${index}`,
      url: mediaUrl,
      type: mediaType,
      filename: '',
      tweetUsername: tweetInfo.username,
      tweetId: tweetInfo.tweetId,
      tweetUrl: tweetInfo.tweetUrl,
      tweetTextHTML,
      originalUrl: mediaUrl,
      thumbnailUrl: mediaUrl,
      alt: `${mediaType} ${index + 1}`,
      ...(width && height && { width, height }),
      metadata: {
        domIndex: index,
        extractionSource: 'dom-fallback',
        elementTag: element.tagName.toLowerCase(),
      },
    };
  } catch (error) {
    if (__DEV__) {
      logger.warn('[DOMFallbackExtractor] Failed to create MediaInfo from element:', error);
    }
    return null;
  }
}

/**
 * DOM Fallback Extractor
 * Extracts media directly from DOM when API is unavailable.
 */
export class DOMFallbackExtractor implements MediaExtractorStrategy {
  async extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    try {
      if (__DEV__) {
        logger.debug(`[DOMFallbackExtractor] ${extractionId}: Starting DOM extraction`, {
          tweetId: tweetInfo.tweetId,
        });
      }

      // Step 1: Find the tweet container
      const tweetContainer = closestWithFallback<HTMLElement>(
        clickedElement,
        TWEET_CONTAINER_SELECTORS,
        { debugLabel: 'tweet-container' }
      );

      if (!tweetContainer || !(tweetContainer instanceof HTMLElement)) {
        return createFailureResult(
          'No tweet container found',
          0,
          'dom-fallback',
          'dom-extraction-failed'
        );
      }

      // Step 2: Extract tweet text HTML
      const tweetTextHTML = extractTweetTextHTMLFromClickedElement(clickedElement);

      // Step 3: Find all media elements in the container
      const mediaElements = findAllMediaInContainer(tweetContainer);

      if (mediaElements.length === 0) {
        return createFailureResult(
          'No media elements found in DOM',
          0,
          'dom-fallback',
          'dom-extraction-failed'
        );
      }

      // Step 4: Convert media elements to MediaInfo objects
      // Build mapping from element to mediaItems index
      const mediaItems: MediaInfo[] = [];
      const elementToIndexMap = new Map<MediaElement, number>();

      for (let i = 0; i < mediaElements.length; i++) {
        const element = mediaElements[i];
        if (!element) continue;

        const mediaInfo = createMediaInfoFromDOM(element, tweetInfo, i, tweetTextHTML);
        if (mediaInfo) {
          elementToIndexMap.set(element, mediaItems.length);
          mediaItems.push(mediaInfo);
        }
      }

      if (mediaItems.length === 0) {
        return createFailureResult(
          'No valid media items extracted from DOM',
          0,
          'dom-fallback',
          'dom-extraction-failed'
        );
      }

      // Step 5: Determine which media was clicked
      const clickedMedia = findMediaElementInDOM(clickedElement);
      let clickedIndex = 0;

      if (clickedMedia) {
        const mappedIndex = elementToIndexMap.get(clickedMedia);
        if (mappedIndex !== undefined) {
          clickedIndex = mappedIndex;
        }
      }

      if (__DEV__) {
        logger.info(
          `[DOMFallbackExtractor] ${extractionId}: Extracted ${mediaItems.length} items`,
          {
            clickedIndex,
          }
        );
      }

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: performance.now(),
          sourceType: 'dom-fallback',
          strategy: 'dom-extraction',
          domMediaCount: mediaItems.length,
        },
        tweetInfo,
      };
    } catch (error) {
      if (__DEV__) {
        logger.warn(`[DOMFallbackExtractor] ${extractionId}: DOM extraction failed:`, error);
      }
      return createFailureResult(
        normalizeErrorMessage(error),
        0,
        'dom-fallback',
        'dom-extraction-failed'
      );
    }
  }
}
