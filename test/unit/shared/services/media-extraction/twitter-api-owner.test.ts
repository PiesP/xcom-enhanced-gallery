// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { TweetMediaEntry } from '@shared/services/media/types';
import type { TweetInfo } from '@shared/types/media.types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getTweetMedias = vi.hoisted(() => vi.fn());
vi.mock('@shared/services/media/twitter-api-client', () => ({ getTweetMedias }));

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
