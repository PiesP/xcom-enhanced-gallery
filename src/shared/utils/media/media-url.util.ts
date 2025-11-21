/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility (Legacy Compatibility)
 *
 * Provides DOM-centric helpers that bridge legacy entry points with the
 * modular media-url architecture introduced in Phase 351. Core parsing and
 * transformation logic now lives inside `src/shared/utils/media-url`; this
 * module simply delegates while preserving the older API surface.
 */

import { SELECTORS } from '@/constants';
import { getMediaFilenameService } from '@shared/container/service-accessors';
import { logger } from '@shared/logging';
import type { FilenameOptions } from '@shared/services/file-naming';
import { cachedQuerySelector, cachedQuerySelectorAll } from '@shared/dom';
import { getPreferredUsername } from '@shared/media/username-source';
import type { MediaInfo } from '@shared/types/media.types';
import {
  canExtractOriginalImage,
  canExtractOriginalVideo,
  classifyMediaUrl,
  cleanFilename,
  convertThumbnailToVideoUrl,
  extractMediaId,
  extractOriginalImageUrl,
  extractOriginalVideoUrl,
  extractVideoIdFromThumbnail,
  generateOriginalUrl,
  getHighQualityMediaUrl,
  isEmojiUrl,
  isValidMediaUrl,
  isTwitterMediaUrl,
  isVideoThumbnailUrl,
  shouldIncludeMediaUrl,
  type MediaTypeResult,
} from '@shared/utils/media-url';

export type { FilenameOptions, MediaTypeResult };

// Re-export modular helpers so legacy imports remain valid.
export {
  canExtractOriginalImage,
  canExtractOriginalVideo,
  classifyMediaUrl,
  cleanFilename,
  convertThumbnailToVideoUrl,
  extractMediaId,
  extractOriginalImageUrl,
  extractOriginalVideoUrl,
  extractVideoIdFromThumbnail,
  generateOriginalUrl,
  getHighQualityMediaUrl,
  isEmojiUrl,
  isValidMediaUrl,
  isTwitterMediaUrl,
  isVideoThumbnailUrl,
  shouldIncludeMediaUrl,
};

const VIDEO_QUERY_TIMEOUT = 2000;
const IMAGE_QUERY_TIMEOUT = 3000;

export function getMediaUrlsFromTweet(doc: Document | HTMLElement, tweetId: string): MediaInfo[] {
  const mediaItems: MediaInfo[] = [];
  let mediaIndex = 0;

  try {
    const rootElement = doc instanceof Document ? doc.documentElement : doc;

    const videoNodes = cachedQuerySelectorAll('video', rootElement, VIDEO_QUERY_TIMEOUT) ?? [];
    for (const node of Array.from(videoNodes)) {
      const mediaInfo = createMediaInfoFromVideo(node as HTMLVideoElement, tweetId, mediaIndex);
      if (!mediaInfo) continue;
      mediaItems.push(mediaInfo);
      mediaIndex++;
    }

    const imageNodes =
      cachedQuerySelectorAll('img[src*="pbs.twimg.com"]', rootElement, IMAGE_QUERY_TIMEOUT) ?? [];
    for (const node of Array.from(imageNodes)) {
      const imgElement = node as HTMLImageElement;
      if (!shouldIncludeImageNode(imgElement)) continue;

      const mediaInfo = createMediaInfoFromImage(imgElement, tweetId, mediaIndex);
      if (!mediaInfo) continue;
      mediaItems.push(mediaInfo);
      mediaIndex++;
    }

    const tweetPhotoNodes =
      cachedQuerySelectorAll(SELECTORS.TWEET_PHOTO, rootElement, IMAGE_QUERY_TIMEOUT) ?? [];
    for (const photo of Array.from(tweetPhotoNodes)) {
      const nestedImg = cachedQuerySelector(
        'img',
        photo as Element,
        VIDEO_QUERY_TIMEOUT
      ) as HTMLImageElement | null;
      if (!nestedImg || !shouldIncludeImageNode(nestedImg)) continue;

      const candidate = createMediaInfoFromImage(nestedImg, tweetId, mediaIndex);
      if (!candidate) continue;
      if (mediaItems.some(item => item.url === candidate.url)) continue;

      mediaItems.push(candidate);
      mediaIndex++;
    }

    logger.debug(`getMediaUrlsFromTweet: ${mediaItems.length} media extracted - ${tweetId}`);
    return mediaItems;
  } catch (error) {
    logger.error('getMediaUrlsFromTweet: Media extraction failed:', error);
    return [];
  }
}

export function createMediaInfoFromImage(
  imgElement: HTMLImageElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const src = imgElement?.src;
    if (!src || !isValidMediaUrl(src)) {
      return null;
    }

    const originalUrl = extractOriginalImageUrl(src);
    const thumbnailUrl = getHighQualityMediaUrl(src, 'small');
    const tweetUsername = getUsernameSafe() || undefined;

    const baseInfo: MediaInfo = {
      id: `${tweetId}-${index}`,
      type: 'image',
      url: originalUrl,
      originalUrl: `https://twitter.com/i/status/${tweetId}/photo/${index + 1}`,
      tweetId,
      tweetUsername,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      thumbnailUrl,
      alt: imgElement.alt || `Media ${index + 1} from tweet`,
      width: imgElement.width || 1200,
      height: imgElement.height || 800,
    };

    const filename = getFilename(baseInfo, {
      index: index + 1,
      ...(tweetUsername ? { fallbackUsername: tweetUsername } : {}),
    });

    return {
      ...baseInfo,
      filename,
    };
  } catch (error) {
    logger.error('createMediaInfoFromImage: Image info creation failed:', error);
    return null;
  }
}

export function createMediaInfoFromVideo(
  videoElement: HTMLVideoElement,
  tweetId: string,
  index: number
): MediaInfo | null {
  try {
    const poster = videoElement.poster || '';
    const rawSrc = videoElement.src || videoElement.currentSrc || '';
    const primaryUrl = rawSrc || poster;

    if (!primaryUrl || !isValidMediaUrl(primaryUrl)) {
      return null;
    }

    const optimizedVideoUrl =
      rawSrc && canExtractOriginalVideo(rawSrc) ? extractOriginalVideoUrl(rawSrc) : rawSrc;

    if (rawSrc && optimizedVideoUrl !== rawSrc) {
      logger.debug('createMediaInfoFromVideo: Optimized video URL', {
        original: rawSrc,
        optimized: optimizedVideoUrl,
      });
    }

    const tweetUsername = getUsernameSafe() || undefined;
    const resolvedUrl = optimizedVideoUrl || poster;
    const extension = resolveExtension(resolvedUrl);

    const baseInfo: MediaInfo = {
      id: `${tweetId}-video-${index}`,
      type: 'video',
      url: resolvedUrl,
      originalUrl: `https://twitter.com/i/status/${tweetId}/video/${index + 1}`,
      tweetId,
      tweetUsername,
      tweetUrl: `https://twitter.com/i/status/${tweetId}`,
      thumbnailUrl: poster,
      alt: `Video ${index + 1} from tweet`,
      width: videoElement.videoWidth || 1920,
      height: videoElement.videoHeight || 1080,
    };

    const filenameOptions: FilenameOptions = {
      index: index + 1,
      ...(extension ? { extension } : {}),
      ...(tweetUsername ? { fallbackUsername: tweetUsername } : {}),
    };

    const filename = getFilename(baseInfo, filenameOptions);

    return {
      ...baseInfo,
      filename,
    };
  } catch (error) {
    logger.error('createMediaInfoFromVideo: Video info creation failed:', error);
    return null;
  }
}

function shouldIncludeImageNode(imgElement: HTMLImageElement): boolean {
  const src = imgElement?.src;
  if (!src) {
    return false;
  }

  const classification = classifyMediaUrl(src);
  return classification.shouldInclude && classification.type === 'image';
}

function resolveExtension(url: string): string | undefined {
  try {
    const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    return match?.[1]?.toLowerCase();
  } catch {
    return undefined;
  }
}

function getUsernameSafe(): string | null {
  try {
    const viaMedia = getPreferredUsername();
    if (viaMedia) return viaMedia;
  } catch {
    // Ignore container resolution failures in tests.
  }
  return null;
}

function getFilename(info: MediaInfo, options: FilenameOptions): string {
  try {
    const service = getMediaFilenameService();
    return service.generateMediaFilename(info, options);
  } catch {
    const base = info.tweetId ? `${info.tweetId}` : 'media';
    const rawIndex = options.index ?? 1;
    const indexNumber =
      typeof rawIndex === 'number' ? rawIndex : parseInt(String(rawIndex), 10) || 1;
    const idx = indexNumber.toString().padStart(2, '0');
    const ext = options.extension ? `.${options.extension}` : '';
    return `${base}_${idx}${ext}`;
  }
}
