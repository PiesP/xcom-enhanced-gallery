/** @fileoverview X.com API configuration for GraphQL queries and authentication. */

export const TWITTER_API_CONFIG = {
  GUEST_AUTHORIZATION:
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',

  TWEET_RESULT_BY_REST_ID_QUERY_ID: 'zAz9764BcLZOJ0JU2wrd1A',
  USER_BY_SCREEN_NAME_QUERY_ID: '1VOOyvKkiI3FMmkeDNxM9A',

  SUPPORTED_HOSTS: ['x.com', 'twitter.com'] as const,
  DEFAULT_HOST: 'x.com',
} as const;

export type TwitterHost = (typeof TWITTER_API_CONFIG.SUPPORTED_HOSTS)[number];
export type TwitterAPIConfigKey = keyof typeof TWITTER_API_CONFIG;
