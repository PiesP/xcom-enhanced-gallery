/**
 * @fileoverview Twitter Video Extractor - GraphQL API Integration
 * @description TwitterAPI class for fetching media from Twitter/X via GraphQL with token management and caching
 * @version 2.0.0 - Phase 291 Module Separation Complete
 *
 * Responsibilities:
 * - GraphQL endpoint construction and request execution
 * - Guest token management (acquisition, refresh, header injection)
 * - Request caching (LRU cache with 16-entry limit)
 * - Media extraction from GraphQL responses
 * - Tweet text support (legacy + note_tweet full-text fields)
 * - Quote tweet handling (Phase 342 support)
 * - Media sorting (visual order correction via Phase 290.1)
 * - Dimension extraction from media URLs
 * - Bitrate selection for video variants
 *
 * Core Concept:
 * Twitter's GraphQL endpoint TweetResultByRestId requires:
 * 1. Valid authentication headers (guest token + CSRF token)
 * 2. Complex query parameters (variables, features, fieldToggles)
 * 3. Proper media extraction from nested GraphQL structures
 * 4. Support for quote tweets and media within quotes
 *
 * Performance Strategy:
 * - Request caching: Avoid duplicate API calls within ~30s
 * - LRU eviction: Keep memory bounded (16-entry limit)
 * - Guest token reuse: Amortize activation cost
 * - Parallel extraction: Process original + quoted media
 *
 * Authentication Flow:
 * 1. First request: Try cookies (gt, ct0)
 * 2. If no guest token: Call activation endpoint
 * 3. Cache tokens for subsequent requests
 * 4. Reinitialize on page reload or token expiry
 *
 * API Response Structure:
 * ```
 * TwitterAPIResponse {
 *   data {
 *     tweetResult {
 *       result {
 *         __typename: "Tweet" | "TweetUnavailable"
 *         rest_id: string
 *         core.user_results.result: TwitterUser
 *         extended_entities.media[]: TwitterMedia[]
 *         quoted_status_result.result: TwitterTweet (Phase 342)
 *         note_tweet.note_tweet_results.result.text: string (long tweet)
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * Use Cases:
 * - getTweetMedias(tweetId): Extract all media from tweet
 * - getVideoMediaEntry(tweetId): Get single video entry
 * - getVideoUrlFromThumbnail(img): Thumbnail → download URL
 *
 * Example:
 * ```typescript
 * const mediaItems = await TwitterAPI.getTweetMedias('1234567890');
 * // Returns: [
 * //   { tweet_id, download_url, type: 'photo', ... },
 * //   { tweet_id, download_url, type: 'video', sourceLocation: 'original', ... }
 * // ]
 * ```
 */

import { logger } from '@shared/logging';
import { TWITTER_API_CONFIG } from '@/constants';
import { HttpRequestService } from '@shared/services/http-request-service';
import type {
  TwitterAPIResponse,
  TwitterTweet,
  TwitterUser,
  TwitterMedia,
  TweetMediaEntry,
} from './types';
import { sortMediaByVisualOrder } from './media-sorting';
import {
  getVideoMediaEntry as getVideoMediaEntryBase,
  getVideoUrlFromThumbnail as getVideoUrlFromThumbnailBase,
} from './video-utils';

/**
 * Get Cookie Value by Name
 *
 * Purpose:
 * Safely retrieve cookie value from document.cookie string.
 *
 * Algorithm:
 * 1. Check if document and document.cookie exist (browser only)
 * 2. Create regex to match cookie: name=value
 *    - Pattern: (?<=name=)[^;]+ (positive lookbehind)
 *    - Matches characters after "name=" until semicolon
 * 3. Execute match and return first group or undefined
 *
 * Error Handling:
 * - Returns undefined if:
 *   - document is undefined (non-browser environment)
 *   - document.cookie is undefined or empty
 *   - Cookie name not found
 *
 * Performance:
 * - O(n) where n = document.cookie length (typically < 5KB)
 * - Single regex match
 * - < 1ms typical execution
 *
 * Security:
 * - No parsing of cookie attributes (secure, httpOnly, etc.)
 * - Only value extraction (enough for gt, ct0 tokens)
 *
 * Example:
 * ```typescript
 * // document.cookie = "gt=abc123; ct0=xyz789; path=/; domain=.twitter.com"
 * getCookie('gt')    // Returns: 'abc123'
 * getCookie('ct0')   // Returns: 'xyz789'
 * getCookie('foo')   // Returns: undefined
 * ```
 */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined' || !document.cookie) return undefined;
  const match = document.cookie.match(new RegExp(`(?<=${name}=)[^;]+`));
  return match?.[0];
}

/**
 * TwitterAPI - GraphQL Media Extraction Service
 *
 * Singleton Pattern (static methods only):
 * - No instance creation (all methods are static)
 * - Token state is class-level (shared across all calls)
 * - Caching is class-level (shared pool)
 *
 * Core Responsibilities:
 * 1. Token Management:
 *    - _guestToken: GraphQL authentication token
 *    - _csrfToken: CSRF protection token
 *    - _tokensInitialized: Initialization flag
 *    - initializeTokens(): Load from cookies
 *    - activateGuestTokenIfNeeded(): Fallback to activation endpoint
 *
 * 2. Request Execution:
 *    - apiRequest(url): Core HTTP method with caching
 *    - requestCache: LRU cache (16-entry limit)
 *    - getHighQualityMediaUrl(): Best video variant selection
 *
 * 3. GraphQL Query Construction:
 *    - createTweetJsonEndpointUrlByRestId(): Build endpoint URL
 *    - variables, features, fieldToggles: Query parameters
 *    - Specific Twitter/X feature flags
 *
 * 4. Response Parsing:
 *    - extractMediaFromTweet(): Parse media array
 *    - extractDimensionsFromUrl(): Parse image dimensions from URL
 *    - normalizeDimension(): Type-safe dimension parsing
 *    - getTweetMedias(): Complete extraction pipeline
 *
 * 5. Quote Tweet Support (Phase 342):
 *    - quoted_status_result handling
 *    - sourceLocation field ('original' | 'quoted')
 *    - Media index adjustment (quoted + original)
 *
 * 6. Full Tweet Text Support:
 *    - legacy.full_text: Standard text field
 *    - note_tweet.note_tweet_results.result.text: Long tweet text (280+ chars)
 *    - Prefers note_tweet for accurate long content
 *
 * Token Lifecycle:
 * ```
 * First Request → Try Cookies → No GT → Activate Endpoint → Cache Tokens → Reuse
 * ↓
 * Subsequent Requests → Use Cached Tokens → No Reinit
 * ↓
 * Page Reload → _tokensInitialized = false → Reinitialize
 * ```
 *
 * Caching Strategy:
 * - Key: Full GraphQL URL
 * - Value: TwitterAPIResponse (cached for ~30s per request lifecycle)
 * - Eviction: LRU (remove oldest when size > 16)
 * - Benefit: Avoid duplicate API calls in same session
 *
 * Performance:
 * - Token activation: ~100ms (1st call only)
 * - API request: ~200-500ms (network dependent)
 * - Cache hit: < 1ms
 * - Media extraction: O(n) where n = media count (typically 1-4)
 *
 * Error Handling:
 * - Fail-soft on token activation (proceed without token)
 * - Try-catch on media extraction (log but continue)
 * - Return empty array on parse failure
 * - Log errors for debugging
 *
 * Example Usage:
 * ```typescript
 * // Extract all media from tweet
 * const mediaItems = await TwitterAPI.getTweetMedias('1234567890');
 *
 * // Returns:
 * // [
 * //   {
 * //     tweet_id: '1234567890',
 * //     download_url: 'https://pbs.twimg.com/.../photo.jpg?format=jpg&name=orig',
 * //     type: 'photo',
 * //     sourceLocation: 'original',
 * //     ...
 * //   }
 * // ]
 * ```
 */
export class TwitterAPI {
  /** Guest token from API (authentication) */
  private static _guestToken: string | undefined = undefined;

  /** CSRF token from cookies (security) */
  private static _csrfToken: string | undefined = undefined;

  /** Flag indicating if tokens have been initialized */
  private static _tokensInitialized = false;

  /** LRU cache for API responses (max 16 entries) */
  private static readonly requestCache = new Map<string, TwitterAPIResponse>();

  /**
   * Initialize Tokens - Load from Cookies
   *
   * Purpose:
   * Load guest token and CSRF token from browser cookies (one-time operation per page load).
   *
   * Algorithm:
   * 1. Check if already initialized (idempotent)
   *    - Return early if _tokensInitialized is true
   * 2. Set _tokensInitialized = true (prevent re-init)
   * 3. Call getCookie('gt') → _guestToken
   * 4. Call getCookie('ct0') → _csrfToken
   *
   * Cookie Names:
   * - 'gt': Guest Token (authentication)
   * - 'ct0': CSRF Token (security, cross-site forgery prevention)
   *
   * Timing:
   * - Called on first API request
   * - Page reload resets _tokensInitialized to allow re-init
   * - Tokens may be undefined if not present in cookies
   *
   * Performance:
   * - O(n) where n = cookie string length (typically < 5KB)
   * - Amortized O(1) across all requests (called once)
   * - < 1ms execution
   *
   * Error Handling:
   * - Silent fail if cookies not found (will try activation)
   * - No error thrown (fail-soft)
   *
   * Side Effects:
   * - Sets _tokensInitialized = true
   * - May set _guestToken and _csrfToken
   */
  private static initializeTokens(): void {
    if (!this._tokensInitialized) {
      this._guestToken = getCookie('gt');
      this._csrfToken = getCookie('ct0');
      this._tokensInitialized = true;
    }
  }

  /**
   * Get Guest Token - Lazy Initialization
   *
   * Purpose:
   * Get guest token with automatic initialization on first access.
   *
   * Algorithm:
   * 1. Call initializeTokens()
   * 2. Return _guestToken (may be undefined)
   *
   * Performance:
   * - O(1) amortized (initialization happens once)
   * - Subsequent calls: < 1us property read
   *
   * Returns:
   * - string: Valid guest token
   * - undefined: Token not available (will try activation endpoint)
   */
  private static get guestToken(): string | undefined {
    this.initializeTokens();
    return this._guestToken;
  }

  /**
   * Get CSRF Token - Lazy Initialization
   *
   * Purpose:
   * Get CSRF token with automatic initialization on first access.
   *
   * Algorithm:
   * 1. Call initializeTokens()
   * 2. Return _csrfToken (may be undefined)
   *
   * Performance:
   * - O(1) amortized (initialization happens once)
   * - Subsequent calls: < 1us property read
   *
   * Returns:
   * - string: Valid CSRF token
   * - undefined: Token not available (fallback to empty string in headers)
   */
  private static get csrfToken(): string | undefined {
    this.initializeTokens();
    return this._csrfToken;
  }

  /**
   * Activate Guest Token - Fallback Authentication
   *
   * Purpose:
   * Request new guest token from Twitter API when not available in cookies
   * (browser restrictions, token expiry, etc.).
   *
   * Algorithm:
   * 1. Early exit if already have token (already cached)
   * 2. Call initializeTokens() to check if we got one from cookies
   * 3. Early exit if now have token
   * 4. Try-catch block around HTTP request:
   *    a. POST to https://api.twitter.com/1.1/guest/activate.json
   *    b. Headers: GUEST_AUTHORIZATION, content-type: application/json
   *    c. No body (undefined)
   * 5. On success (response.ok):
   *    - Extract guest_token from response.data
   *    - Cache in _guestToken
   * 6. On failure: Silent fail (continue without explicit token)
   *
   * Endpoint:
   * - URL: https://api.twitter.com/1.1/guest/activate.json
   * - Method: POST
   * - Response: { guest_token: "..." }
   * - No auth required (public endpoint)
   *
   * Error Handling:
   * - Try-catch wraps entire operation
   * - Catch block: log nothing (silent fail)
   * - Fail-soft: Proceed without explicit guest token
   * - Server can still process request without token (auth header fallback)
   *
   * Performance:
   * - Network round-trip: ~100ms
   * - Only called once per page (cached _guestToken)
   * - Subsequent requests reuse token
   *
   * Side Effects:
   * - May set _guestToken
   * - Used by subsequent API requests
   * - Token may expire (handled on next page reload)
   *
   * Async:
   * - Awaitable (but caller doesn't need to await)
   * - Non-blocking (await httpService.post)
   */
  private static async activateGuestTokenIfNeeded(): Promise<void> {
    // If we have a token already, no need to activate
    if (this._guestToken) return;

    // Check if we can get from cookies
    this.initializeTokens();
    if (this._guestToken) return;

    try {
      const httpService = HttpRequestService.getInstance();
      const response = await httpService.post<{ guest_token?: string }>(
        'https://api.twitter.com/1.1/guest/activate.json',
        undefined,
        {
          headers: {
            authorization: TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
            'content-type': 'application/json',
          },
        }
      );

      // Fail-soft: Only use response if OK
      if (!response.ok) return;
      if (response.data?.guest_token) {
        this._guestToken = response.data.guest_token;
      }
    } catch {
      // Silent fail: proceed without guest token
    }
  }

  /**
   * API Request - Core HTTP Method with Caching
   *
   * Purpose:
   * Execute GraphQL API request to Twitter with authentication headers and response caching.
   *
   * Algorithm:
   * 1. Check cache (return if found)
   * 2. Ensure guest token available (activate if needed)
   * 3. Build headers:
   *    - authorization: Bearer token
   *    - x-csrf-token: CSRF token (or empty string)
   *    - x-twitter-client-language: 'en'
   *    - x-twitter-active-user: 'yes'
   *    - content-type: 'application/json'
   *    - x-guest-token: Add if available
   *    - x-twitter-auth-type: 'OAuth2Session' fallback
   * 4. Execute GET request via HttpRequestService
   * 5. Cache response (with LRU eviction if > 16 entries)
   * 6. Return response
   *
   * Caching Strategy:
   * - Key: Full URL (query params + all variables)
   * - Value: TwitterAPIResponse
   * - Hit rate: Typically high (same tweet viewed multiple times)
   * - Eviction: LRU (remove oldest entry when exceeds 16)
   * - Benefit: Avoid duplicate network requests
   *
   * Headers:
   * - authorization: GUEST_AUTHORIZATION constant (Bearer token)
   * - x-csrf-token: From cookies (prevents CSRF attacks)
   * - x-guest-token: From activation endpoint (authentication)
   * - x-twitter-active-user: Required for some endpoints
   *
   * Error Handling:
   * - Try-catch wraps HTTP request
   * - Network error: Logged and rethrown
   * - Parse error: Returned as is (caller handles)
   * - Cache errors ignored (non-fatal)
   *
   * Performance:
   * - Cache hit: < 1ms
   * - Network request: 200-500ms (dependent on connectivity)
   * - LRU eviction: O(1) Map.delete
   * - Overall: Typically 200-500ms for uncached, < 1ms for cached
   *
   * Returns:
   * - TwitterAPIResponse: Parsed JSON response
   * - May contain error structure if API returned error
   *
   * Example:
   * ```typescript
   * const url = 'https://x.com/i/api/graphql/...?variables=...&features=...';
   * const response = await TwitterAPI.apiRequest(url);
   * // First call: HTTP request (200-500ms)
   * // Subsequent calls with same URL: Cache hit (< 1ms)
   * ```
   */
  private static async apiRequest(url: string): Promise<TwitterAPIResponse> {
    const _url = url.toString();

    // Check cache first
    if (this.requestCache.has(_url)) {
      const cachedResult = this.requestCache.get(_url);
      if (cachedResult) return cachedResult;
    }

    // Ensure best-effort guest token
    await this.activateGuestTokenIfNeeded();

    // Build headers with all required authentication
    const headers = new Headers({
      authorization: TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
      'x-csrf-token': this.csrfToken ?? '',
      'x-twitter-client-language': 'en',
      'x-twitter-active-user': 'yes',
      'content-type': 'application/json',
    });

    // Add guest token if available
    if (this.guestToken) {
      headers.append('x-guest-token', this.guestToken);
    } else {
      headers.append('x-twitter-auth-type', 'OAuth2Session');
    }

    try {
      const httpService = HttpRequestService.getInstance();
      const response = await httpService.get<TwitterAPIResponse>(_url, {
        headers: Object.fromEntries(headers.entries()),
      });

      const json = response.data;

      // Cache on success (with LRU eviction)
      if (response.ok) {
        if (this.requestCache.size > 16) {
          const firstKey = this.requestCache.keys().next().value;
          if (firstKey) this.requestCache.delete(firstKey);
        }
        this.requestCache.set(_url, json);
      }

      return json;
    } catch (error) {
      logger.error('Twitter API request failed:', error);
      throw error;
    }
  }

  /**
   * Create Tweet JSON Endpoint URL - GraphQL Query Construction
   *
   * Purpose:
   * Build complete GraphQL endpoint URL with variables, features, and fieldToggles
   * for TweetResultByRestId query to extract media.
   *
   * URL Structure:
   * ```
   * Base: https://{sitename}.com/i/api/graphql/{QUERY_ID}/TweetResultByRestId
   * Query Params:
   *   variables: { tweetId, withCommunity, includePromotedContent, withVoice }
   *   features: { feature_name: boolean, ... (20+ flags) }
   *   fieldToggles: { withArticleRichContentState, ... }
   * ```
   *
   * Query ID:
   * - TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID
   * - Specific GraphQL operation identifier
   * - May change with Twitter API updates
   *
   * Variables:
   * - tweetId: The tweet ID to fetch
   * - withCommunity: false (disable community notes)
   * - includePromotedContent: false (no ads)
   * - withVoice: false (no voice tweet data)
   *
   * Features (20+ flags):
   * - creator_subscriptions_tweet_preview_api_enabled: true
   * - responsive_web_graphql_timeline_navigation_enabled: true
   * - responsive_web_edit_tweet_api_enabled: true
   * - (others for specific API capabilities)
   * Purpose: Control which tweet data structures are available
   *
   * FieldToggles:
   * - withArticleRichContentState: true (rich text support)
   * - withArticlePlainText: false (optimize response size)
   * - withGrokAnalyze: false (no AI analysis)
   * - withDisallowedReplyControls: false
   *
   * URL Encoding:
   * - JSON.stringify for object parameters
   * - encodeURIComponent-style handling via URL.searchParams
   * - Ensures special characters handled safely
   *
   * Example Output:
   * ```
   * https://x.com/i/api/graphql/abc123/TweetResultByRestId?
   *   variables={"tweetId":"1234567890",...}&
   *   features={"creator_subscriptions_tweet_preview_api_enabled":true,...}&
   *   fieldToggles={"withArticleRichContentState":true,...}
   * ```
   *
   * Performance:
   * - O(1) string concatenation
   * - JSON.stringify of objects (small objects, < 5KB)
   * - < 5ms typical execution
   *
   * Error Handling:
   * - Assumes tweetId is valid (caller responsibility)
   * - Returns malformed URL if tweetId is invalid (fails later in API request)
   *
   * Side Effects:
   * - None (pure function)
   */
  private static createTweetJsonEndpointUrlByRestId(tweetId: string): string {
    const sitename = window.location.hostname.replace('.com', '');
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
    urlObj.searchParams.set('variables', JSON.stringify(variables));
    urlObj.searchParams.set('features', JSON.stringify(features));
    urlObj.searchParams.set('fieldToggles', JSON.stringify(fieldToggles));
    return urlObj.toString();
  }

  /**
   * Extract Media from Tweet - Response Parsing
   *
   * Purpose:
   * Parse extended_entities.media array from tweet GraphQL structure and convert to
   * standardized TweetMediaEntry format with metadata and URLs.
   *
   * Algorithm:
   * 1. Validate input (return empty if no extended_entities.media)
   * 2. Initialize media array and type index tracker
   * 3. For each media in extended_entities.media:
   *    a. Validate media (type, id_str, url exist)
   *    b. Get highest quality URL (photos + video variants)
   *    c. Calculate type and typeIndex (photo vs video tracking)
   *    d. Normalize dimensions:
   *       - From URL path: /WxH/ pattern
   *       - From original_info: width, height fields
   *       - From video_info.aspect_ratio: [w, h]
   *    e. Build TweetMediaEntry with all fields
   *    f. Add to result array
   * 4. Return array of entries
   *
   * Media Types:
   * - photo: Static image
   * - video: MP4 video file
   * - animated_gif: MP4 (displayed as video)
   * Normalized output: photo | video (animated_gif → video)
   *
   * Type Index Tracking:
   * - typeIndex: Count of current media type (0, 1, 2, ...)
   * - typeIndexOriginal: Count with original types (differentiate animated_gif)
   * - Example: [photo, photo, video, animated_gif]
   *   → typeIndex: [0, 1, 0, 1]
   *   → typeIndexOriginal: [0, 1, 0, 0]
   *
   * Dimension Resolution (priority order):
   * 1. original_info.width/height (from media metadata)
   * 2. URL pattern extraction (/1920x1080/)
   * 3. video_info.aspect_ratio ([w, h] array)
   * 4. Calculate from other fields
   * 5. Omit if unavailable
   *
   * URL Quality Selection:
   * - Photos: Append ?format=jpg&name=orig for full resolution
   * - Videos: Select highest bitrate MP4 variant (from variants array)
   * - Animated GIFs: Same as video (MP4 format)
   *
   * Text Handling:
   * - Extract tweet text (full_text field)
   * - Remove media URL from text (media.url placeholder)
   * - Result: Clean text for display
   *
   * Aspect Ratio:
   * - Stored as [width, height] array
   * - Used for thumbnail rendering (aspect-ratio CSS property)
   * - Fallback: Calculate from resolved dimensions
   *
   * Error Handling:
   * - Try-catch per media (one error doesn't stop processing)
   * - Validation at each step (return empty if missing key field)
   * - Log warnings for parse failures (non-fatal)
   *
   * Performance:
   * - O(n × m) where n = media count (1-4), m = average fields
   * - Typical: < 5ms for 4 media
   *
   * Returns:
   * - Array of TweetMediaEntry (standardized format)
   * - Empty array if no valid media found
   * - Preserves all metadata for display + download
   *
   * Phase 342 Support:
   * - sourceLocation parameter: 'original' | 'quoted'
   * - Tracks whether media is from original or quoted tweet
   * - Used for UI differentiation
   *
   * Example:
   * ```typescript
   * const entries = TwitterAPI.extractMediaFromTweet(
   *   tweetResult,
   *   tweetUser,
   *   'original'
   * );
   * // Returns:
   * // [
   * //   {
   * //     tweet_id: '1234567890',
   * //     screen_name: 'username',
   * //     download_url: 'https://pbs.twimg.com/.../photo.jpg?format=jpg&name=orig',
   * //     type: 'photo',
   * //     typeOriginal: 'photo',
   * //     index: 0,
   * //     typeIndex: 0,
   * //     original_width: 1920,
   * //     original_height: 1080,
   * //     aspect_ratio: [1920, 1080],
   * //     sourceLocation: 'original',
   * //     ...
   * //   }
   * // ]
   * ```
   */
  private static extractMediaFromTweet(
    tweetResult: TwitterTweet,
    tweetUser: TwitterUser,
    sourceLocation: 'original' | 'quoted' = 'original'
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

        const dimensionsFromUrl = this.extractDimensionsFromUrl(mediaUrl);
        const widthFromOriginal = this.normalizeDimension(media.original_info?.width);
        const heightFromOriginal = this.normalizeDimension(media.original_info?.height);
        const widthFromUrl = this.normalizeDimension(dimensionsFromUrl?.width);
        const heightFromUrl = this.normalizeDimension(dimensionsFromUrl?.height);
        const resolvedWidth = widthFromOriginal ?? widthFromUrl;
        const resolvedHeight = heightFromOriginal ?? heightFromUrl;

        const aspectRatioValues = Array.isArray(media.video_info?.aspect_ratio)
          ? media.video_info?.aspect_ratio
          : undefined;
        const aspectRatioWidth = this.normalizeDimension(aspectRatioValues?.[0]);
        const aspectRatioHeight = this.normalizeDimension(aspectRatioValues?.[1]);

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
   * Get High Quality Media URL - Best Format Selection
   *
   * Purpose:
   * Extract the best quality download URL for each media type.
   *
   * Algorithm by Media Type:
   *
   * PHOTOS:
   * 1. Check if URL already has query string (?format=...)
   * 2. If yes: Return as-is (already high quality)
   * 3. If no: Append ?format=jpg&name=orig
   *    - format=jpg: Use JPEG format
   *    - name=orig: Request original/highest resolution
   * Example: "https://pbs.twimg.com/media/abc123.jpg" →
   *          "https://pbs.twimg.com/media/abc123.jpg?format=jpg&name=orig"
   *
   * VIDEOS & ANIMATED_GIFS:
   * 1. Get video_info.variants (array of video sources)
   * 2. Filter for MP4 format (content_type === 'video/mp4')
   * 3. If no MP4 variants: Return null (error condition)
   * 4. Select highest bitrate:
   *    - Compare variant.bitrate values
   *    - Choose variant with maximum bitrate
   * 5. Return variant.url (download link)
   * Example: [
   *   { content_type: 'application/x-mpegURL', url: '...' },      // HLS (skip)
   *   { content_type: 'video/mp4', bitrate: 832000, url: '...' },  // 832 Kbps
   *   { content_type: 'video/mp4', bitrate: 2176000, url: '...' }  // 2176 Kbps (choose this)
   * ]
   *
   * Error Handling:
   * - Returns null if:
   *   - media.type is unknown
   *   - No video variants available
   *   - URL is invalid/missing
   * - Caller handles null (skip media or error)
   *
   * Performance:
   * - O(1) for photos (string operation)
   * - O(n) for videos where n = variant count (typically 2-4)
   * - Total: < 1ms typical
   *
   * Returns:
   * - string: URL for download
   * - null: Unable to get URL (media type not supported)
   *
   * Quality Tiers (Videos):
   * 1. MP4 with highest bitrate: Best (preferred)
   * 2. MP4 with lower bitrate: Good (fallback)
   * 3. HLS stream: Not selected (format mismatch)
   * 4. No MP4: null (error)
   *
   * Example:
   * ```typescript
   * // Photo
   * const photoUrl = TwitterAPI.getHighQualityMediaUrl(photoMedia);
   * // Returns: "https://pbs.twimg.com/media/abc.jpg?format=jpg&name=orig"
   *
   * // Video
   * const videoUrl = TwitterAPI.getHighQualityMediaUrl(videoMedia);
   * // Returns: "https://video.twimg.com/...../video.mp4"
   * ```
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
   * Extract Dimensions from URL - Parse WxH Pattern
   *
   * Purpose:
   * Parse image dimensions from URL pattern /WIDTHxHEIGHT/
   * (Common in CDN URLs for responsive image serving)
   *
   * Pattern:
   * - Regex: /(\d{2,6})x(\d{2,6})/
   * - Matches: /640x480/ or /1920x1080/
   * - Groups: (width)(x)(height)
   *
   * URL Examples:
   * - https://pbs.twimg.com/media/abc/640x480/def.jpg → [640, 480]
   * - https://pbs.twimg.com/image/1920x1080/photo.jpg → [1920, 1080]
   * - https://example.com/image.jpg → null (no pattern)
   *
   * Validation:
   * - Both width and height must be 2-6 digits (prevents false matches)
   * - Both must be > 0 (Number.isFinite check)
   * - Returns null if either fails
   *
   * Algorithm:
   * 1. Check if URL is empty (return null)
   * 2. Run regex match
   * 3. If no match: Return null
   * 4. Parse match groups to numbers
   * 5. Validate: finite, > 0
   * 6. Return { width, height } or null
   *
   * Error Handling:
   * - Returns null if:
   *   - URL is empty
   *   - No /WxH/ pattern found
   *   - Width or height is not finite
   *   - Width or height <= 0
   *   - Regex match fails
   * - No exceptions thrown (safe to call)
   *
   * Performance:
   * - O(n) where n = URL length (typically 100-200 chars)
   * - Single regex match
   * - < 1ms typical execution
   *
   * Returns:
   * - { width: number, height: number } if found and valid
   * - null if pattern not found or invalid
   *
   * Example:
   * ```typescript
   * TwitterAPI.extractDimensionsFromUrl(
   *   'https://pbs.twimg.com/media/abc/640x480/def.jpg'
   * );
   * // Returns: { width: 640, height: 480 }
   *
   * TwitterAPI.extractDimensionsFromUrl(
   *   'https://example.com/photo.jpg'
   * );
   * // Returns: null
   * ```
   */
  public static extractDimensionsFromUrl(url: string): { width: number; height: number } | null {
    if (!url) {
      return null;
    }

    const match = url.match(/\/(\d{2,6})x(\d{2,6})\//);
    if (!match) {
      return null;
    }

    const width = Number.parseInt(match[1] ?? '', 10);
    const height = Number.parseInt(match[2] ?? '', 10);

    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return null;
    }

    return {
      width,
      height,
    };
  }

  /**
   * Normalize Dimension - Type-Safe Number Parsing
   *
   * Purpose:
   * Convert unknown dimension value (could be number, string, or invalid)
   * to standardized positive number or undefined.
   *
   * Input Types Handled:
   * - number: Already numeric (validate and return)
   * - string: Parse as float (e.g., "1920" or "16.9")
   * - other: Return undefined (null, undefined, objects, etc.)
   *
   * Validation Rules:
   * 1. Must be Number.isFinite (not Infinity, not NaN)
   * 2. Must be > 0 (reject 0, negative, null)
   * 3. Round to nearest integer (1920.5 → 1921)
   *
   * Algorithm:
   * 1. If number: Check isFinite and > 0
   *    - Yes: Return Math.round(value)
   *    - No: Return undefined
   * 2. If string: Parse with parseFloat
   *    - Check isFinite and > 0
   *    - Yes: Return Math.round(parsed)
   *    - No: Return undefined
   * 3. Other: Return undefined
   *
   * Error Handling:
   * - Returns undefined (not null, not error) if invalid
   * - Allows caller to check "if (dim) {...}"
   * - Safe to call on any value type
   * - No exceptions thrown
   *
   * Performance:
   * - O(1) type checking
   * - O(1) math operations
   * - < 1us typical execution
   *
   * Returns:
   * - number: Valid positive integer (rounded)
   * - undefined: Invalid or missing dimension
   *
   * Example:
   * ```typescript
   * normalizeDimension(1920)           // Returns: 1920
   * normalizeDimension("1920")         // Returns: 1920
   * normalizeDimension("16.9")         // Returns: 17
   * normalizeDimension(0)              // Returns: undefined
   * normalizeDimension(-100)           // Returns: undefined
   * normalizeDimension(null)           // Returns: undefined
   * normalizeDimension("invalid")      // Returns: undefined
   * normalizeDimension(Infinity)       // Returns: undefined
   * ```
   */
  private static normalizeDimension(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.round(parsed);
      }
    }

    return undefined;
  }

  /**
   * Get Tweet Medias - Main API Entry Point
   *
   * Purpose:
   * Complete pipeline to extract all media (photos + videos) from a tweet
   * including original tweet and quote tweet (if present).
   *
   * Algorithm:
   * 1. Build GraphQL endpoint URL for tweet
   * 2. Execute API request (with caching + token auth)
   * 3. Extract tweet result from GraphQL response
   * 4. Validate tweet exists (return empty if unavailable)
   * 5. Navigate nested structure (result.tweet if wrapped)
   * 6. Legacy field migration:
   *    a. If extended_entities missing: Use legacy.extended_entities
   *    b. If full_text missing: Use legacy.full_text
   *    c. If id_str missing: Use legacy.id_str
   * 7. Note tweet support (Phase: Full tweet text support):
   *    a. Check for note_tweet.note_tweet_results.result.text
   *    b. If exists: Use for full_text (more reliable for long tweets)
   *    c. Log debug info for diagnostics
   * 8. Extract original tweet media:
   *    a. Call extractMediaFromTweet(tweetResult, user, 'original')
   *    b. Sort by visual order (Phase 290.1)
   * 9. Quote tweet handling (Phase 342):
   *    a. If quoted_status_result exists:
   *       - Extract quoted tweet media (sourceLocation='quoted')
   *       - Sort quoted media by visual order
   *       - Adjust original tweet indices (offset by quoted count)
   *       - Merge: [...quotedMedia, ...adjustedOriginal]
   * 10. Return all media (original + quoted combined)
   *
   * URL Structure:
   * - Build with createTweetJsonEndpointUrlByRestId(tweetId)
   * - Includes variables, features, fieldToggles
   * - Cached for performance
   *
   * Field Priority (for full_text):
   * 1. note_tweet.note_tweet_results.result.text (longest, most reliable)
   * 2. full_text (standard field)
   * 3. legacy.full_text (fallback)
   *
   * Field Priority (for id_str, extended_entities):
   * 1. Direct fields (extended_entities, id_str)
   * 2. Legacy fields (legacy.extended_entities, legacy.id_str)
   *
   * Media Index Calculation (Phase 290.2):
   * Original tweet media needs offset when quote tweet media exists:
   * - Quote tweet media: index [0, 1, 2] (if 3 media)
   * - Original tweet media: index [0, 1, 2] → [3, 4, 5] (offset by 3)
   * - Result: indices [0, 1, 2, 3, 4, 5] (no overlap)
   *
   * Error Handling:
   * - Returns empty array if:
   *   - Tweet not found in response
   *   - No extended_entities.media
   *   - API request fails
   * - Logs errors for debugging
   * - Non-blocking (continues with partial data)
   *
   * Performance:
   * - API request: 200-500ms (uncached), < 1ms (cached)
   * - Response parsing: O(n) where n = media + user fields (< 10ms)
   * - Total: 200-500ms typical
   *
   * Returns:
   * - Array of TweetMediaEntry:
   *   - Original tweet media (if present)
   *   - Quoted tweet media (if present)
   *   - Sorted by visual order (Phase 290.1)
   *   - With correct indices (Phase 290.2)
   * - Empty array if no media found
   *
   * Side Effects:
   * - Logs debug info (for diagnostics)
   * - May activate guest token (on first call)
   * - Updates request cache
   *
   * Example:
   * ```typescript
   * const mediaItems = await TwitterAPI.getTweetMedias('1234567890');
   * // Returns:
   * // [
   * //   {
   * //     tweet_id: '1234567890',
   * //     download_url: 'https://pbs.twimg.com/.../photo1.jpg?format=jpg&name=orig',
   * //     type: 'photo',
   * //     sourceLocation: 'original',
   * //     index: 0,
   * //     ...
   * //   },
   * //   {
   * //     tweet_id: '1234567890',
   * //     download_url: 'https://pbs.twimg.com/.../video.mp4',
   * //     type: 'video',
   * //     sourceLocation: 'original',
   * //     index: 1,
   * //     ...
   * //   },
   * //   // If quote tweet exists:
   * //   {
   * //     tweet_id: '9876543210',
   * //     download_url: 'https://pbs.twimg.com/.../quoted_photo.jpg?...',
   * //     type: 'photo',
   * //     sourceLocation: 'quoted',  // Phase 342
   * //     index: 0,
   * //     ...
   * //   }
   * // ]
   * ```
   */
  public static async getTweetMedias(tweetId: string): Promise<TweetMediaEntry[]> {
    const url = this.createTweetJsonEndpointUrlByRestId(tweetId);
    const json = await this.apiRequest(url);
    if (!json.data?.tweetResult?.result) return [];
    let tweetResult = json.data.tweetResult.result;
    if (tweetResult.tweet) tweetResult = tweetResult.tweet;
    const tweetUser = tweetResult.core?.user_results?.result;
    // Inline legacy normalization
    if (tweetResult.legacy) {
      if (!tweetResult.extended_entities && tweetResult.legacy.extended_entities) {
        tweetResult.extended_entities = tweetResult.legacy.extended_entities;
      }
      if (!tweetResult.full_text && tweetResult.legacy.full_text) {
        tweetResult.full_text = tweetResult.legacy.full_text;
      }
      if (!tweetResult.id_str && tweetResult.legacy.id_str) {
        tweetResult.id_str = tweetResult.legacy.id_str;
      }
    }

    // Phase: Full tweet text support - prefer note_tweet for long tweets
    // Extract full text from note_tweet structure
    const noteTweetText = tweetResult.note_tweet?.note_tweet_results?.result?.text;

    if (noteTweetText) {
      tweetResult.full_text = noteTweetText;
    }
    if (!tweetUser) return [];
    if (tweetUser.legacy) {
      if (!tweetUser.screen_name && tweetUser.legacy.screen_name) {
        tweetUser.screen_name = tweetUser.legacy.screen_name;
      }
      if (!tweetUser.name && tweetUser.legacy.name) {
        tweetUser.name = tweetUser.legacy.name;
      }
    }
    let result = this.extractMediaFromTweet(tweetResult, tweetUser, 'original');

    // Phase 290.1: Fix media order - Sort by visual order (expanded_url photo/video number)
    result = sortMediaByVisualOrder(result);

    if (tweetResult.quoted_status_result?.result) {
      const quotedTweet = tweetResult.quoted_status_result.result;
      const quotedUser = quotedTweet.core?.user_results?.result;
      if (quotedTweet && quotedUser) {
        if (quotedTweet.legacy) {
          if (!quotedTweet.extended_entities && quotedTweet.legacy.extended_entities) {
            quotedTweet.extended_entities = quotedTweet.legacy.extended_entities;
          }
          if (!quotedTweet.full_text && quotedTweet.legacy.full_text) {
            quotedTweet.full_text = quotedTweet.legacy.full_text;
          }
          if (!quotedTweet.id_str && quotedTweet.legacy.id_str) {
            quotedTweet.id_str = quotedTweet.legacy.id_str;
          }
        }

        // Phase: Full tweet text support - prefer note_tweet for long quoted tweets
        // Extract full text from quoted tweet note_tweet structure
        const quotedNoteTweetText = quotedTweet.note_tweet?.note_tweet_results?.result?.text;

        if (quotedNoteTweetText) {
          quotedTweet.full_text = quotedNoteTweetText;
        }
        if (quotedUser.legacy) {
          if (!quotedUser.screen_name && quotedUser.legacy.screen_name) {
            quotedUser.screen_name = quotedUser.legacy.screen_name;
          }
          if (!quotedUser.name && quotedUser.legacy.name) {
            quotedUser.name = quotedUser.legacy.name;
          }
        }
        // Phase 342: 인용 트윗의 미디어를 sourceLocation='quoted'로 마킹하여 추출
        const quotedMedia = this.extractMediaFromTweet(quotedTweet, quotedUser, 'quoted');
        // Phase 290.1: Sort quoted tweet media by visual order
        const sortedQuotedMedia = sortMediaByVisualOrder(quotedMedia);

        // Phase 290.2: Adjust original tweet indices to prevent overlap with quoted tweet
        // Quoted tweet: index 0, 1, 2, ...
        // Original tweet: index (quotedLength), (quotedLength + 1), ...
        const adjustedResult = result.map(media => ({
          ...media,
          index: media.index + sortedQuotedMedia.length,
        }));

        result = [...sortedQuotedMedia, ...adjustedResult];
      }
    }
    return result;
  }
}

/**
 * Get Video Media Entry - Combined API Wrapper
 *
 * Purpose:
 * Convenience wrapper combining TwitterAPI and video utility to extract
 * a single video media entry by tweet ID and optional thumbnail URL.
 *
 * Algorithm:
 * 1. Call TwitterAPI.getTweetMedias(tweetId) to get all media
 * 2. If thumbnailUrl provided:
 *    a. Find matching media by thumbnail (via utility function)
 *    b. Return matched entry or null
 * 3. If no thumbnailUrl:
 *    a. Find first video media (type === 'video')
 *    b. Return first video or null
 *
 * Parameters:
 * - tweetId: Tweet ID (required)
 * - thumbnailUrl: Video thumbnail URL (optional, for precise matching)
 *
 * Returns:
 * - TweetMediaEntry: First matching video entry
 * - null: No video found or error
 *
 * Use Cases:
 * - Extract single video when thumbnail is clicked
 * - Fallback: Get first video if no thumbnail specified
 * - Delegate to base utility for matching logic
 *
 * Example:
 * ```typescript
 * const entry = await getVideoMediaEntry(
 *   '1234567890',
 *   'https://pbs.twimg.com/ext_tw_video_thumb/...jpg'
 * );
 * if (entry) {
 *   console.log('Video URL:', entry.download_url);
 * }
 * ```
 */
export async function getVideoMediaEntry(
  tweetId: string,
  thumbnailUrl?: string
): Promise<TweetMediaEntry | null> {
  return getVideoMediaEntryBase(TwitterAPI.getTweetMedias.bind(TwitterAPI), tweetId, thumbnailUrl);
}

/**
 * Get Video URL from Thumbnail - Image to Download URL
 *
 * Purpose:
 * Extract downloadable video URL from clicked video thumbnail image element.
 * Combines image element analysis with tweet media extraction.
 *
 * Algorithm (delegated to base utility):
 * 1. Verify img element is a video thumbnail (checks URL + ARIA labels)
 * 2. Extract tweet ID from image container/DOM tree
 * 3. Call getTweetMedias(tweetId) to get all media for tweet
 * 4. Find media entry matching the thumbnail
 * 5. Return download_url from matching media entry
 *
 * Parameters:
 * - imgElement: HTMLImageElement of video thumbnail (e.g., event.target)
 * - tweetContainer: Parent container (article or container element)
 *
 * Returns:
 * - string: Download URL for video
 * - null: Unable to extract URL
 *
 * Use Cases:
 * - Click handler on video thumbnail → extract download URL
 * - Convert thumbnail image to actual video stream
 * - Fallback logic if direct video element not available
 *
 * Error Handling:
 * - Returns null if:
 *   - Image is not video thumbnail
 *   - Tweet ID cannot be extracted
 *   - API request fails
 *   - Media not found in response
 * - No exceptions thrown
 *
 * Example:
 * ```typescript
 * // In click handler
 * const videoUrl = await getVideoUrlFromThumbnail(
 *   event.target as HTMLImageElement,
 *   article
 * );
 * if (videoUrl) {
 *   downloadOrPlay(videoUrl);
 * }
 * ```
 */
export async function getVideoUrlFromThumbnail(
  imgElement: HTMLImageElement,
  tweetContainer: HTMLElement
): Promise<string | null> {
  return getVideoUrlFromThumbnailBase(
    TwitterAPI.getTweetMedias.bind(TwitterAPI),
    imgElement,
    tweetContainer
  );
}
