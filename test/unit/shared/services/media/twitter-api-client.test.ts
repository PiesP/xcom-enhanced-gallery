import { HttpRequestService } from "@shared/services/http-request-service";
import { TwitterAPI } from "@shared/services/media/twitter-api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@shared/services/http-request-service");
vi.mock("@shared/services/cookie-service", () => ({
  getCookieService: vi.fn(() => ({
    getValueSync: vi.fn().mockReturnValue("token"),
    getValue: vi.fn().mockResolvedValue("token"),
  })),
}));
vi.mock("@shared/logging");

describe("TwitterAPI", () => {
  let mockHttpService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpService = {
      get: vi.fn(),
      post: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { guest_token: "guest_token" } }),
    };
    // @ts-expect-error - Mocking singleton
    HttpRequestService.getInstance.mockReturnValue(mockHttpService);
  });

  it("should return empty array if tweetResult is missing", async () => {
    const tweetId = "missing-result";
    mockHttpService.get.mockResolvedValue({ ok: true, data: { data: {} } });
    const result = await TwitterAPI.getTweetMedias(tweetId);
    expect(result).toEqual([]);
  });

  it("should return empty array if tweetUser is missing", async () => {
    const tweetId = "missing-user";
    const mockResponse = {
      data: {
        tweetResult: {
          result: {
            __typename: "Tweet",
            rest_id: tweetId,
            legacy: {},
            core: {
              // user_results missing
            },
          },
        },
      },
    };
    mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });
    const result = await TwitterAPI.getTweetMedias(tweetId);
    expect(result).toEqual([]);
  });

  it("should handle nested tweetResult (tweetResult.tweet)", async () => {
    const tweetId = "nested-tweet";
    const mockResponse = {
      data: {
        tweetResult: {
          result: {
            tweet: {
              // Nested
              __typename: "Tweet",
              rest_id: tweetId,
              legacy: {
                full_text: "Text",
                extended_entities: { media: [] },
              },
              core: {
                user_results: {
                  result: { legacy: { screen_name: "user1" } },
                },
              },
            },
          },
        },
      },
    };
    mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });
    const result = await TwitterAPI.getTweetMedias(tweetId);
    expect(result).toEqual([]); // Should process but find no media
  });

  it("should extract media from quoted tweet when quoted_status_result is wrapped", async () => {
    const tweetId = "quoted-tweet";
    const mockResponse = {
      data: {
        tweetResult: {
          result: {
            __typename: "Tweet",
            rest_id: tweetId,
            legacy: {
              full_text: "Main tweet text",
              extended_entities: {
                media: [
                  {
                    id_str: "111",
                    type: "photo",
                    media_url_https: "https://pbs.twimg.com/media/1.jpg",
                    expanded_url: "https://twitter.com/user/status/123/photo/1",
                  },
                ],
              },
            },
            core: {
              user_results: {
                result: {
                  legacy: { screen_name: "user1" },
                },
              },
            },
            quoted_status_result: {
              result: {
                __typename: "TweetWithVisibilityResults",
                tweet: {
                  rest_id: "0987654321",
                  legacy: {
                    full_text: "Quoted tweet text",
                    extended_entities: {
                      media: [
                        {
                          id_str: "222",
                          type: "video",
                          media_url_https: "https://pbs.twimg.com/media/2.jpg",
                          expanded_url:
                            "https://twitter.com/user/status/098/video/1",
                          video_info: {
                            variants: [
                              {
                                content_type: "video/mp4",
                                bitrate: 2000000,
                                url: "https://video.twimg.com/vid.mp4",
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  core: {
                    user_results: {
                      result: {
                        legacy: { screen_name: "user2" },
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

    mockHttpService.get.mockResolvedValue({ ok: true, data: mockResponse });

    const mediaItems = await TwitterAPI.getTweetMedias(tweetId);

    expect(mediaItems).toHaveLength(2);
    expect(mediaItems[0]!.sourceLocation).toBe("quoted");
    expect(mediaItems[0]!.type).toBe("video");
    expect(mediaItems[1]!.sourceLocation).toBe("original");
    expect(mediaItems[1]!.type).toBe("photo");
  });
});
