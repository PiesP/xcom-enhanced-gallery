/**
 * @fileoverview Twitter Video Extractor - GraphQL API Integration
 * @description Facade for Twitter API interactions, delegating to specialized services.
 * @version 4.0.0 - Added TTL-based cache, improved host detection, async CSRF support
 */

import { TWITTER_API_CONFIG } from '@constants';
import {
  buildTweetResultByRestIdUrl,
  selectTwitterApiHostFromHostname,
} from '@shared/core/twitter-api';
import { getSafeHostname, getSafeLocationHeaders } from '@shared/dom/safe-location';
import { logger } from '@shared/logging';
import { HttpRequestService } from '@shared/services/http-request-service';
import { getCsrfToken, getCsrfTokenAsync } from '@shared/services/media/twitter-auth';
import {
  extractMediaFromTweetWithDiagnostics,
  normalizeLegacyTweet,
  normalizeLegacyUserWithDiagnostics,
  type TwitterParserDiagnostic,
} from '@shared/services/media/twitter-parser';
import type { TweetMediaEntry, TwitterAPIResponse } from '@shared/services/media/types';
import { sortMediaByVisualOrder } from '@shared/utils/media/media-dimensions';

// ============================================================================
// Types
// ============================================================================

/** Cache entry with TTL tracking */
interface CacheEntry {
  response: TwitterAPIResponse;
  timestamp: number;
  csrfHash: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a simple hash for cache key differentiation.
 * @param str - String to hash
 * @returns Short hash string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Get the current host safely with fallback.
 * Supports test environments where window may not be available.
 * @returns Host domain (e.g., 'x.com' or 'twitter.com')
 */
function getSafeHost(): string {
  return selectTwitterApiHostFromHostname({
    hostname: getSafeHostname(),
    supportedHosts: TWITTER_API_CONFIG.SUPPORTED_HOSTS,
    defaultHost: TWITTER_API_CONFIG.DEFAULT_HOST,
  });
}

function logTwitterParserDiagnostics(
  diagnostics: readonly TwitterParserDiagnostic[],
  scope: string,
  extraContext?: Record<string, unknown>
): void {
  for (const diag of diagnostics) {
    const message = `[TwitterParser] ${scope}: ${diag.message}`;
    const mergedContext =
      diag.context || extraContext
        ? { ...(extraContext ?? {}), ...(diag.context ?? {}) }
        : undefined;

    if (diag.level === 'debug') {
      if (mergedContext) logger.debug(message, mergedContext);
      else logger.debug(message);
      continue;
    }

    if (diag.level === 'warn') {
      if (mergedContext) logger.warn(message, mergedContext);
      else logger.warn(message);
      continue;
    }

    if (mergedContext) logger.error(message, mergedContext);
    else logger.error(message);
  }
}

/**
 * TwitterAPI - Facade for Twitter Media Extraction
 *
 * Delegates responsibilities to:
 * - getCsrfToken/getCsrfTokenAsync: Authentication token retrieval
 * - normalizeLegacyTweet/User: Response normalization
 * - extractMediaFromTweet: Media extraction
 *
 * Cache features:
 * - TTL-based expiration (configurable via TWITTER_API_CONFIG.CACHE_TTL_MS)
 * - CSRF token hash included in cache validation
 * - Automatic invalidation on 4xx/5xx errors
 * - LRU eviction when cache limit reached
 */
export class TwitterAPI {
  /** Cache for API responses with TTL */
  private static readonly requestCache = new Map<string, CacheEntry>();
  private static readonly CACHE_LIMIT = 16;

  /**
   * Get Tweet Medias - Main API Entry Point
   */
  public static async getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
    const url = TwitterAPI.createTweetEndpointUrl(tweetId);
    const json = await TwitterAPI.apiRequest(url);

    if (!json.data?.tweetResult?.result) return [];

    let tweetResult = json.data.tweetResult.result;
    if (tweetResult.tweet) tweetResult = tweetResult.tweet;

    const tweetUser = tweetResult.core?.user_results?.result;

    normalizeLegacyTweet(tweetResult);

    if (!tweetUser) return [];
    const userDiagnostics = normalizeLegacyUserWithDiagnostics(tweetUser);
    logTwitterParserDiagnostics(userDiagnostics, 'normalizeLegacyUser', {
      tweetId,
      location: 'original',
    });

    const extracted = extractMediaFromTweetWithDiagnostics(tweetResult, tweetUser, 'original');
    logTwitterParserDiagnostics(extracted.diagnostics, 'extractMediaFromTweet', {
      tweetId,
      location: 'original',
    });

    let result = extracted.items;

    // Sort by visual order
    result = sortMediaByVisualOrder(result);

    if (tweetResult.quoted_status_result?.result) {
      let quotedTweet = tweetResult.quoted_status_result.result;
      if (quotedTweet.tweet) {
        quotedTweet = quotedTweet.tweet;
      }

      const quotedUser = quotedTweet.core?.user_results?.result;
      if (quotedTweet && quotedUser) {
        normalizeLegacyTweet(quotedTweet);
        const quotedUserDiagnostics = normalizeLegacyUserWithDiagnostics(quotedUser);
        logTwitterParserDiagnostics(quotedUserDiagnostics, 'normalizeLegacyUser', {
          tweetId,
          location: 'quoted',
        });

        const quotedExtracted = extractMediaFromTweetWithDiagnostics(
          quotedTweet,
          quotedUser,
          'quoted'
        );
        logTwitterParserDiagnostics(quotedExtracted.diagnostics, 'extractMediaFromTweet', {
          tweetId,
          location: 'quoted',
        });

        const quotedMedia = quotedExtracted.items;

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

  /**
   * Clear the API response cache.
   * Useful for testing or forced refresh.
   */
  public static clearCache(): void {
    TwitterAPI.requestCache.clear();
  }

  /**
   * Get current cache size.
   * @returns Number of cached entries
   */
  public static getCacheSize(): number {
    return TwitterAPI.requestCache.size;
  }

  /**
   * Execute GraphQL API request to Twitter.
   */
  private static async apiRequest(url: string): Promise<TwitterAPIResponse> {
    // Get CSRF token (try async for better reliability)
    const csrfToken = (await getCsrfTokenAsync()) ?? getCsrfToken() ?? '';
    const csrfHash = simpleHash(csrfToken);

    // Check cache with TTL and CSRF validation
    const cached = TwitterAPI.requestCache.get(url);
    if (cached) {
      const now = Date.now();
      const isExpired = now - cached.timestamp > TWITTER_API_CONFIG.CACHE_TTL_MS;
      const isCsrfMismatch = cached.csrfHash !== csrfHash;

      if (!isExpired && !isCsrfMismatch) {
        // Refresh insertion order to implement true LRU eviction.
        // Note: Do not refresh `timestamp` here, to keep TTL semantics unchanged.
        TwitterAPI.requestCache.delete(url);
        TwitterAPI.requestCache.set(url, cached);
        logger.debug(`Cache hit for tweet request (age: ${now - cached.timestamp}ms)`);
        return cached.response;
      }

      // Remove stale entry
      TwitterAPI.requestCache.delete(url);
      logger.debug(
        `Cache miss: ${isExpired ? 'expired' : 'CSRF mismatch'} (age: ${now - cached.timestamp}ms)`
      );
    }

    // Build headers
    const headers = new Headers({
      authorization: TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
      'x-csrf-token': csrfToken,
      'x-twitter-client-language': 'en',
      'x-twitter-active-user': 'yes',
      'content-type': 'application/json',
      'x-twitter-auth-type': 'OAuth2Session',
    });

    // Add location headers safely
    const locationHeaders = getSafeLocationHeaders();
    if (locationHeaders.referer) {
      headers.append('referer', locationHeaders.referer);
    }
    if (locationHeaders.origin) {
      headers.append('origin', locationHeaders.origin);
    }

    try {
      const httpService = HttpRequestService.getInstance();
      const response = await httpService.get<TwitterAPIResponse>(url, {
        headers: Object.fromEntries(headers.entries()),
        responseType: 'json',
      });

      if (!response.ok) {
        // Remove cache entry on error to allow retry
        TwitterAPI.requestCache.delete(url);
        logger.warn(
          `Twitter API request failed: ${response.status} ${response.statusText}`,
          response.data
        );
        throw new Error(`Twitter API request failed: ${response.status} ${response.statusText}`);
      }

      const json = response.data;

      if (json.errors && json.errors.length > 0) {
        logger.warn('Twitter API returned errors:', json.errors);
        // Don't cache error responses
      } else {
        // Cache on success with TTL tracking
        if (TwitterAPI.requestCache.size >= TwitterAPI.CACHE_LIMIT) {
          // LRU eviction: remove oldest entry
          const firstKey = TwitterAPI.requestCache.keys().next().value;
          if (firstKey) {
            TwitterAPI.requestCache.delete(firstKey);
          }
        }

        TwitterAPI.requestCache.set(url, {
          response: json,
          timestamp: Date.now(),
          csrfHash,
        });
      }

      return json;
    } catch (error) {
      // Ensure cache is cleared on any error
      TwitterAPI.requestCache.delete(url);
      logger.error('Twitter API request failed:', error);
      throw error;
    }
  }

  /**
   * Construct the GraphQL endpoint URL for fetching tweet details.
   * Uses safe host detection with fallback for test environments.
   */
  private static createTweetEndpointUrl(tweetId: string): string {
    const host = getSafeHost();

    const variables = {
      tweetId,
      withCommunity: false,
      includePromotedContent: false,
      withVoice: false,
    };

    const features = {
      creator_subscriptions_tweet_preview_api_enabled: true,
      premium_content_api_read_enabled: false,
      communities_web_enable_tweet_community_results_fetch: true,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      responsive_web_grok_analyze_button_fetch_trends_enabled: false,
      responsive_web_grok_analyze_post_followups_enabled: false,
      responsive_web_jetfuel_frame: false,
      responsive_web_grok_share_attachment_enabled: true,
      articles_preview_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      responsive_web_grok_show_grok_translated_post: false,
      responsive_web_grok_analysis_button_from_backend: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      profile_label_improvements_pcf_label_in_post_enabled: true,
      rweb_tipjar_consumption_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_grok_image_annotation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_enhance_cards_enabled: false,
    };

    const fieldToggles = {
      withArticleRichContentState: true,
      withArticlePlainText: false,
      withGrokAnalyze: false,
      withDisallowedReplyControls: false,
    };

    return buildTweetResultByRestIdUrl({
      host,
      queryId: TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID,
      tweetId,
      variables,
      features,
      fieldToggles,
    });
  }
}
