import { logger } from '@shared/logging';
import { extractDimensionsFromUrl, normalizeDimension } from '@shared/media/media-utils';
import type { TweetMediaEntry, TwitterMedia, TwitterTweet, TwitterUser } from './types';

/**
 * Twitter Response Parser
 * Parses raw Twitter API responses into standardized media entries.
 */
export class TwitterResponseParser {
  /**
   * Extract media items from a tweet object.
   */
  public static extractMediaFromTweet(
    tweetResult: TwitterTweet,
    tweetUser: TwitterUser,
    sourceLocation: 'original' | 'quoted' = 'original',
  ): TweetMediaEntry[] {
    if (!tweetResult.extended_entities?.media) return [];

    const mediaItems: TweetMediaEntry[] = [];
    const typeIndex: Record<string, number> = {};
    const screenName = tweetUser.screen_name ?? '';
    const tweetId = tweetResult.rest_id ?? tweetResult.id_str ?? '';

    for (let index = 0; index < tweetResult.extended_entities.media.length; index++) {
      const media: TwitterMedia | undefined = tweetResult.extended_entities.media[index];
      if (!media?.type || !media.id_str || !media.media_url_https) continue;

      try {
        const mediaUrl = this.getHighQualityMediaUrl(media);
        if (!mediaUrl) continue;

        const mediaType = media.type === 'animated_gif' ? 'video' : media.type;
        typeIndex[mediaType] = (typeIndex[mediaType] ?? -1) + 1;

        const tweetText = (tweetResult.full_text ?? '').replace(` ${media.url}`, '').trim();

        const dimensionsFromUrl = extractDimensionsFromUrl(mediaUrl);
        const widthFromOriginal = normalizeDimension(media.original_info?.width);
        const heightFromOriginal = normalizeDimension(media.original_info?.height);
        const widthFromUrl = normalizeDimension(dimensionsFromUrl?.width);
        const heightFromUrl = normalizeDimension(dimensionsFromUrl?.height);
        const resolvedWidth = widthFromOriginal ?? widthFromUrl;
        const resolvedHeight = heightFromOriginal ?? heightFromUrl;

        const aspectRatioValues = Array.isArray(media.video_info?.aspect_ratio)
          ? media.video_info?.aspect_ratio
          : undefined;
        const aspectRatioWidth = normalizeDimension(aspectRatioValues?.[0]);
        const aspectRatioHeight = normalizeDimension(aspectRatioValues?.[1]);

        const entry: TweetMediaEntry = {
          screen_name: screenName,
          tweet_id: tweetId,
          download_url: mediaUrl,
          type: mediaType as 'photo' | 'video',
          typeOriginal: media.type as 'photo' | 'video' | 'animated_gif',
          index,
          typeIndex: typeIndex[mediaType] ?? 0,
          typeIndexOriginal: typeIndex[media.type] ?? 0,
          preview_url: media.media_url_https,
          media_id: media.id_str,
          media_key: media.media_key ?? '',
          expanded_url: media.expanded_url ?? '',
          short_expanded_url: media.display_url ?? '',
          short_tweet_url: media.url ?? '',
          tweet_text: tweetText,
          sourceLocation,
        };

        if (resolvedWidth) {
          entry.original_width = resolvedWidth;
        }

        if (resolvedHeight) {
          entry.original_height = resolvedHeight;
        }

        if (aspectRatioWidth && aspectRatioHeight) {
          entry.aspect_ratio = [aspectRatioWidth, aspectRatioHeight];
        } else if (resolvedWidth && resolvedHeight) {
          entry.aspect_ratio = [resolvedWidth, resolvedHeight];
        }

        mediaItems.push(entry);
      } catch (error) {
        logger.warn(`Failed to process media ${media.id_str}:`, error);
      }
    }
    return mediaItems;
  }

  /**
   * Get the highest quality URL for a media item.
   */
  private static getHighQualityMediaUrl(media: TwitterMedia): string | null {
    if (media.type === 'photo') {
      return media.media_url_https.includes('?format=')
        ? media.media_url_https
        : media.media_url_https.replace(/\.(jpg|png)$/, '?format=$1&name=orig');
    }
    if (media.type === 'video' || media.type === 'animated_gif') {
      const variants = media.video_info?.variants ?? [];
      const mp4Variants = variants.filter(v => v.content_type === 'video/mp4');
      if (mp4Variants.length === 0) return null;

      const bestVariant = mp4Variants.reduce((best, current) => {
        const bestBitrate = best.bitrate ?? 0;
        const currentBitrate = current.bitrate ?? 0;
        return currentBitrate > bestBitrate ? current : best;
      });
      return bestVariant.url;
    }
    return null;
  }

  /**
   * Normalize legacy tweet fields.
   */
  public static normalizeLegacyTweet(tweet: TwitterTweet): void {
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
   */
  public static normalizeLegacyUser(user: TwitterUser): void {
    if (user.legacy) {
      if (!user.screen_name && user.legacy.screen_name) {
        user.screen_name = user.legacy.screen_name;
      }
      if (!user.name && user.legacy.name) {
        user.name = user.legacy.name;
      }
    }
  }
}
