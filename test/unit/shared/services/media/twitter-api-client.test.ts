// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTweetResultByRestIdUrl } from '@shared/core/twitter-api/endpoint';
import type { BuildTweetResultByRestIdUrlArgs } from '@shared/core/twitter-api/endpoint';

function createQuotedVideoTweetResponse() {
  const user = (screenName: string) => ({ user_results: { result: {
    legacy: { screen_name: screenName },
  } } });
  return { data: { tweetResult: { result: {
    rest_id: '222', core: user('outer'),
    legacy: { full_text: 'Outer text', extended_entities: { media: [{
      type: 'video', id_str: 'outer-video',
      media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/222/outer.jpg',
      video_info: { variants: [{ content_type: 'video/mp4', bitrate: 512000,
        url: 'https://video.twimg.com/ext_tw_video/222/outer.mp4' }] },
    }] } },
    quoted_status_result: { result: {
      rest_id: '111', core: user('quote'),
      legacy: { full_text: 'Quote text', extended_entities: { media: [{
        type: 'photo', id_str: 'quote-photo',
        media_url_https: 'https://pbs.twimg.com/media/quote-photo.jpg',
      }] } },
      quoted_status_result: { result: {
        rest_id: '333', core: user('nested'),
        legacy: { extended_entities: { media: [{ type: 'photo', id_str: 'nested-photo',
          media_url_https: 'https://pbs.twimg.com/media/nested-photo.jpg' }] } },
      } },
    } },
  } } } };
}

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

import { getTweetMedias, TwitterAPIRequestError } from '@shared/services/media/twitter-api-client';

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

  it('classifies transport failure as an outage but preserves cancellation', async () => {
    const networkError = new Error('network unavailable');
    httpGet.mockRejectedValueOnce(networkError);
    await expect(getTweetMedias('123')).rejects.toMatchObject({
      name: 'TwitterAPIRequestError',
      cause: networkError,
    });

    const controller = new AbortController();
    const cancellation = new DOMException('cancelled', 'AbortError');
    httpGet.mockRejectedValueOnce(cancellation);
    await expect(getTweetMedias('123', undefined, controller.signal)).rejects.toBe(cancellation);

    controller.abort();
    const abortRace = new Error('request stopped after abort');
    httpGet.mockRejectedValueOnce(abortRace);
    await expect(getTweetMedias('123', undefined, controller.signal)).rejects.toBe(abortRace);
  });

  it('treats a provider error without a tweet as an outage but accepts usable media', async () => {
    const providerErrors = [{ code: 88, message: 'Rate limit' }];
    httpGet.mockResolvedValueOnce({ ok: true, status: 200, data: { errors: providerErrors } });
    await expect(getTweetMedias('123')).rejects.toBeInstanceOf(TwitterAPIRequestError);

    httpGet.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    await expect(getTweetMedias('123')).resolves.toEqual([]);

    const usableResponse = createQuotedVideoTweetResponse();
    httpGet.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { ...usableResponse, errors: providerErrors },
    });
    await expect(getTweetMedias('222')).resolves.toMatchObject([
      { tweet_id: '111', type: 'photo', sourceLocation: 'quoted',
        quoteParentTweetId: '222', quotedTweetId: '111' },
      { tweet_id: '222', type: 'video', sourceLocation: 'original' },
    ]);
  });

  it('rejects a mismatched numeric root before using its direct quote', async () => {
    httpGet.mockResolvedValueOnce({ ok: true, status: 200,
      data: createQuotedVideoTweetResponse() });

    await expect(getTweetMedias('999')).rejects.toThrow('unexpected tweet owner');
  });

  it('normalizes wrapped A and B, returns direct B before A, and excludes C', async () => {
    const response = createQuotedVideoTweetResponse();
    const root = response.data.tweetResult.result;
    httpGet.mockResolvedValueOnce({ ok: true, status: 200,
      data: { data: { tweetResult: { result: { tweet: {
        ...root, quoted_status_result: { result: { tweet: root.quoted_status_result.result } },
      } } } } } });

    const entries = await getTweetMedias('222');
    expect(entries).toHaveLength(2);
    expect(entries.map(({ tweet_id }) => tweet_id)).toEqual(['111', '222']);
    expect(entries[0]).toMatchObject({ sourceLocation: 'quoted',
      quoteParentTweetId: '222', quotedTweetId: '111',
      screen_name: 'quote', tweet_text: 'Quote text' });
    expect(entries[1]).toMatchObject({ sourceLocation: 'original',
      screen_name: 'outer', tweet_text: 'Outer text',
      videoVariantUrls: ['https://video.twimg.com/ext_tw_video/222/outer.mp4'] });
    expect(entries.some(({ tweet_id }) => tweet_id === '333')).toBe(false);
  });
});
