/**
 * @fileoverview Twitter/X.com API configuration for GraphQL queries and authentication.
 *
 * Provides authentication tokens, query IDs, and host configuration.
 * Query IDs may change on Twitter API updates; monitor for 400/404 errors.
 *
 * @module constants/twitter-api
 */

/**
 * Twitter/X.com API configuration object
 *
 * @remarks
 * All properties are readonly at runtime (enforced by `as const` assertion).
 * Query IDs and authorization tokens are subject to change by Twitter/X.com
 * and may require periodic updates to maintain functionality.
 *
 * **Bearer Token Format**:
 * The GUEST_AUTHORIZATION follows OAuth 2.0 Bearer token format:
 * `Bearer <base64-encoded-credentials>`
 *
 * **Query ID Format**:
 * Query IDs are alphanumeric strings (typically 22 characters) that identify
 * specific GraphQL operations in Twitter's API.
 */
export const TWITTER_API_CONFIG = {
  /**
   * Guest/suspended account Bearer token for unauthenticated API access
   *
   * @remarks
   * This token enables API requests without user authentication, providing
   * read-only access to public tweet and user data. Rate limits apply.
   *
   * **Usage Context**:
   * - Public tweet fetching
   * - User profile information retrieval
   * - Media metadata extraction
   *
   * **Rate Limiting**:
   * Twitter applies per-IP rate limits to guest token requests. Consider
   * implementing exponential backoff for 429 (Too Many Requests) responses.
   *
   * @example
   * ```typescript
   * fetch(apiUrl, {
   *   headers: {
   *     'Authorization': TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
   *     'Content-Type': 'application/json',
   *   },
   * });
   * ```
   */
  GUEST_AUTHORIZATION:
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',

  /**
   * GraphQL query ID for fetching tweet data by REST ID
   *
   * @remarks
   * Used with the `TweetResultByRestId` GraphQL operation to retrieve
   * complete tweet information including media, author, and engagement data.
   *
   * **API Endpoint Pattern**:
   * `https://x.com/i/api/graphql/{queryId}/TweetResultByRestId?variables={...}`
   *
   * **Required Variables**:
   * - `tweetId` (string): Numeric tweet ID (e.g., "1234567890123456789")
   * - `withCommunity` (boolean): Include community context
   * - `includePromotedContent` (boolean): Include promoted tweets
   * - `withVoice` (boolean): Include voice note data
   *
   * @example
   * ```typescript
   * const queryUrl = `https://x.com/i/api/graphql/${TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID}/TweetResultByRestId`;
   * const params = new URLSearchParams({
   *   variables: JSON.stringify({ tweetId: '1234567890123456789' }),
   * });
   * ```
   */
  TWEET_RESULT_BY_REST_ID_QUERY_ID: 'zAz9764BcLZOJ0JU2wrd1A',

  /**
   * GraphQL query ID for fetching user information by screen name
   *
   * @remarks
   * Used with the `UserByScreenName` GraphQL operation to retrieve
   * user profile data including avatar, banner, bio, and verification status.
   *
   * **API Endpoint Pattern**:
   * `https://x.com/i/api/graphql/{queryId}/UserByScreenName?variables={...}`
   *
   * **Required Variables**:
   * - `screen_name` (string): User handle without '\@' prefix (e.g., "username")
   * - `withSafetyModeUserFields` (boolean): Include safety/moderation fields
   *
   * @example
   * ```typescript
   * const queryUrl = `https://x.com/i/api/graphql/${TWITTER_API_CONFIG.USER_BY_SCREEN_NAME_QUERY_ID}/UserByScreenName`;
   * const params = new URLSearchParams({
   *   variables: JSON.stringify({ screen_name: 'username' }),
   * });
   * ```
   */
  USER_BY_SCREEN_NAME_QUERY_ID: '1VOOyvKkiI3FMmkeDNxM9A',

  /**
   * Supported host domains for Twitter/X.com API requests
   *
   * @remarks
   * Array of valid hostnames that the userscript recognizes for API operations.
   * Both legacy (twitter.com) and current (x.com) domains are supported for
   * backward compatibility and transition period handling.
   *
   * **Domain Validation**:
   * Use this array to validate user-facing URLs and API request targets.
   * Reject requests to unsupported domains to prevent security issues.
   *
   * @example
   * ```typescript
   * function isValidTwitterHost(url: string): boolean {
   *   const hostname = new URL(url).hostname;
   *   return TWITTER_API_CONFIG.SUPPORTED_HOSTS.includes(
   *     hostname as TwitterHost
   *   );
   * }
   * ```
   */
  SUPPORTED_HOSTS: ['x.com', 'twitter.com'] as const,

  /**
   * Default host domain for API requests
   *
   * @remarks
   * Primary hostname used when constructing API URLs. Falls back to this
   * value when host detection fails or when creating new API request URLs.
   *
   * **Current Default**: `x.com` (Twitter's rebranded domain as of 2023)
   *
   * **Fallback Strategy**:
   * If API requests to x.com fail, consider implementing automatic fallback
   * to twitter.com for backward compatibility during transition periods.
   *
   * @example
   * ```typescript
   * const apiBaseUrl = `https://${TWITTER_API_CONFIG.DEFAULT_HOST}/i/api/graphql`;
   * ```
   */
  DEFAULT_HOST: 'x.com',
} as const;

/**
 * Type helper: Extract supported Twitter host domain type
 *
 * @remarks
 * Provides type-safe access to valid Twitter/X.com hostnames.
 * Use this type for URL validation and host checking logic.
 *
 * @example
 * ```typescript
 * function validateHost(host: string): host is TwitterHost {
 *   return TWITTER_API_CONFIG.SUPPORTED_HOSTS.includes(host as TwitterHost);
 * }
 * ```
 */
export type TwitterHost = (typeof TWITTER_API_CONFIG.SUPPORTED_HOSTS)[number];

/**
 * Type helper: Twitter API configuration keys
 *
 * @remarks
 * Union type of all configuration property names.
 * Useful for programmatic access and type-safe configuration mapping.
 *
 * @example
 * ```typescript
 * function getConfigValue(key: TwitterAPIConfigKey): unknown {
 *   return TWITTER_API_CONFIG[key];
 * }
 * ```
 */
export type TwitterAPIConfigKey = keyof typeof TWITTER_API_CONFIG;
