// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Pure Twitter API endpoint builders (GraphQL) and configuration
 * @description Side-effect free utilities for constructing Twitter GraphQL API URLs and API config.
 */

export const TWITTER_API_CONFIG = {
  /** @deprecated Use resolveBearerToken() from twitter-auth instead. Kept for fallback only. */
  GUEST_AUTHORIZATION:
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',

  TWEET_RESULT_BY_REST_ID_QUERY_ID: 'zAz9764BcLZOJ0JU2wrd1A',
  USER_BY_SCREEN_NAME_QUERY_ID: '1VOOyvKkiI3FMmkeDNxM9A',

  SUPPORTED_HOSTS: ['x.com', 'twitter.com'] as const,
  DEFAULT_HOST: 'x.com',
} as const;

type GraphqlQueryParams = Record<string, unknown> | string;

export interface BuildTweetResultByRestIdUrlArgs {
  readonly host: string;
  readonly queryId: string;
  readonly variables: GraphqlQueryParams;
  readonly features: GraphqlQueryParams;
  readonly fieldToggles: GraphqlQueryParams;
}

/**
 * Serialize query parameters to JSON string.
 * Returns string as-is, or converts object to JSON.
 * @param value - Query parameters to serialize
 * @returns JSON string representation
 */
function serializeQueryParams(value: GraphqlQueryParams): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Build complete URL for Twitter GraphQL TweetResultByRestId endpoint.
 * Serializes all query parameters (variables, features, fieldToggles) as JSON.
 * @param args - Configuration object for URL construction
 * @returns Fully qualified URL string with encoded query parameters
 */
export function buildTweetResultByRestIdUrl(args: BuildTweetResultByRestIdUrlArgs): string {
  const { host, queryId, variables, features, fieldToggles } = args;
  const urlObj = new URL(`https://${host}/i/api/graphql/${queryId}/TweetResultByRestId`);
  urlObj.searchParams.set('variables', serializeQueryParams(variables));
  urlObj.searchParams.set('features', serializeQueryParams(features));
  urlObj.searchParams.set('fieldToggles', serializeQueryParams(fieldToggles));
  return urlObj.toString();
}
