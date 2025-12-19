/**
 * @fileoverview Pure Twitter API endpoint builders.
 *
 * This module is intentionally side-effect free.
 */

type GraphqlQueryParams = Record<string, unknown> | string;

export interface BuildTweetResultByRestIdUrlArgs {
  host: string;
  queryId: string;
  tweetId: string;
  variables: GraphqlQueryParams;
  features: GraphqlQueryParams;
  fieldToggles: GraphqlQueryParams;
}

function serializeQueryParams(value: GraphqlQueryParams): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function buildTweetResultByRestIdUrl(args: BuildTweetResultByRestIdUrlArgs): string {
  const { host, queryId, variables, features, fieldToggles } = args;

  const urlObj = new URL(`https://${host}/i/api/graphql/${queryId}/TweetResultByRestId`);

  urlObj.searchParams.set('variables', serializeQueryParams(variables));
  urlObj.searchParams.set('features', serializeQueryParams(features));
  urlObj.searchParams.set('fieldToggles', serializeQueryParams(fieldToggles));

  return urlObj.toString();
}
