// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import { convertAPIMediaToMediaInfo } from '@shared/services/media/media-factory';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { TweetInfo } from '@shared/types/media.types';

const request: TweetInfo = {
  tweetId: '222', username: 'outer', tweetUrl: 'https://x.com/outer/status/222',
  extractionMethod: 'dom-structure', confidence: 1,
};

function entry(overrides: Partial<TweetMediaEntry> = {}): TweetMediaEntry {
  return {
    screen_name: 'outer', tweet_id: '222',
    download_url: 'https://pbs.twimg.com/media/outer.jpg',
    type: 'photo', typeOriginal: 'photo', index: 0,
    preview_url: 'https://pbs.twimg.com/media/outer.jpg',
    media_id: 'outer', media_key: '3_outer', expanded_url: '',
    short_expanded_url: '', short_tweet_url: '', tweet_text: 'API outer text',
    sourceLocation: 'original',
    ...overrides,
  };
}

describe('API media factory ownership', () => {
  it('keeps requested A separate from quoted B identity, text and playback variants', () => {
    const quoted = entry({ screen_name: 'quoted_user', tweet_id: '111',
      type: 'video', typeOriginal: 'video', index: 0, sourceLocation: 'quoted',
      quoteParentTweetId: '222', quotedTweetId: '111',
      download_url: 'https://video.twimg.com/ext_tw_video/111/high.mp4',
      preview_url: 'https://pbs.twimg.com/ext_tw_video_thumb/111/preview.jpg',
      videoVariantUrls: [
        'https://video.twimg.com/ext_tw_video/111/high.mp4',
        'https://video.twimg.com/ext_tw_video/111/low.mp4',
      ], tweet_text: 'API B text' });
    const outer = entry();

    const result = convertAPIMediaToMediaInfo([quoted, outer], request,
      '<div>clicked outer DOM markup</div>');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: '222_api_0', tweetId: '111', tweetUsername: 'quoted_user',
      tweetUrl: 'https://x.com/quoted_user/status/111', tweetText: 'API B text',
      sourceLocation: 'quoted', quotedTweetId: '111', quotedUsername: 'quoted_user',
      quotedTweetUrl: 'https://x.com/quoted_user/status/111',
      metadata: { requestTweetId: '222', apiData: {
        tweet_id: '111', quoteParentTweetId: '222',
        videoVariantUrls: quoted.videoVariantUrls,
      } },
    });
    expect(result[0]).not.toHaveProperty('tweetTextContent');
    expect(result[1]).toMatchObject({
      id: '222_api_1', tweetId: '222', tweetUsername: 'outer',
      tweetUrl: 'https://x.com/outer/status/222', tweetText: 'API outer text',
      sourceLocation: 'original', metadata: { requestTweetId: '222' },
    });
    expect(result[1]).not.toHaveProperty('quotedTweetId');
  });

  it('rejects nonnumeric, cross-owner, and unbound quote entries', () => {
    const items = [
      entry({ tweet_id: 'not-numeric' }),
      entry({ tweet_id: '111', sourceLocation: 'original' }),
      entry({ tweet_id: '111', sourceLocation: 'quoted',
        quoteParentTweetId: '999', quotedTweetId: '111' }),
      entry({ tweet_id: '111', sourceLocation: 'quoted',
        quoteParentTweetId: '222', quotedTweetId: '333' }),
    ];
    expect(convertAPIMediaToMediaInfo(items, request)).toEqual([]);
  });

  it('uses a canonical i/status URL when the API owner handle is invalid', () => {
    const [result] = convertAPIMediaToMediaInfo([entry({ screen_name: 'bad/handle' })], request);
    expect(result).toMatchObject({ tweetId: '222', tweetUrl: 'https://x.com/i/status/222' });
    expect(result).not.toHaveProperty('tweetUsername');
  });
});
