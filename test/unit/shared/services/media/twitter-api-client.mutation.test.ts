import { TWITTER_API_CONFIG } from '@/constants';
import { logger } from '@shared/logging';
import { sortMediaByVisualOrder } from '@shared/media/media-utils';
import { HttpRequestService } from '@shared/services/http-request-service';
import { TwitterAPI } from '@shared/services/media/twitter-api-client';
import { TwitterResponseParser } from '@shared/services/media/twitter-response-parser';
// Use vitest globals and import only types necessary
import type { Mock } from 'vitest';

// Mock dependencies
vi.mock('@shared/logging');
vi.mock('@shared/services/http-request-service');
vi.mock('@shared/services/media/twitter-auth-service', () => ({
  TwitterAuthService: {
    csrfToken: 'mock-csrf-token',
  },
}));
vi.mock('@shared/services/media/twitter-response-parser');
vi.mock('@shared/media/media-utils');

describe('TwitterAPI Mutation Tests', () => {
  let mockHttpService: { get: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset cache
    // @ts-expect-error - Accessing private static property
    TwitterAPI.requestCache.clear();

    mockHttpService = {
      get: vi.fn(),
    };
    // @ts-expect-error - Mocking singleton
    HttpRequestService.getInstance.mockReturnValue(mockHttpService);

    // Default mock implementations
    (TwitterResponseParser.normalizeLegacyTweet as Mock).mockImplementation(() => {});
    (TwitterResponseParser.normalizeLegacyUser as Mock).mockImplementation(() => {});
    (TwitterResponseParser.extractMediaFromTweet as Mock).mockReturnValue([]);
    (sortMediaByVisualOrder as Mock).mockImplementation((media: unknown[]) => media);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTweetMedias', () => {
    it('should handle quoted tweets correctly', async () => {
      const tweetId = 'tweet-with-quote';
      const mockMainMedia = [{ id: 'm1', index: 0 }];
      const mockQuotedMedia = [{ id: 'q1', index: 0 }];

      const mockResponse = {
        data: {
          tweetResult: {
            result: {
              __typename: 'Tweet',
              legacy: {},
              core: { user_results: { result: {} } },
              quoted_status_result: {
                result: {
                  __typename: 'Tweet',
                  legacy: {},
                  core: { user_results: { result: {} } },
                },
              },
            },
          },
        },
      };

      mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });

      // Mock parser responses
      (TwitterResponseParser.extractMediaFromTweet as Mock)
        .mockReturnValueOnce(mockMainMedia) // First call for main tweet
        .mockReturnValueOnce(mockQuotedMedia); // Second call for quoted tweet

      (sortMediaByVisualOrder as Mock)
        .mockReturnValueOnce(mockMainMedia) // Sort main
        .mockReturnValueOnce(mockQuotedMedia); // Sort quoted

      const result = await TwitterAPI.getTweetMedias(tweetId);

      // Quoted media should come first, then main media with adjusted indices
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockQuotedMedia[0]); // Quoted first
      expect(result[1]).toEqual({ ...mockMainMedia[0], index: 1 }); // Main second, index shifted
    });

    it('should handle nested quoted tweet result', async () => {
      const tweetId = 'nested-quote';
      const mockResponse = {
        data: {
          tweetResult: {
            result: {
              legacy: {},
              core: { user_results: { result: {} } },
              quoted_status_result: {
                result: {
                  tweet: {
                    // Nested tweet object
                    legacy: {},
                    core: { user_results: { result: {} } },
                  },
                },
              },
            },
          },
        },
      };

      mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });
      (TwitterResponseParser.extractMediaFromTweet as Mock).mockReturnValue([]);

      await TwitterAPI.getTweetMedias(tweetId);

      expect(TwitterResponseParser.extractMediaFromTweet).toHaveBeenCalledTimes(2);
    });

    it('should ignore quoted tweet if user is missing', async () => {
      const tweetId = 'quote-no-user';
      const mockResponse = {
        data: {
          tweetResult: {
            result: {
              legacy: {},
              core: { user_results: { result: {} } },
              quoted_status_result: {
                result: {
                  legacy: {},
                  core: {
                    /* user_results missing */
                  },
                },
              },
            },
          },
        },
      };

      mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });
      (TwitterResponseParser.extractMediaFromTweet as Mock).mockReturnValue([]);

      await TwitterAPI.getTweetMedias(tweetId);

      // Should only extract from main tweet
      expect(TwitterResponseParser.extractMediaFromTweet).toHaveBeenCalledTimes(1);
    });

    it('should unwrap nested tweet result', async () => {
      const tweetId = 'nested-tweet';
      const innerTweet = {
        legacy: { id_str: 'inner' },
        core: { user_results: { result: { id: 'user' } } },
      };
      const mockResponse = {
        data: {
          tweetResult: {
            result: {
              tweet: innerTweet,
            },
          },
        },
      };

      mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });
      (TwitterResponseParser.extractMediaFromTweet as Mock).mockReturnValue([]);

      await TwitterAPI.getTweetMedias(tweetId);

      expect(TwitterResponseParser.extractMediaFromTweet).toHaveBeenCalledWith(
        innerTweet,
        innerTweet.core.user_results.result,
        'original'
      );
    });

    it('should return empty array if tweet user is missing (missing core)', async () => {
      const tweetId = 'no-core';
      const mockResponse = {
        data: {
          tweetResult: {
            result: {
              legacy: {},
              // core missing
            },
          },
        },
      };

      mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });

      const result = await TwitterAPI.getTweetMedias(tweetId);

      expect(result).toEqual([]);
      expect(TwitterResponseParser.extractMediaFromTweet).not.toHaveBeenCalled();
    });

    it('should ignore quoted tweet if quoted user is missing (missing core)', async () => {
      const tweetId = 'quote-no-core';
      const mockResponse = {
        data: {
          tweetResult: {
            result: {
              legacy: {},
              core: { user_results: { result: {} } },
              quoted_status_result: {
                result: {
                  legacy: {},
                  // core missing
                },
              },
            },
          },
        },
      };

      mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });
      (TwitterResponseParser.extractMediaFromTweet as Mock).mockReturnValue([]);

      await TwitterAPI.getTweetMedias(tweetId);

      // Should only extract from main tweet
      expect(TwitterResponseParser.extractMediaFromTweet).toHaveBeenCalledTimes(1);
      expect(TwitterResponseParser.extractMediaFromTweet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'original'
      );
    });
  });

  describe('apiRequest', () => {
    it('should use cached response if available', async () => {
      const url = 'https://api.twitter.com/cache-test';
      const mockData = { data: { cached: true } };

      // First request to populate cache
      mockHttpService.get.mockResolvedValue({ ok: true, data: mockData });

      // We need to access the private apiRequest method.
      // Since it's private, we can test it via getTweetMedias or cast to any.
      // Using getTweetMedias is harder because it constructs the URL.
      // Let's cast TwitterAPI to any to access private method for testing purposes.

      // @ts-expect-error - Accessing private method
      const result1 = await TwitterAPI.apiRequest(url);
      expect(result1).toEqual(mockData);
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);

      // Second request should use cache
      // @ts-expect-error - Accessing private method
      const result2 = await TwitterAPI.apiRequest(url);
      expect(result2).toEqual(mockData);
      expect(mockHttpService.get).toHaveBeenCalledTimes(1); // Call count shouldn't increase
    });

    it('should evict oldest cache entry when limit is reached', async () => {
      const limit = 16;
      mockHttpService.get.mockResolvedValue({ ok: true, data: {} });

      // Fill cache
      for (let i = 0; i < limit; i++) {
        // @ts-expect-error - Accessing private method
        await TwitterAPI.apiRequest(`url-${i}`);
      }

      // Add one more
      // @ts-expect-error - Accessing private method
      await TwitterAPI.apiRequest(`url-${limit}`);

      // First one should be gone (re-requesting it should trigger http call)
      mockHttpService.get.mockClear();
      mockHttpService.get.mockResolvedValue({ ok: true, data: {} });

      // @ts-expect-error - Accessing private method
      await TwitterAPI.apiRequest('url-0');
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
    });

    it('should include correct headers', async () => {
      const url = 'https://api.twitter.com/headers-test';
      mockHttpService.get.mockResolvedValue({ ok: true, data: {} });

      // @ts-expect-error - Accessing private method
      await TwitterAPI.apiRequest(url);

      const callArgs = mockHttpService.get.mock.calls[0];
      const headers = callArgs?.[1]?.headers;

      expect(headers).toMatchObject({
        authorization: TWITTER_API_CONFIG.GUEST_AUTHORIZATION,
        'x-csrf-token': 'mock-csrf-token',
        'x-twitter-client-language': 'en',
        'x-twitter-active-user': 'yes',
        'content-type': 'application/json',
        'x-twitter-auth-type': 'OAuth2Session',
      });
    });

    it('should throw error on non-ok response', async () => {
      mockHttpService.get.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        data: { error: 'fail' },
      });

      // @ts-expect-error - Accessing private method
      await expect(TwitterAPI.apiRequest('fail-url')).rejects.toThrow(
        'Twitter API request failed: 500 Server Error'
      );

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should log warning if response contains errors', async () => {
      mockHttpService.get.mockResolvedValue({
        ok: true,
        data: { errors: [{ message: 'Something went wrong' }] },
      });

      // @ts-expect-error - Accessing private method
      await TwitterAPI.apiRequest('error-url');
      expect(logger.warn).toHaveBeenCalledWith('Twitter API returned errors:', expect.any(Array));
    });

    it('should log error and rethrow on exception', async () => {
      const error = new Error('Network fail');
      mockHttpService.get.mockRejectedValue(error);

      // @ts-expect-error - Accessing private method
      await expect(TwitterAPI.apiRequest('exception-url')).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith('Twitter API request failed:', error);
    });

    it('should not add browser headers when window is undefined', async () => {
      const originalWindow = global.window;
      // @ts-expect-error - Deleting global.window for test
      delete global.window;

      try {
        const url = 'https://api.twitter.com/no-window';
        mockHttpService.get.mockResolvedValue({ ok: true, data: {} });

        // @ts-expect-error - Accessing private method
        await TwitterAPI.apiRequest(url);

        const callArgs = mockHttpService.get.mock.calls[0];
        const headers = callArgs?.[1]?.headers;

        expect(headers).not.toHaveProperty('referer');
        expect(headers).not.toHaveProperty('origin');
      } finally {
        global.window = originalWindow;
      }
    });

    it('should not log warning if errors array is empty', async () => {
      mockHttpService.get.mockResolvedValue({
        ok: true,
        data: { errors: [] },
      });

      // @ts-expect-error - Accessing private method
      await TwitterAPI.apiRequest('empty-errors-url');
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not log warning if errors property is missing', async () => {
      mockHttpService.get.mockResolvedValue({
        ok: true,
        data: { some: 'data' },
      });

      // @ts-expect-error - Accessing private method
      await TwitterAPI.apiRequest('no-errors-url');
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should maintain cache integrity (not evict prematurely)', async () => {
      const limit = 16;
      mockHttpService.get.mockResolvedValue({ ok: true, data: {} });

      // Fill cache up to limit - 1
      for (let i = 0; i < limit - 1; i++) {
        // @ts-expect-error - Accessing private method
        await TwitterAPI.apiRequest(`url-${i}`);
      }

      // Verify all are in cache (by not triggering http calls)
      mockHttpService.get.mockClear();
      mockHttpService.get.mockResolvedValue({ ok: true, data: {} });

      for (let i = 0; i < limit - 1; i++) {
        // @ts-expect-error - Accessing private method
        await TwitterAPI.apiRequest(`url-${i}`);
      }
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });
  });

  describe('createTweetEndpointUrl', () => {
    it('should construct correct URL with variables and features', async () => {
      const tweetId = '12345';
      // Trigger via public method but intercept the http call to check the URL
      mockHttpService.get.mockResolvedValue({ ok: true, data: {} });

      await TwitterAPI.getTweetMedias(tweetId);

      const url = mockHttpService.get.mock.calls[0]?.[0];
      if (!url) throw new Error('URL not found');
      const urlObj = new URL(url);

      expect(urlObj.pathname).toContain(TWITTER_API_CONFIG.TWEET_RESULT_BY_REST_ID_QUERY_ID);

      const variables = JSON.parse(urlObj.searchParams.get('variables')!);
      expect(variables).toEqual({
        tweetId,
        withCommunity: false,
        includePromotedContent: false,
        withVoice: false,
      });

      const features = JSON.parse(urlObj.searchParams.get('features')!);
      expect(features).toEqual({
        creator_subscriptions_tweet_preview_api_enabled: true,
        communities_web_enable_tweet_community_results_fetch: true,
        c9s_tweet_anatomy_moderator_badge_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: true,
        tweet_awards_web_tipping_enabled: false,
        responsive_web_grok_show_grok_translated_post: false,
        responsive_web_grok_analysis_button_from_backend: false,
        creator_subscriptions_quote_tweet_preview_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        profile_label_improvements_pcf_label_in_post_enabled: true,
        rweb_tipjar_consumption_enabled: true,
        verified_phone_label_enabled: false,
        responsive_web_grok_image_annotation_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_enhance_cards_enabled: false,
        articles_preview_enabled: true,
        premium_content_api_read_enabled: false,
        responsive_web_grok_analyze_button_fetch_trends_enabled: false,
        responsive_web_grok_analyze_post_followups_enabled: false,
        responsive_web_grok_share_attachment_enabled: true,
        responsive_web_jetfuel_frame: false,
      });

      const fieldToggles = JSON.parse(urlObj.searchParams.get('fieldToggles')!);
      expect(fieldToggles).toEqual({
        withArticleRichContentState: true,
        withArticlePlainText: false,
        withGrokAnalyze: false,
        withDisallowedReplyControls: false,
      });
    });
  });

  it('should include referer and origin headers when window is defined', async () => {
    const tweetId = 'header-test';
    const mockResponse = {
      data: { tweetResult: { result: { legacy: {}, core: { user_results: { result: {} } } } } },
    };
    mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });

    // Ensure window is defined (it is in JSDOM, but let's be explicit about what we expect)
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://x.com/user/status/123',
        origin: 'https://x.com',
        hostname: 'x.com',
      },
      writable: true,
    });
    await TwitterAPI.getTweetMedias(tweetId);

    expect(mockHttpService.get).toHaveBeenCalledWith(
      expect.stringContaining(tweetId),
      expect.objectContaining({
        headers: expect.objectContaining({
          referer: 'https://x.com/user/status/123',
          origin: 'https://x.com',
        }),
      })
    );
  });
});
