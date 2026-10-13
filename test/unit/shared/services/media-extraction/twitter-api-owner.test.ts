// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { extractMediaFromTweet } from '@shared/services/media/twitter-parser/twitter-response-parser';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { TweetInfo } from '@shared/types/media.types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getTweetMedias = vi.hoisted(() => vi.fn());
vi.mock('@shared/services/media/twitter-api-client', () => {
  class TwitterAPIRequestError extends Error {
    readonly category = 'transport';
  }
  return {
    getTweetMedias,
    TwitterAPIRequestError,
    TweetMetadataRequestError: class extends TwitterAPIRequestError {},
    TweetMetadataReuse: class {
      async get(...args: Parameters<typeof getTweetMedias>) {
        return { entries: await getTweetMedias(...args), physicalRequestToken: {} };
      }
      invalidate() {}
      dispose() {}
    },
  };
});

import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';

const owner: TweetInfo = {
  tweetId: '222',
  username: 'main',
  tweetUrl: 'https://x.com/main/status/222',
  extractionMethod: 'dom-structure',
  confidence: 0.85,
};

function videoEntry(
  tweetId: string,
  mediaId: string,
  sourceLocation: 'original' | 'quoted'
): TweetMediaEntry {
  return {
    tweet_id: tweetId,
    screen_name: 'author',
    sourceLocation,
    ...(sourceLocation === 'quoted' ? { quoteParentTweetId: '222', quotedTweetId: tweetId } : {}),
    type: 'video',
    typeOriginal: 'video',
    media_id: mediaId,
    media_key: `7_${mediaId}`,
    download_url: `https://video.twimg.com/amplify_video/${mediaId}/vid/video-${mediaId}.mp4`,
    preview_url: `https://pbs.twimg.com/amplify_video_thumb/${mediaId}/img/poster-${mediaId}.jpg`,
    index: 0,
    expanded_url: `https://x.com/author/status/${tweetId}/video/1`,
    short_expanded_url: '',
    short_tweet_url: '',
    tweet_text: '',
  };
}

function target(kind: 'preview' | 'blob-player'): HTMLElement {
  document.body.innerHTML =
    kind === 'preview'
      ? '<div data-testid="tweetPhoto"><div data-testid="previewInterstitial"><img id="target"><button data-testid="playButton">Play</button></div></div>'
      : '<div data-testid="videoPlayer"><video id="target" src="blob:https://x.com/runtime-playback"></video></div>';
  return document.querySelector<HTMLElement>('#target')!;
}

describe('TwitterAPIExtractor weak-evidence owner selection', () => {
  beforeEach(() => getTweetMedias.mockReset());
  afterEach(() => document.body.replaceChildren());

  it('classifies the uniquely owned HLS attachment without making its poster playable', async () => {
    const entries = extractMediaFromTweet(
      {
        rest_id: '222',
        extended_entities: {
          media: [
            {
              type: 'video',
              id_str: '333',
              media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/333/img/poster.jpg',
              video_info: {
                variants: [
                  {
                    content_type: 'application/x-mpegURL',
                    url: 'https://video.twimg.com/ext_tw_video/333/pu/pl/playlist.m3u8',
                  },
                ],
              },
            },
          ],
        },
      },
      { screen_name: 'main' }
    );
    expect(entries[0]).toMatchObject({
      availability: 'unsupported-hls',
      download_url: '',
      videoVariantUrls: [],
    });
    getTweetMedias.mockResolvedValue(entries);
    const clicked = target('preview');
    clicked.setAttribute('src', entries[0]!.preview_url);
    const result = await new TwitterAPIExtractor().extract(owner, clicked, {}, 'unsupported');
    expect(result).toMatchObject({
      success: false,
      mediaItems: [],
      apiRequestOutcome: 'healthy',
      failureKind: 'unsupported-source',
      metadata: { strategy: 'api-media-unsupported' },
    });
  });

  it.each(['foreign', 'ambiguous', 'unresolved-quote'] as const)(
    'does not invent an HLS match for %s evidence',
    async (kind) => {
      const entry: TweetMediaEntry = {
        ...videoEntry(kind === 'foreign' ? '111' : '222', '333', 'original'),
        availability: 'unsupported-hls',
        download_url: '',
      };
      getTweetMedias.mockResolvedValue(
        kind === 'ambiguous' ? [entry, { ...entry, media_id: '444' }] : [entry]
      );
      const clicked = target('preview');
      clicked.setAttribute('src', entry.preview_url);
      const result = await new TwitterAPIExtractor().extract(
        owner,
        clicked,
        kind === 'unresolved-quote'
          ? {
              clickedMediaEvidence: {
                mediaType: 'video',
                sourceKey: null,
                urls: [],
                identityKeys: [],
                ownership: { requestTweetId: '222', ownerTweetId: null, scope: 'quoted' },
              },
            }
          : {},
        'unsupported-guard'
      );
      expect(result.success).toBe(false);
      expect(result.failureKind).toBe(kind === 'foreign' ? 'mismatch' : 'owner-unconfirmed');
    }
  );

  it.each(['preview', 'blob-player'] as const)(
    'rejects the sole quoted video for a URL-less %s',
    async (kind) => {
      getTweetMedias.mockResolvedValue([videoEntry('111', '444', 'quoted')]);
      const result = await new TwitterAPIExtractor().extract(owner, target(kind), {}, 'owner-test');
      expect(getTweetMedias).toHaveBeenCalledWith('222', undefined, undefined);
      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
    }
  );

  it('selects the sole compatible main video while retaining quote gallery content', async () => {
    getTweetMedias.mockResolvedValue([
      videoEntry('111', '444', 'quoted'),
      videoEntry('222', '333', 'original'),
    ]);
    const result = await new TwitterAPIExtractor().extract(
      owner,
      target('preview'),
      {},
      'owner-test'
    );
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems).toHaveLength(2);
    expect(result.mediaItems[0]?.metadata?.apiData).toMatchObject({ tweet_id: '111' });
    expect(result.mediaItems[1]?.metadata?.apiData).toMatchObject({ tweet_id: '222' });
    expect(result.metadata?.clickedMatch).toBe('unknown');
  });

  it.each(['', '111'])(
    'does not infer owner from the overwritten top-level ID when API owner=%s',
    async (apiOwner) => {
      getTweetMedias.mockResolvedValue([videoEntry(apiOwner, '444', 'original')]);
      const result = await new TwitterAPIExtractor().extract(
        owner,
        target('preview'),
        {},
        'owner-test'
      );
      expect(result.success).toBe(false);
    }
  );

  it('keeps multiple same-owner URL-less videos ambiguous', async () => {
    getTweetMedias.mockResolvedValue([
      videoEntry('222', '333', 'original'),
      videoEntry('222', '555', 'original'),
    ]);
    const result = await new TwitterAPIExtractor().extract(
      owner,
      target('preview'),
      {},
      'owner-test'
    );
    expect(result.success).toBe(false);
    expect(result.metadata?.strategy).toBe('api-media-ambiguous');
  });

  it('allows a correctly resolved quote owner with weak URL evidence', async () => {
    const quoteOwner = { ...owner, tweetId: '111', tweetUrl: 'https://x.com/quote/status/111' };
    getTweetMedias.mockResolvedValue([videoEntry('111', '444', 'original')]);
    const result = await new TwitterAPIExtractor().extract(
      quoteOwner,
      target('preview'),
      {},
      'owner-test'
    );
    expect(getTweetMedias).toHaveBeenCalledWith('111', undefined, undefined);
    expect(result.success).toBe(true);
    expect(result.mediaItems[0]?.metadata?.apiData).toMatchObject({ tweet_id: '111' });
  });
});
