// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Factory functions for creating MediaInfo objects from API data.
 */

import { logger } from '@shared/logging/logger';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo, TweetInfo } from '@shared/types/media.types';
import { normalizeDimension } from '@shared/utils/media/media-dimensions';
import { isValidMediaUrl } from '@shared/utils/url/validator';

const TWEET_ID_PATTERN = /^[1-9]\d*$/u;
const HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/u;

/**
 * Create MediaInfo from API Response
 */
function createMediaInfoFromAPI(
  apiMedia: TweetMediaEntry,
  tweetInfo: TweetInfo,
  index: number
): MediaInfo | null {
  try {
    const ownerId = apiMedia.tweet_id;
    const requestedId = tweetInfo.tweetId;
    if (!TWEET_ID_PATTERN.test(ownerId) || !TWEET_ID_PATTERN.test(requestedId)) return null;
    const isQuoted =
      apiMedia.sourceLocation === 'quoted' &&
      apiMedia.quoteParentTweetId === requestedId &&
      apiMedia.quotedTweetId === ownerId &&
      ownerId !== requestedId;
    if (!isQuoted && (ownerId !== requestedId || apiMedia.sourceLocation === 'quoted')) {
      return null;
    }
    const ownerHandle = HANDLE_PATTERN.test(apiMedia.screen_name) ? apiMedia.screen_name : null;
    const ownerUrl = `https://x.com/${ownerHandle ?? 'i'}/status/${ownerId}`;
    const mediaType = apiMedia.type === 'photo' ? 'image' : 'video';
    const width = normalizeDimension(apiMedia.original_width);
    const height = normalizeDimension(apiMedia.original_height);
    const dimensions = width && height ? { width, height } : null;
    const metadata: Record<string, unknown> = {
      apiIndex: index,
      apiData: apiMedia,
      requestTweetId: requestedId,
    };

    if (dimensions) {
      metadata.dimensions = dimensions;
    }

    // Validate download URL before storing — prevents malformed or
    // non-HTTPS URLs from being used for downloads and fetch calls.
    if (!isValidMediaUrl(apiMedia.download_url)) {
      if (__DEV__) {
        logger.warn('[MediaFactory] Invalid download URL, skipping');
      }
      return null;
    }

    return {
      id: `${tweetInfo.tweetId}_api_${index}`,
      url: apiMedia.download_url,
      type: mediaType,
      filename: '',
      ...(ownerHandle ? { tweetUsername: ownerHandle } : {}),
      tweetId: ownerId,
      tweetUrl: ownerUrl,
      tweetText: apiMedia.tweet_text,
      sourceLocation: isQuoted ? 'quoted' : 'original',
      ...(isQuoted
        ? {
            quotedTweetId: ownerId,
            ...(ownerHandle ? { quotedUsername: ownerHandle } : {}),
            quotedTweetUrl: ownerUrl,
          }
        : {}),
      originalUrl: apiMedia.download_url,
      thumbnailUrl: apiMedia.preview_url,
      alt: apiMedia.alt_text?.trim() || `${mediaType} ${index + 1}`,
      ...(dimensions && {
        width: dimensions.width,
        height: dimensions.height,
      }),
      metadata,
    };
  } catch {
    if (__DEV__) {
      logger.error('API media create failed');
    }
    return null;
  }
}

/**
 * Transform API Media to MediaInfo Array
 */
export function convertAPIMediaToMediaInfo(
  apiMedias: TweetMediaEntry[],
  tweetInfo: TweetInfo,
  _tweetTextContent?: string | undefined
): MediaInfo[] {
  const mediaItems: MediaInfo[] = [];

  for (let i = 0; i < apiMedias.length; i++) {
    const apiMedia = apiMedias[i];
    if (!apiMedia) continue;

    const mediaInfo = createMediaInfoFromAPI(apiMedia, tweetInfo, i);
    if (mediaInfo) {
      mediaItems.push(mediaInfo);
    }
  }

  return mediaItems;
}
