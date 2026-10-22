// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { BuildTweetResultByRestIdUrlArgs } from '@shared/core/twitter-api/endpoint';
import { buildTweetResultByRestIdUrl } from '@shared/core/twitter-api/endpoint';
import type { TwitterTweet } from '@shared/services/media/types';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import { captureClickedMediaEvidence } from '@shared/services/media-extraction/determine-clicked-index';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

function createQuotedVideoTweetResponse() {
  const user = (screenName: string) => ({
    user_results: {
      result: {
        legacy: { screen_name: screenName },
      },
    },
  });
  return {
    data: {
      tweetResult: {
        result: {
          rest_id: '222',
          core: user('outer'),
          legacy: {
            full_text: 'Outer text',
            extended_entities: {
              media: [
                {
                  type: 'video',
                  id_str: 'outer-video',
                  media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/222/outer.jpg',
                  video_info: {
                    variants: [
                      {
                        content_type: 'video/mp4',
                        bitrate: 512000,
                        url: 'https://video.twimg.com/ext_tw_video/222/outer.mp4',
                      },
                    ],
                  },
                },
              ],
            },
          },
          quoted_status_result: {
            result: {
              rest_id: '111',
              core: user('quote'),
              legacy: {
                full_text: 'Quote text',
                extended_entities: {
                  media: [
                    {
                      type: 'photo',
                      id_str: 'quote-photo',
                      media_url_https: 'https://pbs.twimg.com/media/quote-photo.jpg',
                    },
                  ],
                },
              },
              quoted_status_result: {
                result: {
                  rest_id: '333',
                  core: user('nested'),
                  legacy: {
                    extended_entities: {
                      media: [
                        {
                          type: 'photo',
                          id_str: 'nested-photo',
                          media_url_https: 'https://pbs.twimg.com/media/nested-photo.jpg',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

function createPhotoTweetResponse(tweetId = '222', count = 1, text = 'Cache fixture') {
  return {
    data: {
      tweetResult: {
        result: {
          rest_id: tweetId,
          core: { user_results: { result: { legacy: { screen_name: 'cache_author' } } } },
          legacy: {
            id_str: tweetId,
            full_text: text,
            extended_entities: {
              media: Array.from({ length: count }, (_, index) => ({
                type: 'photo',
                id_str: String(8000 + index),
                media_url_https: `https://pbs.twimg.com/media/cache-${index}.jpg`,
              })),
            },
          },
        },
      },
    },
  };
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

import {
  getTweetMedias,
  TweetMetadataReuse,
  TwitterAPIRequestError,
} from '@shared/services/media/twitter-api-client';

const BASE_ARGS: BuildTweetResultByRestIdUrlArgs = {
  host: 'x.com',
  queryId: 'zAz9764BcLZOJ0JU2wrd1A',
  variables: {
    tweetId: '1234567890',
    withCommunity: false,
    includePromotedContent: false,
    withVoice: false,
  },
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
      expect(url).toContain(
        'https://x.com/i/api/graphql/zAz9764BcLZOJ0JU2wrd1A/TweetResultByRestId'
      );
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

describe('TweetMetadataReuse', () => {
  beforeEach(() => {
    httpGet.mockReset();
    httpGet.mockResolvedValue({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    getCsrfTokenAsync.mockResolvedValue('csrf-token');
    resolveBearerToken.mockReturnValue('Bearer test-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reuses only normalized successful media and gives each caller a private copy', async () => {
    const reuse = new TweetMetadataReuse();
    const first = await reuse.get('222');
    expect(first.entries.map((entry) => entry.tweet_id)).toEqual(['111', '222']);
    Object.assign(first.entries[0]!, { screen_name: 'changed-by-caller' });

    const second = await reuse.get('222');
    expect(second.entries[0]?.screen_name).toBe('quote');
    expect(second.physicalRequestToken).toBeUndefined();
    expect(httpGet).toHaveBeenCalledTimes(1);
    reuse.dispose();
  });

  it('recomputes direct and quoted selection for each click on reused metadata', async () => {
    const extractor = new TwitterAPIExtractor();
    const info = {
      tweetId: '222',
      username: 'quote_author',
      tweetUrl: 'https://x.com/quote_author/status/222',
      extractionMethod: 'test',
      confidence: 1,
    };
    document.body.innerHTML = '<img id="quote" src="https://pbs.twimg.com/media/quote-photo.jpg">';
    const clickedQuote = document.querySelector<HTMLElement>('#quote')!;
    const quote = await extractor.extract(
      info,
      clickedQuote,
      {
        clickedMediaEvidence: {
          ...captureClickedMediaEvidence(clickedQuote),
          ownership: { requestTweetId: '222', ownerTweetId: null, scope: 'quoted' },
        },
      },
      'quote'
    );
    document.body.innerHTML =
      '<video id="direct" poster="https://pbs.twimg.com/ext_tw_video_thumb/222/outer.jpg"></video>';
    const direct = await extractor.extract(
      info,
      document.querySelector<HTMLElement>('#direct')!,
      {},
      'direct'
    );
    expect(quote).toMatchObject({ success: true });
    expect(quote.clickedIndex).toBe(0);
    expect(direct.success).toBe(true);
    expect(direct.clickedIndex).toBe(1);
    expect(httpGet).toHaveBeenCalledTimes(1);
    extractor.dispose();
    document.body.replaceChildren();
  });

  it('observes a failed response after its sole caller aborts during dispatch', async () => {
    const reuse = new TweetMetadataReuse();
    const controller = new AbortController();
    httpGet.mockImplementationOnce(async () => {
      controller.abort();
      return { ok: false, status: 503, data: {} };
    });
    await expect(reuse.get('222', undefined, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(reuse.get('222')).resolves.toMatchObject({
      entries: expect.any(Array),
      physicalRequestToken: expect.any(Object),
    });
    expect(httpGet).toHaveBeenCalledTimes(2);
    reuse.dispose();
  });

  it('coalesces two callers while allowing one to leave without cancelling the other', async () => {
    let complete!: (value: unknown) => void;
    httpGet.mockImplementation(
      () =>
        new Promise<unknown>((resolve) => {
          complete = resolve;
        })
    );
    const reuse = new TweetMetadataReuse();
    const firstController = new AbortController();
    const secondController = new AbortController();
    const first = reuse.get('222', undefined, firstController.signal);
    const second = reuse.get('222', undefined, secondController.signal);
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    firstController.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    complete({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    const accepted = await second;
    expect(accepted.entries).toHaveLength(2);
    expect(accepted.physicalRequestToken).toBeDefined();
    reuse.dispose();
  });

  it('aborts the last waiter and never publishes a late, ignored transport result', async () => {
    let complete!: (value: unknown) => void;
    httpGet.mockImplementationOnce(
      () =>
        new Promise<unknown>((resolve) => {
          complete = resolve;
        })
    );
    const reuse = new TweetMetadataReuse();
    const controller = new AbortController();
    const pending = reuse.get('222', undefined, controller.signal);
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    complete({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    await Promise.resolve();
    expect((await reuse.get('222')).entries).toHaveLength(2);
    expect(httpGet).toHaveBeenCalledTimes(2);
    reuse.dispose();
  });

  it('rejects an in-flight request immediately on explicit refresh', async () => {
    let complete!: (value: unknown) => void;
    httpGet.mockImplementationOnce(
      () =>
        new Promise<unknown>((resolve) => {
          complete = resolve;
        })
    );
    const reuse = new TweetMetadataReuse();
    const pending = reuse.get('222');
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    reuse.invalidate();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    complete({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    expect((await reuse.get('222')).entries).toHaveLength(2);
    expect(httpGet).toHaveBeenCalledTimes(2);
    reuse.dispose();
  });

  it('expires, refreshes, and invalidates on authentication or navigation changes', async () => {
    let now = 1_000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const reuse = new TweetMetadataReuse();
    const location = {
      hostname: 'x.com',
      origin: 'https://x.com',
      href: 'https://x.com/a/status/222',
    };
    await reuse.get('222', location);
    await reuse.get('222', location);
    expect(httpGet).toHaveBeenCalledTimes(1);
    now += 5_000;
    await reuse.get('222', location);
    expect(httpGet).toHaveBeenCalledTimes(2);
    resolveBearerToken.mockReturnValue('Bearer changed-token');
    await reuse.get('222', location);
    expect(httpGet).toHaveBeenCalledTimes(3);
    await reuse.get('222', { ...location, href: 'https://x.com/b/status/222' });
    expect(httpGet).toHaveBeenCalledTimes(4);
    reuse.invalidate();
    await reuse.get('222', { ...location, href: 'https://x.com/b/status/222' });
    expect(httpGet).toHaveBeenCalledTimes(5);
    reuse.dispose();
  });

  it('never caches an explicit empty or failed provider response', async () => {
    const reuse = new TweetMetadataReuse();
    httpGet.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { data: { tweetResult: { result: null } } },
    });
    expect((await reuse.get('222')).entries).toEqual([]);
    httpGet.mockResolvedValueOnce({ ok: false, status: 403, readable: true, data: {} });
    await expect(reuse.get('222')).rejects.toMatchObject({ category: 'denied' });
    expect((await reuse.get('222')).entries).toHaveLength(2);
    expect(httpGet).toHaveBeenCalledTimes(3);
    reuse.dispose();
  });

  it('reuses metadata at 4,999 ms and requests it again at exactly 5,000 ms', async () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const reuse = new TweetMetadataReuse();
    try {
      await reuse.get('222');
      now = 4_999;
      expect((await reuse.get('222')).physicalRequestToken).toBeUndefined();
      expect(httpGet).toHaveBeenCalledTimes(1);
      now = 5_000;
      expect((await reuse.get('222')).physicalRequestToken).toBeDefined();
      expect(httpGet).toHaveBeenCalledTimes(2);
    } finally {
      reuse.dispose();
    }
  });

  it('keeps four cache entries and evicts the oldest when admitting the fifth', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    httpGet.mockImplementation(async (url: string) => {
      const { tweetId } = JSON.parse(new URL(url).searchParams.get('variables')!);
      return { ok: true, status: 200, data: createPhotoTweetResponse(tweetId) };
    });
    const reuse = new TweetMetadataReuse();
    try {
      for (const id of ['101', '102', '103', '104']) {
        await reuse.get(id);
      }
      await reuse.get('101');
      expect(httpGet).toHaveBeenCalledTimes(4);
      await reuse.get('105');
      await reuse.get('102');
      expect(httpGet).toHaveBeenCalledTimes(5);
      await reuse.get('101');
      expect(httpGet).toHaveBeenCalledTimes(6);
    } finally {
      reuse.dispose();
    }
  });

  it.each([32, 33])('serves %i normalized media but caches at most 32', async (count) => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: createPhotoTweetResponse('222', count),
    });
    const reuse = new TweetMetadataReuse();
    try {
      expect((await reuse.get('222')).entries).toHaveLength(count);
      expect((await reuse.get('222')).entries).toHaveLength(count);
      expect(httpGet).toHaveBeenCalledTimes(count === 32 ? 1 : 2);
    } finally {
      reuse.dispose();
    }
  });

  it.each([64_000, 64_001])(
    'serves %i normalized serialized characters but caches at most 64,000',
    async (characters) => {
      const data = createPhotoTweetResponse('222', 1, '');
      httpGet.mockResolvedValue({ ok: true, status: 200, data });
      const normalized = await getTweetMedias('222');
      data.data.tweetResult.result.legacy.full_text = 'a'.repeat(
        characters - JSON.stringify(normalized).length
      );
      httpGet.mockClear();
      const reuse = new TweetMetadataReuse();
      try {
        const first = await reuse.get('222');
        expect(JSON.stringify(first.entries)).toHaveLength(characters);
        expect((await reuse.get('222')).entries).toEqual(first.entries);
        expect(httpGet).toHaveBeenCalledTimes(characters === 64_000 ? 1 : 2);
      } finally {
        reuse.dispose();
      }
    }
  );

  it('defers the ninth distinct flight without queuing it and admits an explicit later retry', async () => {
    const completions = new Map<string, () => void>();
    httpGet.mockImplementation(
      (url: string) =>
        new Promise((resolve) => {
          const { tweetId } = JSON.parse(new URL(url).searchParams.get('variables')!);
          completions.set(tweetId, () =>
            resolve({ ok: true, status: 200, data: createPhotoTweetResponse(tweetId) })
          );
        })
    );
    const reuse = new TweetMetadataReuse();
    const requests = Array.from({ length: 8 }, (_, index) => reuse.get(String(100 + index)));
    try {
      await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(8));
      await expect(reuse.get('999')).rejects.toMatchObject({ category: 'deferred' });
      expect(httpGet).toHaveBeenCalledTimes(8);
      expect(completions.has('999')).toBe(false);
      completions.get('100')!();
      await requests[0];
      await Promise.resolve();
      expect(httpGet).toHaveBeenCalledTimes(8);

      const retry = reuse.get('999');
      requests.push(retry);
      await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(9));
      completions.get('999')!();
      expect((await retry).entries[0]?.tweet_id).toBe('999');
    } finally {
      reuse.dispose();
      for (const complete of completions.values()) {
        complete();
      }
      await Promise.allSettled(requests);
    }
  });

  it.each([false, true])(
    'caches mixed HLS metadata but excludes entirely HLS lists: %s',
    async (allHls) => {
      const photo = createPhotoTweetResponse();
      const hls = {
        type: 'video',
        id_str: '8001',
        media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/8001/pu/img/hls.jpg',
        video_info: {
          variants: [
            {
              content_type: 'application/x-mpegURL',
              url: 'https://video.twimg.com/ext_tw_video/8001/pu/pl/list.m3u8',
            },
          ],
        },
      };
      const data = {
        data: {
          tweetResult: {
            result: {
              ...photo.data.tweetResult.result,
              legacy: {
                ...photo.data.tweetResult.result.legacy,
                extended_entities: {
                  media: allHls
                    ? [hls]
                    : [hls, ...photo.data.tweetResult.result.legacy.extended_entities.media],
                },
              },
            },
          },
        },
      };
      httpGet.mockResolvedValue({ ok: true, status: 200, data });
      const extractor = new TwitterAPIExtractor();
      const info = {
        tweetId: '222',
        username: 'cache_author',
        tweetUrl: 'https://x.com/cache_author/status/222',
        extractionMethod: 'fixture',
        confidence: 1,
      };
      document.body.innerHTML =
        '<a href="/cache_author/status/222/video/1"><video id="hls" poster="https://pbs.twimg.com/ext_tw_video_thumb/8001/pu/img/hls.jpg"></video></a><a href="/cache_author/status/222/photo/2"><img id="photo" src="https://pbs.twimg.com/media/cache-0.jpg"></a>';
      try {
        for (let click = 0; click < 2; click += 1) {
          const unsupported = await extractor.extract(
            info,
            document.getElementById('hls')!,
            {},
            'hls'
          );
          expect(unsupported).toMatchObject({
            success: false,
            failureKind: 'unsupported-source',
            apiRequestOutcome: 'healthy',
          });
          expect(unsupported.mediaItems).toEqual([]);
        }
        expect(httpGet).toHaveBeenCalledTimes(allHls ? 2 : 1);
        if (!allHls) {
          const selected = await extractor.extract(
            info,
            document.getElementById('photo')!,
            {},
            'photo'
          );
          expect(selected).toMatchObject({ success: true, clickedIndex: 0 });
          expect(selected.mediaItems[0]).toMatchObject({
            tweetId: '222',
            type: 'image',
            url: 'https://pbs.twimg.com/media/cache-0.jpg?format=jpg&name=orig',
          });
          expect(selected.apiRequestToken).toBeUndefined();
          const mismatch = document.createElement('img');
          mismatch.src = 'https://pbs.twimg.com/media/unknown.jpg';
          expect((await extractor.extract(info, mismatch, {}, 'mismatch')).success).toBe(false);
          expect(
            (await extractor.extract(info, document.getElementById('photo')!, {}, 'after-mismatch'))
              .success
          ).toBe(true);
          expect(httpGet).toHaveBeenCalledTimes(1);
        }
      } finally {
        extractor.dispose();
        document.body.replaceChildren();
      }
    }
  );
});

describe('twitter-api-client request boundary', () => {
  it('preserves full-length multilingual root and direct-quote notes within metadata capacity', async () => {
    const payload = createQuotedVideoTweetResponse();
    const root = payload.data.tweetResult.result;
    const text = '한글😀A'.repeat(5000);
    const data = {
      data: {
        tweetResult: {
          result: {
            ...root,
            note_tweet: { note_tweet_results: { result: { text } } },
            quoted_status_result: {
              result: {
                ...root.quoted_status_result.result,
                note_tweet: { note_tweet_results: { result: { text } } },
              },
            },
          },
        },
      },
    };
    expect(Array.from(text)).toHaveLength(20_000);
    expect(new TextEncoder().encode(JSON.stringify(data)).byteLength).toBeLessThan(2 * 1024 * 1024);
    httpGet.mockResolvedValue({ ok: true, status: 200, data });
    const entries = await getTweetMedias('222');
    expect(entries).toHaveLength(2);
    expect(entries.map(({ tweet_text }) => tweet_text)).toEqual([text, text]);
    expect(entries.map(({ sourceLocation }) => sourceLocation)).toEqual(['quoted', 'original']);
  });

  it('requests finite metadata admission before parsing and reports local capacity without reuse', async () => {
    httpGet.mockReset();
    httpGet.mockRejectedValue(new HttpResponseSizeLimitError(32, 33));
    const reuse = new TweetMetadataReuse();
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await expect(reuse.get('123')).rejects.toMatchObject({ category: 'resource-limit' });
      }
      expect(httpGet).toHaveBeenCalledTimes(2);
      expect(httpGet).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          responseType: 'json',
          maxResponseBytes: 2 * 1024 * 1024,
        })
      );
    } finally {
      reuse.dispose();
    }
  });

  beforeEach(() => {
    httpGet.mockReset();
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { tweetResult: { result: null } } },
    });
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

  it.each([
    [{ ok: false, status: 401, readable: true, data: {} }, 'denied'],
    [{ ok: false, status: 403, readable: true, retryAfterMs: 30_000, data: {} }, 'denied'],
    [
      { ok: false, status: 0, readable: false, errorCategory: 'unreadable', data: {} },
      'unreadable',
    ],
    [{ ok: false, status: 429, readable: true, retryAfterMs: 120_000, data: {} }, 'rate-limited'],
    [{ ok: false, status: 503, readable: true, retryAfterMs: 120_000, data: {} }, 'deferred'],
    [{ ok: false, status: 408, readable: true, retryAfterMs: 120_000, data: {} }, 'deferred'],
    [{ ok: false, status: 425, readable: true, retryAfterMs: 120_000, data: {} }, 'deferred'],
    [{ ok: false, status: 500, readable: true, retryAfterMs: 120_000, data: {} }, 'deferred'],
    [{ ok: false, status: 502, readable: false, retryAfterMs: 120_000, data: {} }, 'unreadable'],
    [{ ok: false, status: 404, readable: true, data: {} }, 'transport'],
    [{ ok: false, status: 404, readable: false, data: {} }, 'unreadable'],
    [
      {
        ok: false,
        status: 503,
        readable: false,
        errorCategory: 'unreadable',
        retryAfterMs: 120_000,
        data: {},
      },
      'unreadable',
    ],
  ])(
    'classifies safe HTTP metadata without guessing provider intent',
    async (response, category) => {
      httpGet.mockResolvedValueOnce(response);
      await expect(getTweetMedias('222')).rejects.toMatchObject({
        category,
        ...('retryAfterMs' in response && response.retryAfterMs !== undefined
          ? { retryAfterMs: response.retryAfterMs }
          : {}),
      });
    }
  );

  it.each([undefined, -1, Number.NaN, Number.POSITIVE_INFINITY, 86_400_001])(
    'discards invalid Retry-After guidance instead of retaining a defer: %s',
    async (retryAfterMs) => {
      httpGet.mockResolvedValueOnce({
        ok: false,
        status: 503,
        readable: true,
        retryAfterMs,
        data: {},
      });
      await expect(getTweetMedias('222')).rejects.toMatchObject({
        category: 'transport',
        retryAfterMs: undefined,
      });
      httpGet.mockResolvedValueOnce({ ok: true, status: 200, data: createPhotoTweetResponse() });
      expect(await getTweetMedias('222')).toHaveLength(1);
      expect(httpGet).toHaveBeenCalledTimes(2);
    }
  );

  it('uses typed transport metadata without exposing the transport error text', async () => {
    const underlying = Object.assign(new Error('private response detail'), {
      status: 0,
      readable: false,
      category: 'unreadable',
    });
    httpGet.mockRejectedValueOnce(underlying);
    await expect(getTweetMedias('222')).rejects.toMatchObject({
      category: 'unreadable',
      message: 'Twitter API transport failed',
    });
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
    await expect(getTweetMedias('123')).rejects.toMatchObject({ category: 'provider-error' });

    const usableResponse = createQuotedVideoTweetResponse();
    httpGet.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { ...usableResponse, errors: providerErrors },
    });
    await expect(getTweetMedias('222')).resolves.toMatchObject([
      {
        tweet_id: '111',
        type: 'photo',
        sourceLocation: 'quoted',
        quoteParentTweetId: '222',
        quotedTweetId: '111',
      },
      { tweet_id: '222', type: 'video', sourceLocation: 'original' },
    ]);
  });

  it.each([
    {},
    { data: {} },
    { data: { tweetResult: {} } },
    { data: { tweetResult: null } },
    { data: { tweetResult: [] } },
  ])('rejects a missing or unsupported result envelope: %j', async (data) => {
    httpGet.mockResolvedValueOnce({ ok: true, status: 200, data });
    await expect(getTweetMedias('222')).rejects.toMatchObject({
      name: 'TwitterAPIRequestError',
      category: 'provider-error',
    });
  });

  it.each([{ data: 'login' }, { data: [] }])(
    'rejects readable JSON that is not a provider object: %j',
    async ({ data }) => {
      httpGet.mockResolvedValueOnce({ ok: true, status: 200, data });
      await expect(getTweetMedias('222')).rejects.toMatchObject({ category: 'unreadable' });
    }
  );

  it('rejects a mismatched numeric root before using its direct quote', async () => {
    httpGet.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: createQuotedVideoTweetResponse(),
    });

    await expect(getTweetMedias('999')).rejects.toThrow('unexpected tweet owner');
  });

  it('carries an invalid root through metadata reuse and extraction as one failed request', async () => {
    httpGet.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        data: {
          tweetResult: {
            result: {
              __typename: 'Tweet',
              rest_id: '999',
            },
          },
        },
      },
    });
    const extractor = new TwitterAPIExtractor();
    const extracted = await extractor.extract(
      {
        tweetId: '222',
        username: 'outer',
        tweetUrl: 'https://x.com/outer/status/222',
        extractionMethod: 'fixture',
        confidence: 1,
      },
      document.createElement('video'),
      {},
      'invalid-root'
    );
    expect(extracted).toMatchObject({
      success: false,
      mediaItems: [],
      apiRequestOutcome: 'failed',
      apiRequestToken: expect.any(Object),
      failureKind: 'provider-error',
    });
    expect(httpGet).toHaveBeenCalledTimes(1);
    extractor.dispose();
  });

  it.each(['TweetUnavailable', 'TweetTombstone'])(
    'returns healthy no-media for %s through zero, one or two visibility wrappers',
    async (__typename) => {
      for (let depth = 0; depth <= 2; depth += 1) {
        let result: TwitterTweet = { __typename };
        for (let wrapper = 0; wrapper < depth; wrapper += 1) {
          result = { __typename: 'TweetWithVisibilityResults', tweet: result };
        }
        httpGet.mockResolvedValue({
          ok: true,
          status: 200,
          data: { data: { tweetResult: { result } } },
        });
        await expect(getTweetMedias('222')).resolves.toEqual([]);
        const extracted = await new TwitterAPIExtractor().extract(
          {
            tweetId: '222',
            username: 'outer',
            tweetUrl: 'https://x.com/outer/status/222',
            extractionMethod: 'fixture',
            confidence: 1,
          },
          document.createElement('video'),
          {},
          'unavailable'
        );
        expect(extracted).toMatchObject({
          success: false,
          mediaItems: [],
          apiRequestOutcome: 'healthy',
          metadata: { strategy: 'api-media-unavailable' },
        });
      }
    }
  );

  it.each([
    null,
    undefined,
    { __typename: 'Tweet', rest_id: '222' },
    { __typename: 'Tweet', rest_id: '222', core: { user_results: { result: {} } } },
  ])('keeps absent or matching media-less results empty: %j', async (result) => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { tweetResult: { result } } },
    });
    await expect(getTweetMedias('222')).resolves.toEqual([]);
  });

  it.each([
    {},
    [],
    'TweetUnavailable',
    false,
    0,
    { __typename: 'UnknownResult' },
    { __typename: 'UnknownResult', rest_id: '222' },
    { __typename: 'Tweet', rest_id: '999' },
    { rest_id: '222', id_str: '111' },
    { rest_id: '222', legacy: { id_str: '111' } },
    { id_str: '222', legacy: { id_str: '111' } },
    { __typename: 'TweetUnavailable', rest_id: '999' },
    { __typename: 'TweetTombstone', rest_id: '222', id_str: '111' },
    { __typename: 'TweetWithVisibilityResults' },
    { __typename: 'UnknownWrapper', tweet: { __typename: 'TweetUnavailable' } },
    { __typename: 'TweetWithVisibilityResults', tweet: null },
    {
      __typename: 'TweetWithVisibilityResults',
      tweet: {
        __typename: 'TweetWithVisibilityResults',
        tweet: {
          __typename: 'TweetWithVisibilityResults',
          tweet: { __typename: 'TweetUnavailable' },
        },
      },
    },
    { __typename: 'TweetUnavailable', tweet: { __typename: 'TweetUnavailable' } },
  ])('rejects unsupported, malformed or conflicting roots: %j', async (result) => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: { tweetResult: { result } } },
    });
    await expect(getTweetMedias('222')).rejects.toMatchObject({
      name: 'TwitterAPIRequestError',
      category: 'provider-error',
    });
  });

  it.each(['TweetUnavailable', 'TweetTombstone'])(
    'supports the legacy untagged visibility envelope for %s',
    async (__typename) => {
      httpGet.mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { tweetResult: { result: { tweet: { tweet: { __typename } } } } } },
      });
      await expect(getTweetMedias('222')).resolves.toEqual([]);
    }
  );

  it.each(['TweetUnavailable', 'TweetTombstone'])(
    'does not substitute an available quote for an unavailable %s root',
    async (__typename) => {
      httpGet.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: {
            tweetResult: {
              result: {
                __typename,
                quoted_status_result: {
                  result: createQuotedVideoTweetResponse().data.tweetResult.result,
                },
              },
            },
          },
        },
      });
      await expect(getTweetMedias('222')).resolves.toEqual([]);
    }
  );

  it.each(['TweetUnavailable', 'TweetTombstone'])(
    'keeps provider and HTTP errors ahead of unavailable %s',
    async (__typename) => {
      for (const result of [
        { __typename },
        { __typename: 'TweetWithVisibilityResults', tweet: { __typename } },
      ]) {
        httpGet.mockResolvedValue({
          ok: true,
          status: 200,
          data: {
            data: { tweetResult: { result } },
            errors: [{ code: 88, message: 'Rate limit' }],
          },
        });
        await expect(getTweetMedias('222')).rejects.toThrow('provider error');
        httpGet.mockResolvedValue({
          ok: false,
          status: 503,
          data: { data: { tweetResult: { result } } },
        });
        await expect(getTweetMedias('222')).rejects.toThrow('TW:503');
      }
    }
  );

  it('rejects provider errors with matching but unusable partial data', async () => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        data: { tweetResult: { result: { rest_id: '222' } } },
        errors: [{ code: 88, message: 'Rate limit' }],
      },
    });
    await expect(getTweetMedias('222')).rejects.toThrow('provider error');
  });

  it.each(['TweetUnavailable', 'TweetTombstone'])(
    'retains valid root media when its direct quote is %s with an available deeper quote',
    async (__typename) => {
      const root = createQuotedVideoTweetResponse().data.tweetResult.result;
      httpGet.mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          data: {
            tweetResult: {
              result: {
                ...root,
                quoted_status_result: {
                  result: { __typename, quoted_status_result: root.quoted_status_result },
                },
              },
            },
          },
        },
      });
      await expect(getTweetMedias('222')).resolves.toMatchObject([
        {
          tweet_id: '222',
          type: 'video',
          sourceLocation: 'original',
          download_url: 'https://video.twimg.com/ext_tw_video/222/outer.mp4',
        },
      ]);
    }
  );

  it('normalizes wrapped A and B, returns direct B before A, and excludes C', async () => {
    const response = createQuotedVideoTweetResponse();
    const root = response.data.tweetResult.result;
    httpGet.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        data: {
          tweetResult: {
            result: {
              tweet: {
                ...root,
                quoted_status_result: { result: { tweet: root.quoted_status_result.result } },
              },
            },
          },
        },
      },
    });

    const entries = await getTweetMedias('222');
    expect(entries).toHaveLength(2);
    expect(entries.map(({ tweet_id }) => tweet_id)).toEqual(['111', '222']);
    expect(entries[0]).toMatchObject({
      sourceLocation: 'quoted',
      quoteParentTweetId: '222',
      quotedTweetId: '111',
      screen_name: 'quote',
      tweet_text: 'Quote text',
    });
    expect(entries[1]).toMatchObject({
      sourceLocation: 'original',
      screen_name: 'outer',
      tweet_text: 'Outer text',
      videoVariantUrls: ['https://video.twimg.com/ext_tw_video/222/outer.mp4'],
    });
    expect(entries.some(({ tweet_id }) => tweet_id === '333')).toBe(false);
  });
});
