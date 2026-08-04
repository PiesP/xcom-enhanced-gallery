// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GraphQL fixture for an outer quote tweet containing a video and a quoted
 * original tweet containing an image. The API client intentionally returns
 * quoted media first, so clicking the outer video must resolve to index 1.
 */
export function createQuotedVideoTweetResponse(): Record<string, unknown> {
  return {
    data: {
      tweetResult: {
        result: {
          rest_id: '222',
          core: {
            user_results: {
              result: {
                legacy: {
                  screen_name: 'quote_author',
                  name: 'Quote Author',
                },
              },
            },
          },
          legacy: {
            id_str: '222',
            full_text: 'Outer quote tweet https://t.co/outer-video',
            extended_entities: {
              media: [
                {
                  type: 'video',
                  id_str: 'video-222',
                  media_key: '7_video-222',
                  media_url_https:
                    'https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg',
                  expanded_url: 'https://x.com/quote_author/status/222/video/1',
                  display_url: 'pic.x.com/outer-video',
                  url: 'https://t.co/outer-video',
                  original_info: { width: 1280, height: 720 },
                  video_info: {
                    aspect_ratio: [16, 9],
                    variants: [
                      {
                        bitrate: 832000,
                        content_type: 'video/mp4',
                        url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/640x360/quote-video.mp4',
                      },
                      {
                        bitrate: 2176000,
                        content_type: 'video/mp4',
                        url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/1280x720/quote-video.mp4',
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
              core: {
                user_results: {
                  result: {
                    legacy: {
                      screen_name: 'original_author',
                      name: 'Original Author',
                    },
                  },
                },
              },
              legacy: {
                id_str: '111',
                full_text: 'Quoted original tweet https://t.co/quoted-image',
                extended_entities: {
                  media: [
                    {
                      type: 'photo',
                      id_str: 'photo-111',
                      media_key: '3_photo-111',
                      media_url_https: 'https://pbs.twimg.com/media/quoted-image.jpg',
                      expanded_url: 'https://x.com/original_author/status/111/photo/1',
                      display_url: 'pic.x.com/quoted-image',
                      url: 'https://t.co/quoted-image',
                      original_info: { width: 800, height: 600 },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  };
}
