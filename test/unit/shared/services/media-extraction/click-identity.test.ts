// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { TweetMediaEntry } from '@shared/services/media/types';
import type { TweetInfo } from '@shared/types/media.types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getTweetMedias = vi.hoisted(() => vi.fn());
vi.mock('@shared/services/media/twitter-api-client', () => ({ getTweetMedias }));
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';

const owner: TweetInfo = { tweetId: '222', username: 'author', tweetUrl: 'https://x.com/author/status/222', extractionMethod: 'test', confidence: 1 };
function photo(id: string, tweetId = '222'): TweetMediaEntry {
  return { tweet_id: tweetId, screen_name: 'author', type: 'photo', typeOriginal: 'photo', media_id: id, media_key: `3_${id}`, download_url: `https://pbs.twimg.com/media/${id}.jpg`, preview_url: `https://pbs.twimg.com/media/${id}.jpg`, index: 0, expanded_url: `https://x.com/author/status/${tweetId}/photo/1`, short_expanded_url: '', short_tweet_url: '', tweet_text: '' };
}

describe('API click-time identity', () => {
  beforeEach(() => { getTweetMedias.mockReset(); });
  afterEach(() => document.body.replaceChildren());

  it('does not arbitrarily select a first image when multiple owner items have no click URL', async () => {
    getTweetMedias.mockResolvedValue([photo('p1'), photo('p2'), photo('quote', '333')]);
    const result = await new TwitterAPIExtractor().extract(owner, document.createElement('img'), {}, 'missing');
    expect(result.success).toBe(false);
    expect(result.metadata?.strategy).toBe('api-media-ambiguous');
  });

  it('preserves the second image identity when the original node is reused during the request', async () => {
    let resolve!: (entries: TweetMediaEntry[]) => void;
    getTweetMedias.mockImplementation(() => new Promise<TweetMediaEntry[]>((done) => { resolve = done; }));
    document.body.innerHTML = '<a href="/author/status/222/photo/2"><img id="target" src="https://pbs.twimg.com/media/p2.jpg"></a>';
    const target = document.getElementById('target')!;
    const pending = new TwitterAPIExtractor().extract(owner, target, {}, 'delayed');
    target.setAttribute('src', 'https://pbs.twimg.com/media/p1.jpg');
    target.closest('a')!.href = '/other/status/333/photo/1';
    resolve([photo('p1'), photo('p2')]);
    const result = await pending;
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems[result.clickedIndex!]?.url).toContain('p2.jpg');
  });

  it('does not apply a numbered link to a filtered array with insufficient URL evidence', async () => {
    getTweetMedias.mockResolvedValue([photo('quote', '333'), { ...photo('removed'), download_url: 'https://evil.invalid/media.jpg' }, photo('p2')]);
    document.body.innerHTML = '<a href="/author/status/222/photo/2"><img id="target"></a>';
    const result = await new TwitterAPIExtractor().extract(owner, document.getElementById('target')!, {}, 'ordinal');
    expect(result.success).toBe(false);
  });
});
