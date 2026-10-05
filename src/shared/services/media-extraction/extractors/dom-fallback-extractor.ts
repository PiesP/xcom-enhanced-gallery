// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview DOM Fallback Media Extractor
 * @description Extracts media directly from DOM when API extraction fails.
 * Primary use case: card images and other media not available via API.
 */

import { MEDIA } from '@constants/media';
import { STATUS_LINK_SELECTOR, TWEET_CONTAINER_SELECTORS } from '@constants/selectors';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { captureClickedMediaEvidence } from '@shared/services/media-extraction/determine-clicked-index';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractorStrategy,
  MediaInfo,
  TweetInfo,
} from '@shared/types/media.types';
import { createFailureResult } from '@shared/types/media.types';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';
import { extractTweetTextHTMLFromClickedElement } from '@shared/utils/dom/tweet-extractor';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
  isMediaElement,
  type MediaElement,
} from '@shared/utils/media/media-element-utils';
import { isVideoPreview, isVideoThumbnailUrl } from '@shared/utils/media/video-preview';
import { isValidMediaUrl } from '@shared/utils/url/validator';

/**
 * Find all media elements in the tweet container
 * @param container - Tweet article container or parent element
 * @returns Array of media elements (img, video)
 */
function findAllMediaInContainer(container: HTMLElement): MediaElement[] {
  const cdnSelector = MEDIA.HOSTS.MEDIA_CDN.map((h) => `img[src*="${h}"]`).join(', ');
  // A single selector list retains document order across media types.
  return Array.from(container.querySelectorAll<HTMLElement>(`${cdnSelector}, video`)).filter(
    isMediaElement
  );
}

/**
 * Create MediaInfo from DOM media element
 * @param element - Media element (img or video)
 * @param tweetInfo - Tweet metadata
 * @param index - Media index in array
 * @param tweetTextContent - Tweet text content
 */
function createMediaInfoFromDOM(
  element: MediaElement,
  tweetInfo: TweetInfo,
  index: number,
  tweetTextContent?: string
): MediaInfo | null {
  try {
    // A video's poster is a matching hint, not a playable fallback source.
    const mediaUrl =
      element instanceof HTMLVideoElement
        ? element.currentSrc || element.getAttribute('src') || element.querySelector('source')?.src
        : extractMediaUrlFromElement(element);
    if (!mediaUrl || !isValidMediaUrl(mediaUrl)) {
      return null;
    }
    if (element instanceof HTMLVideoElement && new URL(mediaUrl).hostname !== 'video.twimg.com')
      return null;

    if (
      isVideoThumbnailUrl(mediaUrl) ||
      (element instanceof HTMLImageElement && isVideoPreview(element))
    )
      return null;
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

    // Extract alt text — prefer actual DOM alt attribute over synthetic label
    const domAlt =
      element instanceof HTMLImageElement && element.alt?.trim() ? element.alt.trim() : undefined;

    return {
      id: `${tweetInfo.tweetId}_dom_${index}`,
      url: mediaUrl,
      type: mediaType,
      filename: '',
      tweetUsername: tweetInfo.username,
      tweetId: tweetInfo.tweetId,
      tweetUrl: tweetInfo.tweetUrl,
      tweetText: undefined,
      tweetTextContent,
      originalUrl: mediaUrl,
      thumbnailUrl: mediaUrl,
      alt: domAlt || `${mediaType} ${index + 1}`,
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
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    try {
      if (__DEV__) {
        logger.debug(`[DOMFallbackExtractor] ${extractionId}: Starting DOM extraction`, {
          tweetId: tweetInfo.tweetId,
        });
      }

      // Step 1: Find the tweet container
      const article = closestWithFallback<HTMLElement>(clickedElement, TWEET_CONTAINER_SELECTORS);

      const ownerExtractor = new TweetInfoExtractor();
      const anchor = clickedElement.closest<HTMLElement>(STATUS_LINK_SELECTOR);
      const anchorOwner = anchor ? ownerExtractor.extract(anchor) : null;
      // Article-less recovery is bounded to a positively owned enclosing link.
      const tile = anchorOwner?.tweetId === tweetInfo.tweetId ? anchor : null;
      const tweetContainer = article ?? tile;
      const currentOwner = ownerExtractor.extract(clickedElement);
      if (!tweetContainer || currentOwner?.tweetId !== tweetInfo.tweetId) {
        return createFailureResult(
          'No tweet container found',
          'dom-fallback',
          'dom-extraction-failed'
        );
      }

      // Step 2: Extract tweet text content
      const tweetTextContent = extractTweetTextHTMLFromClickedElement(clickedElement);

      // Step 3: Find all media elements in the container
      const mediaElements = findAllMediaInContainer(tweetContainer);

      if (mediaElements.length === 0) {
        return createFailureResult(
          'No media elements found in DOM',
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
        const owner = ownerExtractor.extract(element);
        if (!owner || owner.tweetId !== tweetInfo.tweetId) continue;

        const mediaInfo = createMediaInfoFromDOM(element, tweetInfo, i, tweetTextContent);
        if (mediaInfo) {
          elementToIndexMap.set(element, mediaItems.length);
          mediaItems.push(mediaInfo);
        }
      }

      if (mediaItems.length === 0) {
        return createFailureResult(
          'No valid media items extracted from DOM',
          'dom-fallback',
          'dom-extraction-failed'
        );
      }

      // Step 5: Determine which media was clicked
      const clickedMedia = findMediaElementInDOM(clickedElement);
      const mappedIndex = clickedMedia ? elementToIndexMap.get(clickedMedia) : undefined;
      if (mappedIndex === undefined)
        return createFailureResult(
          'Clicked media is not available as an original DOM source',
          'dom-fallback',
          'dom-clicked-media-unavailable'
        );
      const clickedIndex = mappedIndex;

      if (options.clickedMediaEvidence) {
        const currentEvidence = captureClickedMediaEvidence(clickedElement);
        if (
          currentEvidence.mediaType !== options.clickedMediaEvidence.mediaType ||
          !currentEvidence.urls.some((url) => options.clickedMediaEvidence?.urls.includes(url))
        )
          return createFailureResult(
            'Clicked media changed during extraction',
            'dom-fallback',
            'dom-clicked-media-unavailable'
          );
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
          recoveryScope: article ? 'visible-article' : 'visible-tile',
        },
        tweetInfo,
      };
    } catch (error) {
      if (__DEV__) {
        logger.warn(`[DOMFallbackExtractor] ${extractionId}: DOM extraction failed:`, error);
      }
      return createFailureResult(
        normalizeErrorMessage(error),
        'dom-fallback',
        'dom-extraction-failed'
      );
    }
  }
}
