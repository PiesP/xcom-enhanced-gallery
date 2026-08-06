// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTweetResultByRestIdUrl } from '@shared/core/twitter-api/endpoint';
import type { BuildTweetResultByRestIdUrlArgs } from '@shared/core/twitter-api/endpoint';

const { getCsrfTokenAsync, httpGet, resolveBearerToken } = vi.hoisted(() => ({
  getCsrfTokenAsync: vi.fn(async (): Promise<string | undefined> => 'csrf-token'),
  httpGet: vi.fn(),
  resolveBearerToken: vi.fn(() => 'Bearer test-token'),
}));

vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));

vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({
  getCsrfTokenAsync,
  resolveBearerToken,
}));

import { getTweetMedias } from '@shared/services/media/twitter-api-client';

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

describe('twitter-api-client request boundary', () => {
  beforeEach(() => {
    httpGet.mockReset();
    httpGet.mockResolvedValue({ ok: true, status: 200, data: {} });
    getCsrfTokenAsync.mockReset();
    getCsrfTokenAsync.mockResolvedValue('csrf-token');
    resolveBearerToken.mockReset();
    resolveBearerToken.mockReturnValue('Bearer test-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['x.com', 'x.com'],
    ['mobile.x.com', 'x.com'],
    ['TWITTER.COM', 'twitter.com'],
    ['mobile.twitter.com', 'twitter.com'],
  ])('uses the supported API host for %s', async (hostname, expectedHost) => {
    await getTweetMedias('123', { hostname, href: undefined, origin: undefined });

    expect(new URL(httpGet.mock.calls[0]?.[0] as string).hostname).toBe(expectedHost);
  });

  it.each([
    'x.com.attacker.example',
    'twitter.com.attacker.example',
    'attacker-x.com',
    'x.com@attacker.example',
    '',
  ])('falls back to x.com for an untrusted hostname: %s', async (hostname) => {
    await getTweetMedias('123', { hostname, href: undefined, origin: undefined });

    expect(new URL(httpGet.mock.calls[0]?.[0] as string).hostname).toBe('x.com');
  });

  it('forwards authenticated browser context and cancellation explicitly', async () => {
    const controller = new AbortController();

    await getTweetMedias(
      '123',
      {
        hostname: 'x.com',
        href: 'https://x.com/example/status/123',
        origin: 'https://x.com',
      },
      controller.signal
    );

    expect(httpGet).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/x\.com\/i\/api\/graphql\//),
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
          origin: 'https://x.com',
          referer: 'https://x.com/example/status/123',
          'x-csrf-token': 'csrf-token',
        }),
        responseType: 'json',
        signal: controller.signal,
      })
    );
    const requestedUrl = new URL(httpGet.mock.calls[0]?.[0] as string);
    expect(JSON.parse(requestedUrl.searchParams.get('variables') ?? '{}')).toMatchObject({
      tweetId: '123',
      withCommunity: false,
      includePromotedContent: false,
      withVoice: false,
    });
  });

  it('uses the current browser location when no location override is provided', async () => {
    vi.stubGlobal('location', {
      hostname: 'mobile.twitter.com',
      href: 'https://mobile.twitter.com/example/status/123',
      origin: 'https://mobile.twitter.com',
    });

    await getTweetMedias('123');

    expect(new URL(httpGet.mock.calls[0]?.[0] as string).hostname).toBe('twitter.com');
    expect(httpGet.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          origin: 'https://mobile.twitter.com',
          referer: 'https://mobile.twitter.com/example/status/123',
        }),
      })
    );
  });

  it('uses an empty CSRF header without inventing browser origin headers', async () => {
    getCsrfTokenAsync.mockResolvedValue(undefined);

    await getTweetMedias('123', {
      hostname: undefined,
      href: undefined,
      origin: undefined,
    });

    expect(httpGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-csrf-token': '' }),
        responseType: 'json',
      })
    );
    const options = httpGet.mock.calls[0]?.[1] as {
      headers: Record<string, string>;
      signal?: AbortSignal;
    };
    expect(options.headers).not.toHaveProperty('origin');
    expect(options.headers).not.toHaveProperty('referer');
    expect(options).not.toHaveProperty('signal');
  });

  it('rejects non-success API responses without exposing response contents', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 403, data: { secret: 'not-for-logs' } });

    await expect(
      getTweetMedias('123', { hostname: 'x.com', href: undefined, origin: undefined })
    ).rejects.toThrow('TW:403');
  });
});
