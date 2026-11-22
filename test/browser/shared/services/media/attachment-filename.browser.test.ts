// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { convertAPIMediaToMediaInfo } from '@shared/services/media/media-factory';
import { extractMediaFromTweet } from '@shared/services/media/twitter-parser/twitter-response-parser';
import {
  captureClickedMediaEvidence,
  matchClickedMedia,
} from '@shared/services/media-extraction/determine-clicked-index';
import type { TwitterTweet } from '@shared/services/media/types';
import type { TweetInfo } from '@shared/types/media.types';
import { afterEach, describe, expect, it } from 'vite-plus/test';

const requested: TweetInfo = {
  tweetId: '111',
  username: 'alice',
  tweetUrl: 'https://x.com/alice/status/111',
  extractionMethod: 'fixture',
  confidence: 1,
};

function photo(ownerId: string, id: string, position: number) {
  return {
    type: 'photo' as const,
    id_str: id,
    media_url_https: `https://pbs.twimg.com/media/${id}.jpg`,
    expanded_url: `https://x.com/bob/status/${ownerId}/photo/${position}`,
  };
}

describe('owner-local attachment filenames', () => {
  afterEach(() => document.body.replaceChildren());

  it.each([
    '.jpg?name=small',
    '?format=jpg&name=medium',
    ':900x900?format=jpg',
    ':4096x4096?format=jpg',
  ])(
    'matches a direct quote photo through validated spelling %s without inventing ownership',
    (suffix) => {
      const image = document.createElement('img');
      image.src = `https://pbs.twimg.com/media/QuotePhoto${suffix}`;
      document.body.append(image);
      const evidence = {
        ...captureClickedMediaEvidence(image),
        ownership: {
          requestTweetId: '111',
          ownerTweetId: null,
          scope: 'clickable' as const,
        },
      };
      const items = [
        {
          type: 'image' as const,
          url: 'https://pbs.twimg.com/media/QuotePhoto.jpg',
          metadata: {
            apiData: {
              sourceLocation: 'quoted',
              tweet_id: '222',
              quotedTweetId: '222',
              quoteParentTweetId: '111',
            },
          },
        },
      ];
      expect(matchClickedMedia(evidence, items, '111')).toEqual({ status: 'matched', index: 0 });
      expect(
        matchClickedMedia(
          evidence,
          [{ ...items[0]!, url: 'https://pbs.twimg.com/media/QuotePhoto.png' }],
          '111'
        )
      ).toEqual({ status: 'contradictory', index: 0 });
      expect(matchClickedMedia(evidence, [items[0]!, items[0]!], '111')).toEqual({
        status: 'unknown',
        index: null,
      });
    }
  );
  it('retains an explicit owner position when an earlier API attachment is rejected', () => {
    const post: TwitterTweet = {
      rest_id: '111',
      extended_entities: {
        media: [
          { ...photo('111', 'bad', 1), media_url_https: 'https://evil.invalid/bad.jpg' },
          photo('111', 'second', 2),
        ],
      },
    };
    const media = convertAPIMediaToMediaInfo(
      extractMediaFromTweet(post, { screen_name: 'alice' }),
      requested
    );
    expect(media).toHaveLength(1);
    expect(generateMediaFilename(media[0]!)).toBe('alice_111_1.jpg');
  });

  it.each([
    'https://evil.invalid/alice/status/111/photo/9',
    'http://x.com/alice/status/111/photo/9',
    'https://x.com/alice/status/999/photo/9',
    'https://x.com/alice/status/111/photo/9/extra',
  ])(
    'does not borrow an API ordinal from an untrusted or conflicting permalink: %s',
    (expandedUrl) => {
      const post: TwitterTweet = {
        rest_id: '111',
        extended_entities: { media: [{ ...photo('111', 'A1', 9), expanded_url: expandedUrl }] },
      };
      const media = convertAPIMediaToMediaInfo(
        extractMediaFromTweet(post, { screen_name: 'alice' }),
        requested
      );
      expect(generateMediaFilename(media[0]!)).toBe('alice_111_0.jpg');
    }
  );
});
