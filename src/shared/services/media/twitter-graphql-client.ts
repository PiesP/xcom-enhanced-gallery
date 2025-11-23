import { TWITTER_API_CONFIG } from "@/constants";
import { logger } from "@shared/logging";
import { HttpRequestService } from "@shared/services/http-request-service";
import { TwitterAuthService } from "./twitter-auth-service";
import type { TwitterAPIResponse } from "./types";

/**
 * Twitter GraphQL Client
 * Handles HTTP requests to Twitter's GraphQL API with caching and authentication.
 */
export class TwitterGraphQLClient {
  /** LRU cache for API responses (max 16 entries) */
  private static readonly requestCache = new Map<string, TwitterAPIResponse>();
  private static readonly CACHE_LIMIT = 16;

  /**
   * Execute GraphQL API request to Twitter.
   */
  public static async apiRequest(url: string): Promise<TwitterAPIResponse> {
    const _url = url.toString();

    // Check cache first
    if (this.requestCache.has(_url)) {
      return this.requestCache.get(_url)!;
    }

    // Build headers
    const headers = new Headers({
      authorization: TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
      "x-csrf-token": TwitterAuthService.csrfToken ?? "",
      "x-twitter-client-language": "en",
      "x-twitter-active-user": "yes",
      "content-type": "application/json",
      "x-twitter-auth-type": "OAuth2Session",
    });

    if (typeof window !== "undefined") {
      headers.append("referer", window.location.href);
      headers.append("origin", window.location.origin);
    }

    try {
      const httpService = HttpRequestService.getInstance();
      const response = await httpService.get<TwitterAPIResponse>(_url, {
        headers: Object.fromEntries(headers.entries()),
        responseType: "json",
      });

      if (!response.ok) {
        logger.warn(
          `Twitter API request failed: ${response.status} ${response.statusText}`,
          response.data,
        );
        throw new Error(
          `Twitter API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const json = response.data;

      if (json.errors && json.errors.length > 0) {
        logger.warn("Twitter API returned errors:", json.errors);
      }

      // Cache on success
      if (response.ok) {
        if (this.requestCache.size >= this.CACHE_LIMIT) {
          const firstKey = this.requestCache.keys().next().value;
          if (firstKey) this.requestCache.delete(firstKey);
        }
        this.requestCache.set(_url, json);
      }

      return json;
    } catch (error) {
      logger.error("Twitter API request failed:", error);
      throw error;
    }
  }

  /**
   * Construct the GraphQL endpoint URL for fetching tweet details.
   */
  public static createTweetEndpointUrl(tweetId: string): string {
    const sitename = window.location.hostname.replace(".com", "");

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

    const urlBase = `https://${sitename}.com/i/api/graphql/${TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID}/TweetResultByRestId`;
    const urlObj = new URL(urlBase);
    urlObj.searchParams.set("variables", JSON.stringify(variables));
    urlObj.searchParams.set("features", JSON.stringify(features));
    urlObj.searchParams.set("fieldToggles", JSON.stringify(fieldToggles));
    return urlObj.toString();
  }
}
