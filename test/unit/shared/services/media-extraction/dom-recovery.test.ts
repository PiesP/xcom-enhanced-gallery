// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { afterEach, describe, expect, it } from 'vitest';

// Source-derived synthetic markup; not an authenticated X DOM capture.
const photo = (id: string): string => `<img id="${id}" src="https://pbs.twimg.com/media/${id}.jpg">`;
const video = (id: string): string => `<video id="${id}" src="https://video.twimg.com/ext_tw_video/900/pu/vid/${id}.mp4"></video>`;

async function recover(id: string) {
  const target = document.getElementById(id)!;
  const owner = new TweetInfoExtractor().extract(target)!;
  expect(owner?.tweetId).toBe('222');
  return new DOMFallbackExtractor().extract(owner, target, {}, 'dom-regression');
}

describe('scoped DOM recovery', () => {
  afterEach(() => document.body.replaceChildren());

  it('preserves interleaved document order and the clicked item', async () => {
    document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><div>${video('v1')}${photo('p1')}${video('v2')}${photo('p2')}</div></article>`;
    const result = await recover('v2');
    expect(result.success).toBe(true);
    expect(result.mediaItems.map((item) => item.type)).toEqual(['video', 'image', 'video', 'image']);
    expect(result.clickedIndex).toBe(2);
    expect(result.mediaItems[result.clickedIndex!]?.url).toContain('v2.mp4');
  });

  it('recovers only the trusted article-less tile with explicit partial scope', async () => {
    document.body.innerHTML = `<div><a href="/author/status/222/photo/2">${photo('selected')}</a><a href="/other/status/333/photo/1">${photo('neighbor')}</a></div>`;
    const result = await recover('selected');
    expect(result.success).toBe(true);
    expect(result.mediaItems).toHaveLength(1);
    expect(result.mediaItems[0]?.url).toContain('selected.jpg');
    expect(result.metadata?.recoveryScope).toBe('visible-tile');
  });

  it('preserves the second photo in plain articles with sibling overlays', async () => {
    document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><div>${photo('first')}<a href="/author/status/222/photo/1"></a></div><div>${photo('second')}<a href="/author/status/222/photo/2"></a></div></article>`;
    const result = await recover('second');
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
  });

  it.each(['https://x.com.evil.invalid/a/status/222/photo/1', '/author/status/333/photo/1'])(
    'rejects absent or conflicting ownership for %s', async (href) => {
      document.body.innerHTML = `<a href="${href}">${photo('target')}</a>`;
      const result = await new DOMFallbackExtractor().extract({ tweetId: '222', username: 'author', tweetUrl: 'https://x.com/author/status/222', extractionMethod: 'test', confidence: 1 }, document.getElementById('target')!, {}, 'guard');
      expect(result.success).toBe(false);
    }
  );

  it('never turns a blob-only video into another photo', async () => {
    document.body.innerHTML = `<a href="/author/status/222/video/1"><video id="target" src="blob:https://x.com/playback" poster="https://pbs.twimg.com/ext_tw_video_thumb/900/pu/img/poster.jpg"></video>${photo('other')}</a>`;
    const result = await recover('target');
    expect(result.success).toBe(false);
  });
});
