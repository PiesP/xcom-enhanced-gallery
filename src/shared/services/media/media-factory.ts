/**
 * @fileoverview Factory functions for creating MediaInfo objects from API data.
 */

import { logger } from '@shared/logging/logger';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { MediaInfo, TweetInfo } from '@shared/types/media.types';
import { normalizeDimension } from '@shared/utils/media/media-dimensions';

/**
 * Create MediaInfo from API Response
 */
const createMediaInfoFromAPI = (
  apiMedia: TweetMediaEntry,
  tweetInfo: TweetInfo,
  index: number,
  tweetTextHTML?: string | undefined
): MediaInfo | null => {
  try {
    const mediaType = apiMedia.type === 'photo' ? 'image' : 'video';
    const width = normalizeDimension(apiMedia.original_width);
    const height = normalizeDimension(apiMedia.original_height);
    const dimensions = width && height ? { width, height } : null;
    const metadata: Record<string, unknown> = {
      apiIndex: index,
      apiData: apiMedia,
    };

    if (dimensions) {
      metadata.dimensions = dimensions;
    }

    const username = apiMedia.screen_name ?? tweetInfo.username;

    return {
      id: `${tweetInfo.tweetId}_api_${index}`,
      url: apiMedia.download_url,
      type: mediaType,
      filename: '',
      tweetUsername: username,
      tweetId: tweetInfo.tweetId,
      tweetUrl: tweetInfo.tweetUrl,
      tweetText: apiMedia.tweet_text,
      tweetTextHTML,
      originalUrl: apiMedia.download_url,
      thumbnailUrl: apiMedia.preview_url,
      alt: `${mediaType} ${index + 1}`,
      ...(dimensions && {
        width: dimensions.width,
        height: dimensions.height,
      }),
      metadata,
    };
  } catch (error) {
    if (__DEV__) {
      logger.error('API media create failed', error);
    }
    return null;
  }
};

/**
 * Transform API Media to MediaInfo Array
 */
export function convertAPIMediaToMediaInfo(
  apiMedias: TweetMediaEntry[],
  tweetInfo: TweetInfo,
  tweetTextHTML?: string | undefined
): MediaInfo[] {
  const mediaItems: MediaInfo[] = [];

  for (let i = 0; i < apiMedias.length; i++) {
    const apiMedia = apiMedias[i];
    if (!apiMedia) continue;

    const mediaInfo = createMediaInfoFromAPI(apiMedia, tweetInfo, i, tweetTextHTML);
    if (mediaInfo) {
      mediaItems.push(mediaInfo);
    }
  }

  return mediaItems;
}
