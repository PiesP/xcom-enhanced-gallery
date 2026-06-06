// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Twitter Video Extractor - GraphQL API Integration
 * @description Facade for Twitter API interactions, delegating to specialized services.
 */

import { buildTweetResultByRestIdUrl, TWITTER_API_CONFIG } from '@shared/core/twitter-api/endpoint';
import { logger } from '@shared/logging/logger';
import { HttpRequestService } from '@shared/services/http-request-service';
import {
  getCsrfTokenAsync,
  resolveBearerToken,
} from '@shared/services/media/twitter-auth/twitter-auth';
import {
  extractMediaFromTweet,
  normalizeLegacyTweet,
  normalizeLegacyUser,
} from '@shared/services/media/twitter-parser/twitter-response-parser';
import type { TweetMediaEntry, TwitterAPIResponse } from '@shared/services/media/types';
import { sortMediaByVisualOrder } from '@shared/utils/media/media-dimensions';

// ============================================================================
// Safe Location Helpers (inlined from safe-location.ts)
// ============================================================================

function getSafeHostname(): string | undefined {
  return globalThis.location?.hostname;
}

interface SafeLocationHeaders {
  readonly referer?: string;
  readonly origin?: string;
}

function getSafeLocationHeaders(): SafeLocationHeaders {
  const referer = globalThis.location?.href;
  const origin = globalThis.location?.origin;

  if (!referer && !origin) return {};

  return {
    ...(referer ? { referer } : {}),
    ...(origin ? { origin } : {}),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function resolveTwitterApiHost(
  hostname: string | null | undefined,
  supportedHosts: readonly string[],
  defaultHost: string
): string {
  if (!hostname) return defaultHost;

  const normalized = hostname.toLowerCase();

  for (const host of supportedHosts) {
    if (normalized === host || normalized.endsWith(`.${host}`)) {
      return host;
    }
  }
  return defaultHost;
}

function getSafeHost(): string {
  return resolveTwitterApiHost(
    getSafeHostname(),
    TWITTER_API_CONFIG.SUPPORTED_HOSTS,
    TWITTER_API_CONFIG.DEFAULT_HOST
  );
}

function createTweetEndpointUrl(tweetId: string): string {
  const host = getSafeHost();

  const variables = {
    tweetId,
    withCommunity: false,
    includePromotedContent: false,
    withVoice: false,
  };

  return buildTweetResultByRestIdUrl({
    host,
    queryId: TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID,
    variables,
    features: {
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
    } as const,
    fieldToggles: {
      withArticleRichContentState: true,
      withArticlePlainText: false,
      withGrokAnalyze: false,
      withDisallowedReplyControls: false,
    } as const,
  });
}

async function apiRequest(url: string): Promise<TwitterAPIResponse> {
  const csrfToken = (await getCsrfTokenAsync()) ?? '';
  const authorization = resolveBearerToken() ?? TWITTER_API_CONFIG.GUEST_AUTHORIZATION;

  const headers = new Headers({
    authorization,
    'x-csrf-token': csrfToken,
    'x-twitter-client-language': 'en',
    'x-twitter-active-user': 'yes',
    'content-type': 'application/json',
    'x-twitter-auth-type': 'OAuth2Session',
  });

  const locationHeaders = getSafeLocationHeaders();
  if (locationHeaders.referer) {
    headers.append('referer', locationHeaders.referer);
  }
  if (locationHeaders.origin) {
    headers.append('origin', locationHeaders.origin);
  }

  const httpService = HttpRequestService.getInstance();
  const response = await httpService.get<TwitterAPIResponse>(url, {
    headers: Object.fromEntries(headers.entries()),
    responseType: 'json',
  });

  if (!response.ok) {
    if (__DEV__) {
      logger.warn(`Twitter API request failed: ${response.status}`, response.data);
    }
    throw new Error(`TW:${response.status}`);
  }

  const json = response.data;

  if (__DEV__ && json.errors && json.errors.length > 0) {
    logger.warn('Twitter API returned errors:', json.errors);
  }

  return json;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get Tweet Medias - Main API Entry Point
 */
export async function getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
  const url = createTweetEndpointUrl(tweetId);
  const json = await apiRequest(url);

  if (!json.data?.tweetResult?.result) return [];

  let tweetResult = json.data.tweetResult.result;
  if (tweetResult.tweet) tweetResult = tweetResult.tweet;

  const tweetUser = tweetResult.core?.user_results?.result;

  normalizeLegacyTweet(tweetResult);

  if (!tweetUser) return [];
  normalizeLegacyUser(tweetUser);

  let result = extractMediaFromTweet(tweetResult, tweetUser, 'original');

  result = sortMediaByVisualOrder(result);

  if (tweetResult.quoted_status_result?.result) {
    let quotedTweet = tweetResult.quoted_status_result.result;
    if (quotedTweet.tweet) {
      quotedTweet = quotedTweet.tweet;
    }

    const quotedUser = quotedTweet.core?.user_results?.result;
    if (quotedTweet && quotedUser) {
      normalizeLegacyTweet(quotedTweet);
      normalizeLegacyUser(quotedUser);

      const quotedMedia = extractMediaFromTweet(quotedTweet, quotedUser, 'quoted');

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
