/**
 * @fileoverview Legacy TwitterResponseParser class for backward compatibility
 * @deprecated Use functional API from './twitter-response-parser' instead
 * @version 4.0.0
 */

import type { TweetMediaEntry, TwitterTweet, TwitterUser } from '@shared/services/media/types';

import {
  extractMediaFromTweet,
  normalizeLegacyTweet,
  normalizeLegacyUser,
} from './twitter-response-parser';

/**
 * @deprecated Use functional API instead:
 * - `extractMediaFromTweet(tweetResult, tweetUser, sourceLocation)`
 * - `normalizeLegacyTweet(tweet)`
 * - `normalizeLegacyUser(user)`
 *
 * @example
 * ```typescript
 * // Before (deprecated):
 * TwitterResponseParser.extractMediaFromTweet(tweet, user, 'original');
 *
 * // After (recommended):
 * import { extractMediaFromTweet } from '@shared/services/media/twitter-parser';
 * extractMediaFromTweet(tweet, user, 'original');
 * ```
 */
export class TwitterResponseParser {
  /**
   * @deprecated Use `extractMediaFromTweet()` function instead
   */
  public static extractMediaFromTweet(
    tweetResult: TwitterTweet,
    tweetUser: TwitterUser,
    sourceLocation: 'original' | 'quoted' = 'original',
  ): TweetMediaEntry[] {
    return extractMediaFromTweet(tweetResult, tweetUser, sourceLocation);
  }

  /**
   * @deprecated Use `normalizeLegacyTweet()` function instead
   */
  public static normalizeLegacyTweet(tweet: TwitterTweet): void {
    normalizeLegacyTweet(tweet);
  }

  /**
   * @deprecated Use `normalizeLegacyUser()` function instead
   */
  public static normalizeLegacyUser(user: TwitterUser): void {
    normalizeLegacyUser(user);
  }
}
