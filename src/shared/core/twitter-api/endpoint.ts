/**
 * @fileoverview Pure Twitter API endpoint builders.
 *
 * This module is intentionally side-effect free and provides utilities for
 * constructing Twitter GraphQL API endpoint URLs with proper query parameter
 * serialization.
 *
 * @module twitter-api/endpoint
 */

/**
 * Type alias for GraphQL query parameters.
 * Accepts either a pre-serialized JSON string or a record object.
 */
type GraphqlQueryParams = Record<string, unknown> | string;

/**
 * Arguments for building TweetResultByRestId endpoint URL.
 *
 * @property host - Twitter API host domain (e.g., 'x.com', 'twitter.com')
 * @property queryId - GraphQL query identifier for TweetResultByRestId
 * @property variables - Query variables (tweet ID, feature flags, etc.)
 * @property features - Feature flags for response data structure
 * @property fieldToggles - Field visibility toggles for response filtering
 */
export interface BuildTweetResultByRestIdUrlArgs {
  readonly host: string;
  readonly queryId: string;
  readonly variables: GraphqlQueryParams;
  readonly features: GraphqlQueryParams;
  readonly fieldToggles: GraphqlQueryParams;
}

/**
 * Serializes query parameters to JSON string.
 *
 * If the value is already a string, returns it as-is.
 * Otherwise, converts the object to JSON string.
 *
 * @param value - Query parameters to serialize
 * @returns JSON string representation
 * @pure No side effects, deterministic output
 */
function serializeQueryParams(value: GraphqlQueryParams): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Builds complete URL for Twitter GraphQL TweetResultByRestId endpoint.
 *
 * Constructs URL with base path and serializes all query parameters
 * (variables, features, fieldToggles) as JSON strings in search params.
 *
 * @param args - Configuration object for URL construction
 * @returns Fully qualified URL string with encoded query parameters
 * @pure No side effects, deterministic output for given inputs
 *
 * @example
 * ```typescript
 * const url = buildTweetResultByRestIdUrl({
 *   host: 'x.com',
 *   queryId: 'abc123',
 *   variables: { tweetId: '1234567890' },
 *   features: { creator_subscriptions_tweet_preview_api_enabled: true },
 *   fieldToggles: { withArticleRichContentState: false }
 * });
 * // Returns: "https://x.com/i/api/graphql/abc123/TweetResultByRestId?variables=...&features=...&fieldToggles=..."
 * ```
 */
export function buildTweetResultByRestIdUrl(args: BuildTweetResultByRestIdUrlArgs): string {
  const { host, queryId, variables, features, fieldToggles } = args;

  const urlObj = new URL(`https://${host}/i/api/graphql/${queryId}/TweetResultByRestId`);

  urlObj.searchParams.set('variables', serializeQueryParams(variables));
  urlObj.searchParams.set('features', serializeQueryParams(features));
  urlObj.searchParams.set('fieldToggles', serializeQueryParams(fieldToggles));

  return urlObj.toString();
}
