/**
 * @fileoverview Pure Twitter API endpoint builders.
 *
 * This module is intentionally side-effect free.
 */

export interface BuildTweetResultByRestIdUrlArgs {
  host: string;
  queryId: string;
  tweetId: string;
  variables: Record<string, unknown>;
  features: Record<string, unknown>;
  fieldToggles: Record<string, unknown>;
}

export function buildTweetResultByRestIdUrl(args: BuildTweetResultByRestIdUrlArgs): string {
  const { host, queryId, variables, features, fieldToggles } = args;

  const urlObj = new URL(`https://${host}/i/api/graphql/${queryId}/TweetResultByRestId`);

  urlObj.searchParams.set('variables', JSON.stringify(variables));
  urlObj.searchParams.set('features', JSON.stringify(features));
  urlObj.searchParams.set('fieldToggles', JSON.stringify(fieldToggles));

  return urlObj.toString();
}
