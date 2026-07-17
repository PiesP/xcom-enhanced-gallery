// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { buildTweetResultByRestIdUrl } from '@shared/core/twitter-api/endpoint';
import type { BuildTweetResultByRestIdUrlArgs } from '@shared/core/twitter-api/endpoint';

const BASE_ARGS: BuildTweetResultByRestIdUrlArgs = {
  host: 'x.com',
  queryId: 'zAz9764BcLZOJ0JU2wrd1A',
  variables: { tweetId: '1234567890', withCommunity: false, includePromotedContent: false, withVoice: false },
  features: {
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
  },
  fieldToggles: {
    withArticleRichContentState: true,
    withArticlePlainText: false,
  },
};

describe('twitter-api-client (URL building — pure functions)', () => {
  describe('buildTweetResultByRestIdUrl', () => {
    it('should build a URL with the correct host and path', () => {
      const url = buildTweetResultByRestIdUrl(BASE_ARGS);
      expect(url).toContain('https://x.com/i/api/graphql/zAz9764BcLZOJ0JU2wrd1A/TweetResultByRestId');
    });

    it('should serialize variables as JSON in the variables param', () => {
      const url = buildTweetResultByRestIdUrl(BASE_ARGS);
      const parsed = new URL(url);
      const variablesParam = parsed.searchParams.get('variables');
      expect(variablesParam).toBeTruthy();
      const variables = JSON.parse(variablesParam!);
      expect(variables.tweetId).toBe('1234567890');
      expect(variables.withCommunity).toBe(false);
    });

    it('should serialize features as JSON in the features param', () => {
      const url = buildTweetResultByRestIdUrl(BASE_ARGS);
      const parsed = new URL(url);
      const featuresParam = parsed.searchParams.get('features');
      expect(featuresParam).toBeTruthy();
      const features = JSON.parse(featuresParam!);
      expect(features.creator_subscriptions_tweet_preview_api_enabled).toBe(true);
    });

    it('should serialize fieldToggles as JSON in the fieldToggles param', () => {
      const url = buildTweetResultByRestIdUrl(BASE_ARGS);
      const parsed = new URL(url);
      const fieldTogglesParam = parsed.searchParams.get('fieldToggles');
      expect(fieldTogglesParam).toBeTruthy();
      const fieldToggles = JSON.parse(fieldTogglesParam!);
      expect(fieldToggles.withArticleRichContentState).toBe(true);
      expect(fieldToggles.withArticlePlainText).toBe(false);
    });

    it('should work with a different host (twitter.com)', () => {
      const args: BuildTweetResultByRestIdUrlArgs = {
        ...BASE_ARGS,
        host: 'twitter.com',
      };
      const url = buildTweetResultByRestIdUrl(args);
      expect(url).toContain('https://twitter.com/i/api/graphql/');
    });

    it('should work with string variables', () => {
      const args: BuildTweetResultByRestIdUrlArgs = {
        ...BASE_ARGS,
        variables: '{"tweetId":"abc123"}',
      };
      const url = buildTweetResultByRestIdUrl(args);
      const parsed = new URL(url);
      expect(parsed.searchParams.get('variables')).toBe('{"tweetId":"abc123"}');
    });

    it('should URL-encode the serialized params', () => {
      const url = buildTweetResultByRestIdUrl(BASE_ARGS);
      // The URL should have properly encoded query parameters
      expect(url).not.toContain(' '); // No spaces
      expect(url).toContain('variables=');
      expect(url).toContain('features=');
      expect(url).toContain('fieldToggles=');
      // Verify it's a valid URL
      expect(() => new URL(url)).not.toThrow();
    });

    it('should include all three required query parameters', () => {
      const url = buildTweetResultByRestIdUrl(BASE_ARGS);
      const parsed = new URL(url);
      expect(parsed.searchParams.has('variables')).toBe(true);
      expect(parsed.searchParams.has('features')).toBe(true);
      expect(parsed.searchParams.has('fieldToggles')).toBe(true);
    });
  });
});
