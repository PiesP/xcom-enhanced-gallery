// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { planBulkDownload } from '@shared/core/download/download-plan';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import { LiveByteBudget } from '@shared/services/download/live-byte-budget';
import { convertAPIMediaToMediaInfo } from '@shared/services/media/media-factory';
import { extractMediaFromTweet } from '@shared/services/media/twitter-parser/twitter-response-parser';
import type { TwitterMedia } from '@shared/services/media/types';
import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import type { TweetInfo } from '@shared/types/media.types';
import { afterEach, describe, expect, it, vi } from 'vitest';

const owner: TweetInfo = {
  tweetId: '222',
  username: 'author',
  tweetUrl: 'https://x.com/author/status/222',
  extractionMethod: 'fixture',
  confidence: 1,
};
const small = 'https://pbs.twimg.com/media/EXAMPLE?format=jpg&name=small';
const original = 'https://pbs.twimg.com/media/EXAMPLE?format=jpg&name=orig';

describe('canonical media source contract', () => {
  afterEach(() => document.body.replaceChildren());

  it('saves the CDN original for an API query-format photo', () => {
    const photo: TwitterMedia = { type: 'photo', id_str: '100', media_url_https: small };
    const entries = extractMediaFromTweet(
      { rest_id: '222', extended_entities: { media: [photo] } },
      { screen_name: 'author' }
    );
    const media = convertAPIMediaToMediaInfo(entries, owner);
    expect(planBulkDownload({ mediaItems: media }).items[0]?.url).toBe(original);
  });

  it('preserves the observed DOM display while planning an original-size download', async () => {
    document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><div data-testid="tweetPhoto"><img id="target" src="${small}"></div></article>`;
    const result = await new DOMFallbackExtractor().extract(
      owner,
      document.getElementById('target')!,
      {},
      'source-contract'
    );
    expect(result.success).toBe(true);
    expect(result.mediaItems[0]?.url).toBe(small);
    expect(result.mediaItems[0]?.originalUrl).toBe(original);
    expect(planBulkDownload({ mediaItems: result.mediaItems }).items[0]?.url).toBe(original);
  });

  it('does not borrow cached display bytes for the canonical save source or start planning I/O', () => {
    const budget = new LiveByteBudget(8);
    const thumbnail = { value: new Blob(['small']), lease: budget.reserve(5) };
    const provider = vi.fn();
    const media = { id: '222_api_1', type: 'image' as const, url: small, tweetId: '222', tweetUsername: 'author',
      downloadSource: { url: original.replace('format=jpg', 'format=png'), quality: 'cdn-original' as const, provenance: 'dom' as const } };
    const plan = planBulkDownload({ mediaItems: [media], cachedBlobs: new Map([[small, thumbnail]]), mediaBlobProvider: provider });
    expect(plan.items[0]?.blob).toBeUndefined();
    expect(provider).not.toHaveBeenCalled();
    expect(plan.items[0]?.url).toBe(media.downloadSource.url);
    expect(generateMediaFilename(media)).toBe('author_222_1.png');
    thumbnail.lease.release();
    expect(budget.usedBytes).toBe(0);
  });

  it('keeps an unverified API photo visible without planning a smaller replacement save', () => {
    const observed = `${small}&name=large`;
    const entries = extractMediaFromTweet(
      { rest_id: '222', extended_entities: { media: [{ type: 'photo', id_str: '100', media_url_https: observed }] } },
      { screen_name: 'author' }
    );
    const media = convertAPIMediaToMediaInfo(entries, owner);
    expect(media[0]?.url).toBe(observed);
    expect(media[0]?.downloadSource).toEqual({ url: '', quality: 'unverified-original', provenance: 'api' });
    expect(planBulkDownload({ mediaItems: media }).items[0]).toMatchObject({ url: '', sourceUnavailable: true });
  });

  it('keeps an unverified DOM photo visible without authorizing its observed-size download', async () => {
    const observed = `${small}&name=large`;
    document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><div data-testid="tweetPhoto"><img id="target" src="${observed}"></div></article>`;
    const result = await new DOMFallbackExtractor().extract(owner, document.getElementById('target')!, {}, 'unverified-source');
    expect(result.success).toBe(true);
    expect(result.mediaItems[0]?.url).toBe(observed);
    expect(result.mediaItems[0]?.downloadSource).toEqual({ url: '', quality: 'unverified-original', provenance: 'dom' });
    expect(planBulkDownload({ mediaItems: result.mediaItems }).items[0]).toMatchObject({ url: '', sourceUnavailable: true });
  });

  it('retains typed best-first video variants without inventing bitrate or dimensions', () => {
    const variants = [
      { content_type: 'video/mp4', bitrate: 100, url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/320x180/best.mp4' },
      { content_type: 'video/mp4', bitrate: 100, url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/tie.mp4' },
      { content_type: 'video/mp4', bitrate: 200, url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/tie.mp4' },
      { content_type: 'video/mp4', bitrate: -1, url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/missing.mp4?metadata=/999x999/' },
    ];
    const entries = extractMediaFromTweet({ rest_id: '222', extended_entities: { media: [{ type: 'animated_gif', id_str: '100', media_url_https: 'https://pbs.twimg.com/tweet_video_thumb/100.jpg', video_info: { variants } }] } }, { screen_name: 'author' });
    expect(entries[0]?.typeOriginal).toBe('animated_gif');
    expect(entries[0]?.videoVariants).toEqual([
      { url: variants[0]!.url, contentType: 'video/mp4', bitrate: 100, width: 320, height: 180 },
      { url: variants[1]!.url, contentType: 'video/mp4', bitrate: 100 },
      { url: variants[3]!.url, contentType: 'video/mp4' },
    ]);
    const media = convertAPIMediaToMediaInfo(entries, owner)[0];
    expect(media?.url).toBe(variants[0]!.url);
    expect(media?.downloadSource).toEqual({ url: variants[0]!.url, provenance: 'api', quality: 'best-mp4' });
    expect(media?.videoVariants).toBe(entries[0]?.videoVariants);
  });
});
