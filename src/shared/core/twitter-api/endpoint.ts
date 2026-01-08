/**
 * @fileoverview Pure Twitter API endpoint builders (GraphQL)
 * @description Side-effect free utilities for constructing Twitter GraphQL API URLs.
 */

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
