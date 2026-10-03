// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { TwitterTweet } from '../../src/shared/services/media/types';

function videoTweet(owner: string, mediaId: string, playable: boolean): TwitterTweet {
  return {
    rest_id: owner,
    core: { user_results: { result: { legacy: { screen_name: `author_${owner}` } } } },
    legacy: {
      id_str: owner,
      full_text: 'Synthetic video post',
      extended_entities: {
        media: [
          {
            type: 'video',
            id_str: mediaId,
            media_key: `7_${mediaId}`,
            media_url_https: `https://pbs.twimg.com/amplify_video_thumb/${mediaId}/img/poster-${mediaId}.jpg`,
            expanded_url: `https://x.com/author_${owner}/status/${owner}/video/1`,
            video_info: {
              aspect_ratio: [16, 9],
              variants: playable
                ? [
                    {
                      bitrate: 2176000,
                      content_type: 'video/mp4',
                      url: `https://video.twimg.com/amplify_video/${mediaId}/vid/video-${mediaId}.mp4`,
                    },
                  ]
                : [
                    {
                      content_type: 'application/x-mpegURL',
                      url: `https://video.twimg.com/amplify_video/${mediaId}/playlist.m3u8`,
                    },
                  ],
            },
          },
        ],
      },
    },
  };
}

/** Main post 222/media 333 and quoted post 111/media 444; only the main variants vary. */
export function createMixedOwnerVideoResponse(mainPlayable = true): Record<string, unknown> {
  return {
    data: {
      tweetResult: {
        result: {
          ...videoTweet('222', '333', mainPlayable),
          quoted_status_result: { result: videoTweet('111', '444', true) },
        },
      },
    },
  };
}
