/**
 * @fileoverview Twitter Video Extractor - GraphQL API Integration
 * @description Facade for Twitter API interactions, delegating to specialized services.
 * @version 3.0.0 - Refactored for modularity
 */

import { sortMediaByVisualOrder } from "@shared/media/media-utils";
import { TwitterGraphQLClient } from "./twitter-graphql-client";
import { TwitterResponseParser } from "./twitter-response-parser";
import type { TweetMediaEntry } from "./types";

/**
 * TwitterAPI - Facade for Twitter Media Extraction
 *
 * Delegates responsibilities to:
 * - TwitterAuthService: Authentication
 * - TwitterGraphQLClient: API Requests
 * - TwitterResponseParser: Response Parsing
 */
export class TwitterAPI {
  /**
   * Get Tweet Medias - Main API Entry Point
   */
  public static async getTweetMedias(
    tweetId: string,
  ): Promise<TweetMediaEntry[]> {
    const url = TwitterGraphQLClient.createTweetEndpointUrl(tweetId);
    const json = await TwitterGraphQLClient.apiRequest(url);

    if (!json.data?.tweetResult?.result) return [];

    let tweetResult = json.data.tweetResult.result;
    if (tweetResult.tweet) tweetResult = tweetResult.tweet;

    const tweetUser = tweetResult.core?.user_results?.result;

    TwitterResponseParser.normalizeLegacyTweet(tweetResult);

    if (!tweetUser) return [];
    TwitterResponseParser.normalizeLegacyUser(tweetUser);

    let result = TwitterResponseParser.extractMediaFromTweet(
      tweetResult,
      tweetUser,
      "original",
    );

    // Sort by visual order
    result = sortMediaByVisualOrder(result);

    if (tweetResult.quoted_status_result?.result) {
      let quotedTweet = tweetResult.quoted_status_result.result;
      if (quotedTweet.tweet) {
        quotedTweet = quotedTweet.tweet;
      }

      const quotedUser = quotedTweet.core?.user_results?.result;
      if (quotedTweet && quotedUser) {
        TwitterResponseParser.normalizeLegacyTweet(quotedTweet);
        TwitterResponseParser.normalizeLegacyUser(quotedUser);

        const quotedMedia = TwitterResponseParser.extractMediaFromTweet(
          quotedTweet,
          quotedUser,
          "quoted",
        );

        const sortedQuotedMedia = sortMediaByVisualOrder(quotedMedia);

        const adjustedResult = result.map((media) => ({
          ...media,
          index: media.index + sortedQuotedMedia.length,
        }));

        result = [...sortedQuotedMedia, ...adjustedResult];
      }
    }
    return result;
  }
}
