/**
 * @fileoverview Twitter Response Parser - Pure functional implementation
 * @description Parses raw Twitter API responses into standardized media entries.
 * @version 4.0.0 - Functional refactor from TwitterResponseParser class
 */

import { logger } from '@shared/logging';
import { extractDimensionsFromUrl, normalizeDimension } from '@shared/media/media-utils';
import type {
  TweetMediaEntry,
  TwitterMedia,
  TwitterTweet,
  TwitterUser,
} from '@shared/services/media/types';

// ============================================================================
// Types
// ============================================================================

interface TypeIndexCounter {
  [mediaType: string]: number;
}

interface MediaDimensions {
  width?: number;
  height?: number;
}

// ============================================================================
// Internal Pure Functions
// ============================================================================

/**
 * Resolve dimensions from media object and URL
 * @internal
 */
function resolveDimensions(media: TwitterMedia, mediaUrl: string): MediaDimensions {
  const dimensionsFromUrl = extractDimensionsFromUrl(mediaUrl);
  const widthFromOriginal = normalizeDimension(media.original_info?.width);
  const heightFromOriginal = normalizeDimension(media.original_info?.height);
  const widthFromUrl = normalizeDimension(dimensionsFromUrl?.width);
  const heightFromUrl = normalizeDimension(dimensionsFromUrl?.height);

  const width = widthFromOriginal ?? widthFromUrl;
  const height = heightFromOriginal ?? heightFromUrl;

  const result: MediaDimensions = {};
  if (width !== null && width !== undefined) {
    result.width = width;
  }
  if (height !== null && height !== undefined) {
    result.height = height;
  }
  return result;
}

/**
 * Resolve aspect ratio from video info or dimensions
 * @internal
 */
function resolveAspectRatio(
  media: TwitterMedia,
  dimensions: MediaDimensions,
): [number, number] | undefined {
  const aspectRatioValues = Array.isArray(media.video_info?.aspect_ratio)
    ? media.video_info?.aspect_ratio
    : undefined;
  const aspectRatioWidth = normalizeDimension(aspectRatioValues?.[0]);
  const aspectRatioHeight = normalizeDimension(aspectRatioValues?.[1]);

  if (aspectRatioWidth && aspectRatioHeight) {
    return [aspectRatioWidth, aspectRatioHeight];
  }

  if (dimensions.width && dimensions.height) {
    return [dimensions.width, dimensions.height];
  }

  return undefined;
}

/**
 * Get the highest quality URL for a photo media item
 * @internal
 */
function getPhotoHighQualityUrl(mediaUrlHttps: string): string {
  return mediaUrlHttps.includes('?format=')
    ? mediaUrlHttps
    : mediaUrlHttps.replace(/\.(jpg|png)$/, '?format=$1&name=orig');
}

/**
 * Get the highest quality URL for a video/gif media item
 * @internal
 */
function getVideoHighQualityUrl(media: TwitterMedia): string | null {
  const variants = media.video_info?.variants ?? [];
  const mp4Variants = variants.filter((v) => v.content_type === 'video/mp4');
  if (mp4Variants.length === 0) return null;

  const bestVariant = mp4Variants.reduce((best, current) => {
    const bestBitrate = best.bitrate ?? 0;
    const currentBitrate = current.bitrate ?? 0;
    return currentBitrate > bestBitrate ? current : best;
  });
  return bestVariant.url;
}

/**
 * Get the highest quality URL for any media type
 * @internal
 */
function getHighQualityMediaUrl(media: TwitterMedia): string | null {
  if (media.type === 'photo') {
    return getPhotoHighQualityUrl(media.media_url_https);
  }
  if (media.type === 'video' || media.type === 'animated_gif') {
    return getVideoHighQualityUrl(media);
  }
  return null;
}

/**
 * Create a TweetMediaEntry from raw media data
 * @internal
 */
function createMediaEntry(
  media: TwitterMedia,
  mediaUrl: string,
  screenName: string,
  tweetId: string,
  tweetText: string,
  index: number,
  typeIndex: number,
  typeIndexOriginal: number,
  sourceLocation: 'original' | 'quoted',
): TweetMediaEntry {
  const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
  const dimensions = resolveDimensions(media, mediaUrl);
  const aspectRatio = resolveAspectRatio(media, dimensions);

  const entry: TweetMediaEntry = {
    screen_name: screenName,
    tweet_id: tweetId,
    download_url: mediaUrl,
    type: mediaType as 'photo' | 'video',
    typeOriginal: media.type as 'photo' | 'video' | 'animated_gif',
    index,
    typeIndex,
    typeIndexOriginal,
    preview_url: media.media_url_https,
    media_id: media.id_str,
    media_key: media.media_key ?? '',
    expanded_url: media.expanded_url ?? '',
    short_expanded_url: media.display_url ?? '',
    short_tweet_url: media.url ?? '',
    tweet_text: tweetText,
    sourceLocation,
  };

  if (dimensions.width) {
    entry.original_width = dimensions.width;
  }

  if (dimensions.height) {
    entry.original_height = dimensions.height;
  }

  if (aspectRatio) {
    entry.aspect_ratio = aspectRatio;
  }

  return entry;
}

// ============================================================================
// Public API - Pure Functions
// ============================================================================

/**
 * Extract media items from a tweet object.
 *
 * Parses the extended_entities.media array from a Twitter tweet
 * and returns standardized media entries with proper URLs and metadata.
 *
 * @param tweetResult - Raw tweet result from Twitter API
 * @param tweetUser - User information for the tweet author
 * @param sourceLocation - Whether this is from the original tweet or quoted tweet
 * @returns Array of TweetMediaEntry objects
 *
 * @example
 * ```typescript
 * const mediaItems = extractMediaFromTweet(tweetResult, user, 'original');
 * ```
 */
export function extractMediaFromTweet(
  tweetResult: TwitterTweet,
  tweetUser: TwitterUser,
  sourceLocation: 'original' | 'quoted' = 'original',
): TweetMediaEntry[] {
  if (!tweetResult.extended_entities?.media) return [];

  const mediaItems: TweetMediaEntry[] = [];
  const typeIndex: TypeIndexCounter = {};
  const screenName = tweetUser.screen_name ?? '';
  const tweetId = tweetResult.rest_id ?? tweetResult.id_str ?? '';

  for (let index = 0; index < tweetResult.extended_entities.media.length; index++) {
    const media: TwitterMedia | undefined = tweetResult.extended_entities.media[index];
    if (!media?.type || !media.id_str || !media.media_url_https) continue;

    try {
      const mediaUrl = getHighQualityMediaUrl(media);
      if (!mediaUrl) continue;

      const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
      typeIndex[mediaType] = (typeIndex[mediaType] ?? -1) + 1;
      typeIndex[media.type] = typeIndex[media.type] ?? typeIndex[mediaType];

      const tweetText = (tweetResult.full_text ?? '').replace(` ${media.url}`, '').trim();

      const entry = createMediaEntry(
        media,
        mediaUrl,
        screenName,
        tweetId,
        tweetText,
        index,
        typeIndex[mediaType] ?? 0,
        typeIndex[media.type] ?? 0,
        sourceLocation,
      );

      mediaItems.push(entry);
    } catch (error) {
      logger.warn(`Failed to process media ${media.id_str}:`, error);
    }
  }

  return mediaItems;
}

/**
 * Normalize legacy tweet fields.
 *
 * Twitter API responses may have data in different locations depending
 * on the API version. This function normalizes the fields to a consistent
 * location for easier processing.
 *
 * @param tweet - Tweet object to normalize (mutates in place)
 *
 * @example
 * ```typescript
 * normalizeLegacyTweet(tweetResult);
 * // Now tweetResult.extended_entities is guaranteed to be populated if available
 * ```
 */
export function normalizeLegacyTweet(tweet: TwitterTweet): void {
  if (tweet.legacy) {
    if (!tweet.extended_entities && tweet.legacy.extended_entities) {
      tweet.extended_entities = tweet.legacy.extended_entities;
    }
    if (!tweet.full_text && tweet.legacy.full_text) {
      tweet.full_text = tweet.legacy.full_text;
    }
    if (!tweet.id_str && tweet.legacy.id_str) {
      tweet.id_str = tweet.legacy.id_str;
    }
  }

  const noteTweetText = tweet.note_tweet?.note_tweet_results?.result?.text;
  if (noteTweetText) {
    tweet.full_text = noteTweetText;
  }
}

/**
 * Normalize legacy user fields.
 *
 * @param user - User object to normalize (mutates in place)
 *
 * @example
 * ```typescript
 * normalizeLegacyUser(tweetUser);
 * // Now tweetUser.screen_name is guaranteed to be populated if available
 * ```
 */
export function normalizeLegacyUser(user: TwitterUser): void {
  if (user.legacy) {
    if (!user.screen_name && user.legacy.screen_name) {
      user.screen_name = user.legacy.screen_name;
    }
    if (!user.name && user.legacy.name) {
      user.name = user.legacy.name;
    }
  }
}

// ============================================================================
// Exported Utilities (for advanced use cases)
// ============================================================================

export { getHighQualityMediaUrl, resolveDimensions, resolveAspectRatio };
