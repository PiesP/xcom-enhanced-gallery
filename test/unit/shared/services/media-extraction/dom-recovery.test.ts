// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DOMFallbackExtractor } from '@shared/services/media-extraction/extractors/dom-fallback-extractor';
import { captureClickedMediaEvidence } from '@shared/services/media-extraction/determine-clicked-index';
import { findMediaElementInDOM, selectMediaSourceUrl } from '@shared/utils/media/media-element-utils';
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

  it('resolves the uniquely owned video from the actual deep X overlay click', () => {
    document.body.innerHTML = readFileSync(
      resolve('test/fixtures/authenticated-x-layouts/video-deep-overlay.html'),
      'utf8'
    );
    const target = document.querySelector<HTMLElement>('[data-capture-event-target="true"]');
    const player = target?.closest('[data-testid="videoPlayer"]');
    const video = player?.querySelector('video');
    expect(target).not.toBeNull();
    expect(player).not.toBeNull();
    expect(video).not.toBeNull();
    expect(findMediaElementInDOM(target!)).toBe(video);
    const evidence = captureClickedMediaEvidence(target!);
    expect(evidence.mediaType).toBe('video');
    expect(evidence.urls).toContain('media-901');
    expect(evidence.sourceKey).toBeNull();
  });

  it('does not choose between two videos in the captured click player', () => {
    document.body.innerHTML = readFileSync(
      resolve('test/fixtures/authenticated-x-layouts/video-deep-overlay.html'),
      'utf8'
    );
    const target = document.querySelector<HTMLElement>('[data-capture-event-target="true"]')!;
    const player = target.closest<HTMLElement>('[data-testid="videoPlayer"]')!;
    const second = document.createElement('video');
    second.src = 'blob:https://x.com/another-video';
    player.append(second);
    expect(findMediaElementInDOM(target)).toBeNull();
    expect(captureClickedMediaEvidence(target).mediaType).toBeNull();
  });

  it('keeps adjacent and nested players outside the clicked player ownership', () => {
    document.body.innerHTML = readFileSync(
      resolve('test/fixtures/authenticated-x-layouts/video-deep-overlay.html'),
      'utf8'
    );
    const target = document.querySelector<HTMLElement>('[data-capture-event-target="true"]')!;
    const player = target.closest<HTMLElement>('[data-testid="videoPlayer"]')!;
    const ownedVideo = player.querySelector('video')!;

    const adjacent = document.createElement('div');
    adjacent.dataset.testid = 'videoPlayer';
    adjacent.innerHTML = '<video src="blob:https://x.com/adjacent-video"></video>';
    player.after(adjacent);

    const nested = document.createElement('div');
    nested.dataset.testid = 'videoPlayer';
    nested.innerHTML = '<div data-nested-click></div><video src="blob:https://x.com/nested-video"></video>';
    player.append(nested);

    expect(findMediaElementInDOM(target)).toBe(ownedVideo);
    expect(findMediaElementInDOM(nested.querySelector<HTMLElement>('[data-nested-click]')!)).toBe(
      nested.querySelector('video')
    );
    expect(findMediaElementInDOM(adjacent)).toBe(adjacent.querySelector('video'));
  });

  it('keeps the explicit player video lookup within the descendant depth bound', () => {
    document.body.innerHTML = readFileSync(
      resolve('test/fixtures/authenticated-x-layouts/video-deep-overlay.html'),
      'utf8'
    );
    const target = document.querySelector<HTMLElement>('[data-capture-event-target="true"]')!;
    expect(findMediaElementInDOM(target, { maxAncestorHops: 0 })).toBeNull();
    expect(findMediaElementInDOM(target, { maxAncestorHops: 7 })).toBe(
      target.closest('[data-testid="videoPlayer"]')?.querySelector('video')
    );
    expect(findMediaElementInDOM(target, { maxDescendantDepth: 5 })).toBeNull();
    expect(findMediaElementInDOM(target, { maxDescendantDepth: 6 })).toBe(
      target.closest('[data-testid="videoPlayer"]')?.querySelector('video')
    );
  });

  it('does not search more than twelve ancestors for an explicit player', () => {
    const player = document.createElement('div');
    player.dataset.testid = 'videoPlayer';
    const video = document.createElement('video');
    player.append(video);
    let branch: HTMLElement = player;
    for (let i = 0; i < 13; i++) {
      const wrapper = document.createElement('div');
      branch.append(wrapper);
      branch = wrapper;
    }
    const target = document.createElement('div');
    branch.append(target);
    document.body.append(player);
    expect(target.closest('[data-testid="videoPlayer"]')).toBe(player);
    expect(findMediaElementInDOM(target)).toBeNull();
  });

  it.each([true, false])('does not accept image replacement through a retained background (background: %s)', async (background) => {
    document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><div data-testid="tweetPhoto" ${background ? 'style="background-image: url(https://pbs.twimg.com/media/review-A.jpg)"' : ''}><img id="target" src="https://pbs.twimg.com/media/review-A.jpg"></div></article>`;
    const target = document.getElementById('target')!;
    const owner = new TweetInfoExtractor().extract(target)!;
    const clickedMediaEvidence = captureClickedMediaEvidence(target);
    target.setAttribute('src', 'https://pbs.twimg.com/media/review-B.jpg');
    const result = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence }, 'replaced');
    expect(result.success).toBe(false);
  });

  it('recovers an unchanged image with a matching background', async () => {
    document.body.innerHTML = '<article><a href="/author/status/222"><time>Now</time></a><div style="background-image: url(https://pbs.twimg.com/media/review-A.jpg)"><img id="target" src="https://pbs.twimg.com/media/review-A.jpg"></div></article>';
    const target = document.getElementById('target')!;
    const owner = new TweetInfoExtractor().extract(target)!;
    const result = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence: captureClickedMediaEvidence(target) }, 'unchanged');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.url).toBe('https://pbs.twimg.com/media/review-A.jpg');
  });

  it.each([false, true])('recovers only an unchanged single child source (mutated: %s)', async (mutated) => {
    document.body.innerHTML = '<article><a href="/author/status/222"><time>Now</time></a><video id="target" preload="none"><source src="https://video.twimg.com/ext_tw_video/222/pu/vid/review-A.mp4" type="video/mp4"></video></article>';
    const target = document.getElementById('target')!;
    expect((target as HTMLVideoElement).currentSrc).toBe('');
    const owner = new TweetInfoExtractor().extract(target)!;
    const clickedMediaEvidence = captureClickedMediaEvidence(target);
    if (mutated) target.querySelector('source')!.src = 'https://video.twimg.com/ext_tw_video/222/pu/vid/review-B.mp4';
    const result = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence }, 'child-source');
    expect(result.success).toBe(!mutated);
    if (!mutated) expect(result.mediaItems[result.clickedIndex!]?.url).toContain('review-A.mp4');
  });

  it.each(['https://video.twimg.com/ext_tw_video/222/pu/vid/review-B.mp4', 'https://evil.invalid/review-B.mp4'])('rejects multiple unresolved child video sources, including %s', async (secondSource) => {
    document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><video id="target" preload="none"><source src="https://video.twimg.com/ext_tw_video/222/pu/vid/review-A.mp4"><source src="${secondSource}"></video></article>`;
    const target = document.getElementById('target')!;
    const owner = new TweetInfoExtractor().extract(target)!;
    const result = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence: captureClickedMediaEvidence(target) }, 'ambiguous-sources');
    expect(result.success).toBe(false);
  });

  it('keeps video currentSrc precedence and rejects replacement despite a retained poster', async () => {
    document.body.innerHTML = '<article><a href="/author/status/222"><time>Now</time></a><video id="target" src="https://video.twimg.com/ext_tw_video/222/pu/vid/review-B.mp4" poster="https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/poster-A.jpg"></video></article>';
    const target = document.getElementById('target') as HTMLVideoElement;
    let current = 'https://video.twimg.com/ext_tw_video/222/pu/vid/review-A.mp4';
    Object.defineProperty(target, 'currentSrc', { get: () => current });
    const owner = new TweetInfoExtractor().extract(target)!;
    const clickedMediaEvidence = captureClickedMediaEvidence(target);
    const unchanged = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence }, 'video-primary-source');
    expect(unchanged.success).toBe(true);
    expect(unchanged.mediaItems[unchanged.clickedIndex!]?.url).toBe(current);
    current = target.src;
    const changed = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence }, 'video-replaced-source');
    expect(changed.success).toBe(false);
  });

  it('keeps video identity when currentSrc initializes to its unchanged child source', async () => {
    document.body.innerHTML = '<article><a href="/author/status/222"><time>Now</time></a><video id="target" preload="none"><source src="https://video.twimg.com/ext_tw_video/222/pu/vid/review-A.mp4"></video></article>';
    const target = document.getElementById('target') as HTMLVideoElement;
    const owner = new TweetInfoExtractor().extract(target)!;
    const clickedMediaEvidence = captureClickedMediaEvidence(target);
    Object.defineProperty(target, 'currentSrc', { configurable: true, get: () => 'https://video.twimg.com/ext_tw_video/222/pu/vid/review-A.mp4' });
    const result = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence }, 'initialized-current-source');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.url).toContain('review-A.mp4');
  });

  it('uses currentSrc ahead of a conflicting src and refuses a different selected source', async () => {
    document.body.innerHTML = '<article><a href="/author/status/222"><time>Now</time></a><img id="target" src="https://pbs.twimg.com/media/review-B.jpg"></article>';
    const target = document.getElementById('target') as HTMLImageElement;
    let current = 'https://pbs.twimg.com/media/review-A.jpg?name=small';
    Object.defineProperty(target, 'currentSrc', { configurable: true, get: () => current });
    const owner = new TweetInfoExtractor().extract(target)!;
    const clickedMediaEvidence = captureClickedMediaEvidence(target);
    expect(selectMediaSourceUrl(target)).toBe(current);
    current = 'https://pbs.twimg.com/media/review-A?format=jpg&name=orig';
    const variant = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence }, 'variant');
    expect(variant.success).toBe(true);
    expect(variant.mediaItems[variant.clickedIndex!]?.url).toBe(current);
    current = 'https://pbs.twimg.com/media/review-B.jpg';
    const changed = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence }, 'different-current');
    expect(changed.success).toBe(false);
  });

  it.each([
    '<source src="https://evil.invalid/review-A.mp4">',
    '<source src="blob:https://x.com/review-A">',
    '',
  ])('rejects child-source video without a trusted original: %s', async (source) => {
    document.body.innerHTML = `<article><a href="/author/status/222"><time>Now</time></a><video id="target" poster="https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/poster.jpg">${source}</video></article>`;
    const target = document.getElementById('target')!;
    const owner = new TweetInfoExtractor().extract(target)!;
    const result = await new DOMFallbackExtractor().extract(owner, target, { clickedMediaEvidence: captureClickedMediaEvidence(target) }, 'untrusted-source');
    expect(result.success).toBe(false);
  });
});
