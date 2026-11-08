// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview DOM Fallback Media Extractor
 * @description Extracts media directly from DOM when API extraction fails.
 * Primary use case: card images and other media not available via API.
 */

import { MEDIA } from '@constants/media';
import {
  STATUS_LINK_SELECTOR,
  TWEET_CONTAINER_SELECTORS,
  TWEET_TEXT_SELECTOR,
} from '@constants/selectors';
import { normalizeErrorMessage } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import {
  captureClickedMediaEvidence,
  getMediaSourceKey,
} from '@shared/services/media-extraction/determine-clicked-index';
import {
  getDomImageOriginalProbeUrl,
  markDomImageOriginalProbeLimit,
  resolveDomImageOriginal,
} from '@shared/services/media-extraction/extractors/dom-image-original';
import {
  extractClickContext,
  extractTweetInfo,
} from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  MediaExtractorStrategy,
  MediaInfo,
  TweetInfo,
} from '@shared/types/media.types';
import { createFailureResult } from '@shared/types/media.types';
import { closestWithFallback } from '@shared/utils/dom/query-helpers';
import { isDirectMp4Source } from '@shared/utils/media/direct-mp4-source';
import {
  extractMediaUrlFromElement,
  findMediaElementInDOM,
  isMediaElement,
  type MediaElement,
  selectMediaSourceUrl,
} from '@shared/utils/media/media-element-utils';
import { getImageDownloadSource } from '@shared/utils/media/media-source';
import { isVideoPreview, isVideoThumbnailUrl } from '@shared/utils/media/video-preview';
import { isHostMatching, tryParseUrl, TWITTER_HOSTS } from '@shared/utils/url/host';
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

function getOwnedPhotoOrdinal(element: MediaElement, tweetInfo: TweetInfo): number | null {
  if (!(element instanceof HTMLImageElement)) {
    return null;
  }
  const link = element.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.querySelectorAll('img, video').length !== 1) {
    return null;
  }
  const url = tryParseUrl(link.getAttribute('href'));
  if (url?.protocol !== 'https:' || !isHostMatching(url, TWITTER_HOSTS)) {
    return null;
  }
  const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)\/photo\/([1-9]\d*)\/?$/u);
  if (
    match?.[2] !== tweetInfo.tweetId ||
    match[1]?.toLowerCase() !== tweetInfo.username.toLowerCase()
  ) {
    return null;
  }
  const ordinal = Number(match[3]) - 1;
  return Number.isSafeInteger(ordinal) ? ordinal : null;
}

function getSourceFilenameKey(url: string): string | null {
  const source =
    getMediaSourceKey(url)?.replace(/:(?:thumb|small|medium|large|orig)$/iu, '') ?? null;
  if (!source) {
    return null;
  }
  // Hash the canonical CDN path; display size and query variants retain one identity.
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < source.length; i++) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(source.charCodeAt(i))) * 0x100000001b3n);
  }
  return `source-${hash.toString(16).padStart(16, '0')}`;
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
        ? selectMediaSourceUrl(element)
        : extractMediaUrlFromElement(element);
    if (!mediaUrl || !isValidMediaUrl(mediaUrl)) {
      return null;
    }
    if (element instanceof HTMLVideoElement) {
      const videoUrl = new URL(mediaUrl);
      // A DOM video can play a playlist or an unknown source, but neither is a
      // verified direct download. The filename code trusts ?format first, so a
      // conflicting or ambiguous query must not relabel a selected MP4 path.
      if (!isDirectMp4Source(videoUrl)) {
        return null;
      }
    }

    if (
      isVideoThumbnailUrl(mediaUrl) ||
      (element instanceof HTMLImageElement && isVideoPreview(element))
    ) {
      return null;
    }
    const mediaType = element.tagName.toLowerCase() === 'video' ? 'video' : 'image';
    const downloadSource =
      mediaType === 'image'
        ? getImageDownloadSource(mediaUrl, 'dom')
        : { url: mediaUrl, quality: 'observed' as const, provenance: 'dom' as const };
    const attachmentOrdinal = getOwnedPhotoOrdinal(element, tweetInfo);
    const attachmentSourceKey = getSourceFilenameKey(mediaUrl);

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
      ...(attachmentOrdinal !== null ? { attachmentOrdinal } : {}),
      ...(attachmentSourceKey ? { attachmentSourceKey } : {}),
      tweetUsername: tweetInfo.username,
      tweetId: tweetInfo.tweetId,
      tweetUrl: tweetInfo.tweetUrl,
      tweetText: undefined,
      tweetTextContent,
      originalUrl: downloadSource.url || mediaUrl,
      downloadSource,
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

      const anchor = clickedElement.closest<HTMLElement>(STATUS_LINK_SELECTOR);
      const anchorOwner = anchor ? extractTweetInfo(anchor) : null;
      // Article-less recovery is bounded to a positively owned enclosing link.
      const tile = anchorOwner?.tweetId === tweetInfo.tweetId ? anchor : null;
      const tweetContainer = article ?? tile;
      const currentOwner = extractClickContext(clickedElement);
      if (!tweetContainer || currentOwner?.ownership.ownerTweetId !== tweetInfo.tweetId) {
        return createFailureResult(
          'No tweet container found',
          'dom-fallback',
          'dom-extraction-failed'
        );
      }

      // A compact quote may omit its text while the enclosing article belongs to another post.
      const ownedText = Array.from(
        tweetContainer.querySelectorAll<HTMLElement>(TWEET_TEXT_SELECTOR)
      ).filter(
        (element) => extractClickContext(element)?.ownership.ownerTweetId === tweetInfo.tweetId
      );
      const tweetTextContent =
        ownedText.length === 1 ? ownedText[0]?.textContent?.trim() || undefined : undefined;

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
        if (!element) {
          continue;
        }
        const owner = extractClickContext(element);
        if (owner?.ownership.ownerTweetId !== tweetInfo.tweetId) {
          continue;
        }

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
      if (mappedIndex === undefined) {
        return createFailureResult(
          'Clicked media is not available as an original DOM source',
          'dom-fallback',
          'dom-clicked-media-unavailable'
        );
      }
      const clickedIndex = mappedIndex;

      if (options.clickedMediaEvidence) {
        const currentEvidence = captureClickedMediaEvidence(clickedElement);
        const selectedSource = mediaItems[clickedIndex]?.url ?? null;
        if (
          currentEvidence.mediaType !== options.clickedMediaEvidence.mediaType ||
          !options.clickedMediaEvidence.sourceKey ||
          currentEvidence.sourceKey !== options.clickedMediaEvidence.sourceKey ||
          getMediaSourceKey(selectedSource) !== options.clickedMediaEvidence.sourceKey
        ) {
          return createFailureResult(
            'Clicked media changed during extraction',
            'dom-fallback',
            'dom-clicked-media-unavailable'
          );
        }
      }

      // The clicked photo gets first claim on a four-source budget. Duplicate
      // tiles share a probe while retaining their own identity and order.
      const resolvedByUrl = new Map<string, Promise<MediaInfo>>();
      const resolutions: Array<Promise<void>> = [];
      const orderedIndices = [
        clickedIndex,
        ...mediaItems.map((_, index) => index).filter((index) => index !== clickedIndex),
      ];
      for (const index of orderedIndices) {
        const media = mediaItems[index];
        if (!media) {
          continue;
        }
        const original = getDomImageOriginalProbeUrl(media);
        if (!original) {
          continue;
        }
        let task = resolvedByUrl.get(original);
        if (!task && resolvedByUrl.size >= 4) {
          mediaItems[index] = markDomImageOriginalProbeLimit(media, original);
          continue;
        }
        if (!task) {
          task = resolveDomImageOriginal(media, options.signal);
          resolvedByUrl.set(original, task);
        }
        resolutions.push(
          task.then((resolved) => {
            mediaItems[index] = {
              ...media,
              originalUrl: resolved.originalUrl ?? original,
              ...(resolved.downloadSource ? { downloadSource: resolved.downloadSource } : {}),
              metadata: {
                ...media.metadata,
                originalSourceResolution: resolved.metadata?.originalSourceResolution,
              },
            };
          })
        );
      }
      await Promise.all(resolutions);
      if (options.signal?.aborted) {
        return createFailureResult(
          'DOM extraction cancelled',
          'dom-fallback',
          'dom-extraction-cancelled'
        );
      }

      // Network callbacks may settle after navigation or after the clicked tile changes.
      const currentClicked = findMediaElementInDOM(clickedElement);
      const currentOwnerAfterProbe = extractClickContext(clickedElement);
      const currentSource = currentClicked ? extractMediaUrlFromElement(currentClicked) : null;
      const currentContainer = article
        ? closestWithFallback<HTMLElement>(clickedElement, TWEET_CONTAINER_SELECTORS)
        : clickedElement.closest<HTMLElement>(STATUS_LINK_SELECTOR);
      if (
        !clickedElement.isConnected ||
        !currentClicked?.isConnected ||
        !tweetContainer.isConnected ||
        currentContainer !== tweetContainer ||
        currentClicked !== clickedMedia ||
        currentOwnerAfterProbe?.ownership.ownerTweetId !== tweetInfo.tweetId ||
        getMediaSourceKey(currentSource) !==
          getMediaSourceKey(mediaItems[clickedIndex]?.url ?? null) ||
        (options.clickedMediaEvidence &&
          captureClickedMediaEvidence(clickedElement).sourceKey !==
            options.clickedMediaEvidence.sourceKey)
      ) {
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
