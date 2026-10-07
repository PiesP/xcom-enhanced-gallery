// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { TwitterMedia, TwitterTweet } from '@shared/services/media/types';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { captureClickedMediaEvidence } from '@shared/services/media-extraction/determine-clicked-index';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const httpGet = vi.hoisted(() => vi.fn());
vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));
vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({
  getCsrfTokenAsync: vi.fn(async () => 'fixture'),
  resolveBearerToken: vi.fn(() => 'Bearer fixture'),
}));

const poster = (id: string): string =>
  `https://pbs.twimg.com/amplify_video_thumb/${id}/img/poster.jpg`;
const source = (id: string): string =>
  `https://video.twimg.com/amplify_video/${id}/vid/clip.mp4`;
function video(id: string): TwitterMedia {
  return {
    type: 'video', id_str: id, media_url_https: poster(id),
    original_info: { width: 320, height: 180 },
    video_info: { variants: [{ content_type: 'video/mp4', bitrate: 100, url: source(id) }] },
  };
}
function tweet(id: string, medias: TwitterMedia[] = [], quoted?: TwitterTweet,
  username = `author_${id}`): TwitterTweet {
  return {
    rest_id: id,
    core: { user_results: { result: { legacy: { screen_name: username } } } },
    legacy: { id_str: id, full_text: `Post ${id}`, extended_entities: { media: medias } },
    ...(quoted ? { quoted_status_result: { result: quoted } } : {}),
  };
}
function response(value: TwitterTweet) {
  return { ok: true, status: 200, data: { data: { tweetResult: { result: value } } } };
}
function requestedId(url: string): string {
  return JSON.parse(new URL(url).searchParams.get('variables')!).tweetId;
}
function nestedTarget(boundary = 'role="link"'): HTMLVideoElement {
  document.body.innerHTML = `<article id="outer">
    <a href="/author_222/status/222">A header without TIME</a>
    <a href="/author_222/status/222">A permalink without TIME</a>
    <div id="boundary" ${boundary}><article id="inner">
      <div><a href="/author_111/status/111">B header without TIME</a></div>
      <div id="player"><a id="credit" href="/author_333/status/333">C credit without TIME</a>
        <video id="target" src="blob:https://x.com/nested" poster="${poster('700')}"></video>
      </div>
    </article></div>
  </article>`;
  return document.querySelector<HTMLVideoElement>('#target')!;
}

describe('nested quote request context with separate header and credit links', () => {
  beforeEach(() => {
    httpGet.mockReset();
    // A lookup exposes direct B; querying the unrelated credit C exposes only C.
    httpGet.mockImplementation(async (url: string) => response(requestedId(url) === '222'
      ? tweet('222', [], tweet('111', [video('700')], tweet('333', [video('900')])))
      : tweet(requestedId(url), [video(requestedId(url) === '111' ? '700' : '900')])));
  });
  afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

  it('keeps a narrow non-enclosing credit link out of confirmed ownership', () => {
    const target = nestedTarget();
    const extractor = new TweetInfoExtractor();
    expect(extractor.extract(target)?.tweetId).toBe('333');
    expect(extractor.extractContext(target)).toMatchObject({
      tweetInfo: { tweetId: '222', extractionMethod: 'request-context' },
      ownership: { requestTweetId: '222', ownerTweetId: null, scope: 'clickable' },
    });
  });

  it('queries A and selects direct B by exact media identity, despite a nearer C credit', async () => {
    const result = await new MediaExtractionService().extractFromClickedElement(nestedTarget());
    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('222');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]).toMatchObject({
      tweetId: '111', tweetUsername: 'author_111', tweetText: 'Post 111', url: source('700'),
      metadata: { apiData: { tweet_id: '111', quoteParentTweetId: '222', quotedTweetId: '111' } },
    });
    expect(result.mediaItems.some((media) => media.tweetId === '333')).toBe(false);
  });

  it('combines preplayer thumbnail capture with nested header/credit ambiguity recovery', async () => {
    const target = nestedTarget();
    target.outerHTML = `<div>
      <img src="https://pbs.twimg.com/profile_images/1/avatar-b.jpg">
      <img src="https://pbs.twimg.com/profile_images/2/avatar-c.jpg">
      <img src="${poster('700')}">
      <div><button id="target">Native play</button></div>
    </div>`;
    const button = document.getElementById('target')!;
    expect(captureClickedMediaEvidence(button)).toMatchObject({
      mediaType: 'video', sourceKey: null, invalidSource: false,
      identityKeys: ['pbs.twimg.com/amplify_video_thumb/700/img/poster.jpg'],
    });
    const result = await new MediaExtractionService().extractFromClickedElement(button);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('222');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]).toMatchObject({ tweetId: '111', url: source('700') });
  });

  it('runs the exact installed preplayer HTML through production context and media extraction', async () => {
    document.body.innerHTML = readFileSync(resolve(process.cwd(),
      'test/e2e/fixtures/installed-public-preplayer-page.html'), 'utf8');
    const button = document.querySelector<HTMLButtonElement>('[data-preplayer-media] button')!;
    const outer = '8555555555555555555';
    const owner = '9555555555555555555';
    const credit = '7555555555555555555';
    const thumbnail = `https://pbs.twimg.com/ext_tw_video_thumb/${owner}/pu/img/quote-two.jpg`;
    const playable = `https://video.twimg.com/ext_tw_video/${owner}/pu/vid/320x180/quote-two.mp4`;
    const apiVideo: TwitterMedia = { ...video(owner), media_url_https: thumbnail,
      video_info: { variants: [{ content_type: 'video/mp4', bitrate: 100, url: playable }] } };
    httpGet.mockResolvedValue(response(tweet(outer, [], tweet(owner, [
      { type: 'photo', id_str: '600', media_url_https: 'https://pbs.twimg.com/media/QPreplayerPhoto.jpg' },
      apiVideo,
    ], tweet(credit, [video('900')], undefined, 'credit_preplay'), 'quote_preplayer'), 'outer_preplayer')));
    expect(new TweetInfoExtractor().extractContext(button)?.ownership).toEqual({
      requestTweetId: outer, ownerTweetId: null, scope: 'clickable',
    });
    expect(captureClickedMediaEvidence(button).identityKeys).toEqual([
      `pbs.twimg.com/ext_tw_video_thumb/${owner}/pu/img/quote-two.jpg`,
    ]);
    const result = await new MediaExtractionService().extractFromClickedElement(button);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe(outer);
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems[result.clickedIndex!]).toMatchObject({
      tweetId: owner, tweetUsername: 'quote_preplayer', url: playable,
      metadata: { apiData: { tweet_id: owner, quoteParentTweetId: outer, quotedTweetId: owner } },
    });
    expect(result.mediaItems.some((media) => media.tweetId === credit)).toBe(false);
  });

  it('counts a same-article B header even inside its own clickable branch', async () => {
    const target = nestedTarget();
    document.querySelector('#inner > div')!.setAttribute('role', 'link');
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('222');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.tweetId).toBe('111');
  });

  it('keeps a generic inner clickable player out of confirmed credit ownership', async () => {
    const target = nestedTarget();
    document.querySelector('#player')!.setAttribute('role', 'link');
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('222');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.tweetId).toBe('111');
  });

  it('retains a marked inner quote with one explicit own permalink', async () => {
    const target = nestedTarget();
    target.poster = poster('900');
    document.querySelector('#player')!.setAttribute('data-testid', 'quoteTweet');
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('333');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.tweetId).toBe('333');
  });

  it('refuses a marked inner quote with another ID hidden in a clickable branch', async () => {
    const target = nestedTarget();
    document.querySelector('#player')!.setAttribute('data-testid', 'quoteTweet');
    document.querySelector('#player')!.insertAdjacentHTML('afterbegin',
      '<div role="link"><a href="/other/status/444">Another quote status</a></div>');
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(result.success).toBe(false);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('preserves an enclosing B permalink as explicit ownership', async () => {
    const target = nestedTarget();
    const link = document.createElement('a');
    link.href = '/author_111/status/111/video/1';
    target.replaceWith(link);
    link.append(target);
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('111');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.tweetId).toBe('111');
  });

  it('preserves a nonnested quote branch with its own unambiguous B permalink', () => {
    document.body.innerHTML = `<article><a href="/author_222/status/222">A header</a>
      <div><a href="/author_111/status/111">B permalink</a>
        <video id="target" poster="${poster('700')}"></video>
      </div></article>`;
    expect(new TweetInfoExtractor().extractContext(document.getElementById('target')!)).toMatchObject({
      ownership: { requestTweetId: '111', ownerTweetId: '111', scope: 'owned' },
    });
  });

  it.each(['', 'data-testid="card.wrapper"', 'data-testid="reply"'])(
    'refuses to borrow parent A through a nonquote boundary: %s', async (boundary) => {
      const result = await new MediaExtractionService().extractFromClickedElement(nestedTarget(boundary));
      expect(result.success).toBe(false);
      expect(httpGet).not.toHaveBeenCalled();
    }
  );

  it('refuses distinct parent IDs even when only one parent anchor has TIME', async () => {
    const target = nestedTarget();
    document.querySelector('#outer > a')!.innerHTML = '<time>A</time>';
    document.querySelector('#outer > a')!.insertAdjacentHTML('afterend', '<a href="/other/status/444">Other</a>');
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(result.success).toBe(false);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it.each([
    '<div role="link"><a href="/other/status/444">Other branch</a></div>',
    '<div><a href="/other/status/444">Other attachment</a><img src="https://pbs.twimg.com/media/other.jpg"></div>',
    '<a href="https://evil.example/other/status/444">Foreign parent link</a>',
  ])('refuses ambiguous or invalid parent links outside the quote: %s', async (extra) => {
    const target = nestedTarget();
    document.querySelector('#outer > a')!.insertAdjacentHTML('afterend', extra);
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(result.success).toBe(false);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it.each(['https://evil.example/author_333/status/333', 'https://x.com.attacker.example/author_333/status/333'])(
    'refuses a foreign nested credit: %s', async (href) => {
      const target = nestedTarget();
      document.querySelector('#credit')!.setAttribute('href', href);
      const result = await new MediaExtractionService().extractFromClickedElement(target);
      expect(result.success).toBe(false);
      expect(httpGet).not.toHaveBeenCalled();
    }
  );

  it('refuses a provider root that differs from the bounded A request', async () => {
    httpGet.mockResolvedValue(response(tweet('333', [video('700')])));
    const result = await new MediaExtractionService().extractFromClickedElement(nestedTarget());
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('222');
    expect(result.success).toBe(false);
  });

  it('refuses the same exact source attached to both A and direct B', async () => {
    httpGet.mockResolvedValue(response(tweet('222', [video('700')], tweet('111', [video('700')]))));
    const result = await new MediaExtractionService().extractFromClickedElement(nestedTarget());
    expect(result.success).toBe(false);
    expect(result.metadata?.strategy).toBe('api-media-ambiguous');
  });

  it('does not turn the nested request-only ID into DOM ownership after provider rejection', async () => {
    const target = nestedTarget();
    target.src = source('700');
    httpGet.mockResolvedValue({ ok: false, status: 403, data: {} });
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
    expect(requestedId(httpGet.mock.calls[0]![0])).toBe('222');
  });

  it('requires direct immutable media evidence even with a unique untimed A request', async () => {
    const target = nestedTarget();
    target.removeAttribute('poster');
    const result = await new MediaExtractionService().extractFromClickedElement(target);
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
  });
});
