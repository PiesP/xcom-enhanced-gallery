// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import type { TwitterMedia, TwitterTweet } from '@shared/services/media/types';
import { getTweetMedias } from '@shared/services/media/twitter-api-client';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const httpGet = vi.hoisted(() => vi.fn());
const settings = vi.hoisted(() => ({ mode: 'allow-all' }));
vi.mock('@shared/container/settings-registry', () => ({
  tryGetSettings: () => ({}), getTypedSettingOr: () => settings.mode,
}));
vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));
vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({
  getCsrfTokenAsync: vi.fn(async () => 'fixture'),
  resolveBearerToken: vi.fn(() => 'Bearer fixture'),
}));

const poster = (id: string): string => `https://pbs.twimg.com/amplify_video_thumb/${id}/img/poster.jpg`;
const source = (id: string): string => `https://video.twimg.com/amplify_video/${id}/vid/clip.mp4`;
function video(id: string): TwitterMedia {
  return {
    type: 'video', id_str: id, media_url_https: poster(id),
    original_info: { width: 320, height: 180 },
    video_info: { variants: [{ content_type: 'video/mp4', bitrate: 100, url: source(id) }] },
  };
}
function tweet(id: string, medias: TwitterMedia[] = [], quoted?: TwitterTweet): TwitterTweet {
  return {
    rest_id: id,
    core: { user_results: { result: { legacy: { screen_name: `author_${id}` } } } },
    legacy: { id_str: id, full_text: `Post ${id}`, extended_entities: { media: medias } },
    ...(quoted ? { quoted_status_result: { result: quoted } } : {}),
  };
}
function respond(value: TwitterTweet): void {
  httpGet.mockResolvedValue({ ok: true, status: 200, data: { data: { tweetResult: { result: value } } } });
}
function target(scope = 'quote', link = false, kind = 'blob'): HTMLElement {
  const attributes = scope === 'quote' ? 'data-testid="quoteTweet" role="link"'
    : scope === 'unmarked' ? 'role="link" tabindex="0"' : '';
  const media = kind === 'preview'
    ? `<div data-testid="tweetPhoto"><div data-testid="previewInterstitial"><img id="target" src="${poster('700')}"><button data-testid="playButton">Play</button></div></div>`
    : `<div data-testid="videoPlayer"><video id="target" src="blob:https://x.com/fixture" poster="${poster('700')}"></video></div>`;
  document.body.innerHTML = `<article><a href="/author_222/status/222"><time>Now</time></a><div ${attributes}>${link ? '<a href="/author_111/status/111"><time>Quote</time></a>' : ''}${media}</div></article>`;
  return document.getElementById('target')!;
}
function requestedId(): string {
  return JSON.parse(new URL(httpGet.mock.calls.at(-1)?.[0] as string).searchParams.get('variables')!).tweetId;
}

describe('production quoted-video pipeline', () => {
  beforeEach(() => { settings.mode = 'allow-all'; httpGet.mockReset(); respond(tweet('222', [], tweet('111', [video('700')]))); });
  afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

  it.each(['quote', 'unmarked'])(
    'recovers a linkless %s video only from the queried direct quote and exact source', async (scope) => {
      const result = await new MediaExtractionService().extractFromClickedElement(target(scope));
      expect(requestedId()).toBe('222');
      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(0);
      expect(result.tweetInfo?.tweetId).toBe('222');
      expect(result.mediaItems[0]).toMatchObject({
        url: source('700'), type: 'video', tweetId: '111', tweetUsername: 'author_111',
        tweetText: 'Post 111', sourceLocation: 'quoted', quotedTweetId: '111',
        metadata: { apiData: { tweet_id: '111', sourceLocation: 'quoted' } },
      });
      expect(generateMediaFilename(result.mediaItems[0]!)).toMatch(/^author_111_111_\d+\.mp4$/u);
    }
  );

  it('retains explicit B lookup and its own metadata', async () => {
    respond(tweet('111', [video('700')]));
    const result = await new MediaExtractionService().extractFromClickedElement(target('quote', true));
    expect(requestedId()).toBe('111');
    expect(result.success).toBe(true);
    expect(result.mediaItems[0]).toMatchObject({ tweetId: '111', tweetText: 'Post 111', url: source('700') });
  });

  it('opens the quoted preview before playback through the same production pipeline', async () => {
    const result = await new MediaExtractionService().extractFromClickedElement(target('quote', false, 'preview'));
    expect(result.success).toBe(true);
    expect(result.mediaItems[0]?.url).toBe(source('700'));
  });

  it.each(['legacy', 'visibility', 'deleted', 'media'])(
    'extracts supplied B once when C is %s, retaining B author/text/source', async (shape) => {
      const c = shape === 'deleted' ? { __typename: 'TweetUnavailable' }
        : shape === 'visibility' ? { __typename: 'TweetWithVisibilityResults', tweet: tweet('333', [video('900')]) }
        : tweet('333', shape === 'media' ? [video('900')] : []);
      respond(tweet('222', [], tweet('111', [video('700')], c)));
      const entries = await getTweetMedias('222');
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ tweet_id: '111', screen_name: 'author_111', tweet_text: 'Post 111', sourceLocation: 'quoted', download_url: source('700') });
      const result = await new MediaExtractionService().extractFromClickedElement(target());
      expect(result.success).toBe(true);
      expect(result.mediaItems[0]?.url).toBe(source('700'));
    }
  );

  it('preserves quote-first ordering for direct B lookup, without mixing B/C provenance', async () => {
    respond(tweet('111', [video('700')], { __typename: 'TweetWithVisibilityResults', tweet: tweet('333', [video('900')]) }));
    const result = await new MediaExtractionService().extractFromClickedElement(target('quote', true));
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems.map((item) => [item.tweetId, item.tweetUsername, item.tweetText, item.url])).toEqual([
      ['333', 'author_333', 'Post 333', source('900')], ['111', 'author_111', 'Post 111', source('700')],
    ]);
  });

  it('selects exact non-first B video and outer A independently in a mixed collection', async () => {
    respond(tweet('222', [video('800')], tweet('111', [
      { type: 'photo', id_str: '600', media_url_https: 'https://pbs.twimg.com/media/photo.jpg' }, video('700'),
    ])));
    const service = new MediaExtractionService();
    const b = await service.extractFromClickedElement(target('unmarked'));
    expect(b.success).toBe(true);
    expect(b.clickedIndex).toBe(1);
    expect(b.mediaItems.map((item) => [item.type, item.metadata?.apiData])).toMatchObject([
      ['image', { tweet_id: '111' }], ['video', { tweet_id: '111' }], ['video', { tweet_id: '222' }],
    ]);
    const aTarget = target('ordinary');
    aTarget.setAttribute('poster', poster('800'));
    const a = await service.extractFromClickedElement(aTarget);
    expect(a.success).toBe(true);
    expect(a.clickedIndex).toBe(2);
    expect(a.mediaItems[2]?.url).toBe(source('800'));
  });

  it.each(['missing', 'foreign', 'same-filename', 'different-extension', 'conflicting-source', 'ambiguous', 'shared-owner-source', 'unrelated-root', 'root-legacy-conflict', 'quote-legacy-conflict', 'deeper-quote'])(
    'fails closed for %s recovery evidence', async (kind) => {
      const clicked = target();
      if (kind === 'missing') clicked.removeAttribute('poster');
      if (kind === 'foreign') clicked.setAttribute('poster', 'https://evil.example/amplify_video_thumb/700/img/poster.jpg');
      if (kind === 'same-filename') clicked.setAttribute('poster', poster('777'));
      if (kind === 'different-extension') clicked.setAttribute('poster', poster('700').replace('.jpg', '.png'));
      if (kind === 'conflicting-source') clicked.setAttribute('src', source('999'));
      if (kind === 'ambiguous') respond(tweet('222', [], tweet('111', [video('700'), { ...video('701'), media_url_https: poster('700') }])));
      if (kind === 'shared-owner-source') respond(tweet('222', [{ ...video('800'), media_url_https: poster('700') }], tweet('111', [video('700')])));
      if (kind === 'unrelated-root') respond(tweet('444', [], tweet('111', [video('700')])));
      if (kind === 'root-legacy-conflict') respond({ ...tweet('222', [], tweet('111', [video('700')])), legacy: { id_str: '333' } });
      if (kind === 'quote-legacy-conflict') respond(tweet('222', [], { ...tweet('111', [video('700')]), legacy: { id_str: '333', extended_entities: { media: [video('700')] } } }));
      if (kind === 'deeper-quote') respond(tweet('222', [], tweet('111', [], tweet('333', [video('700')]))));
      const result = await new MediaExtractionService().extractFromClickedElement(clicked);
      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.metadata?.error).toBeTruthy();
    }
  );

  it('does not relabel a linkless playable quote as A during provider failure', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    const clicked = target('unmarked');
    clicked.setAttribute('src', source('700'));
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
  });

  it('rejects conflicting attribute and permalink owners', async () => {
    const clicked = target('quote', true);
    clicked.dataset.tweetId = '222';
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(false);
  });

  it('matches a lower-bitrate playable source only when the same B variant is returned', async () => {
    const high = video('700');
    const lowUrl = 'https://video.twimg.com/amplify_video/700/vid/low.mp4';
    respond(tweet('222', [], tweet('111', [{ ...high, video_info: { variants: [
      ...high.video_info!.variants,
      { content_type: 'video/mp4', bitrate: 10, url: lowUrl },
    ] } }])));
    const clicked = target('unmarked');
    clicked.setAttribute('src', lowUrl);
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.url).toBe(source('700'));
  });

  it('honors cancellation after a successful delayed quote response', async () => {
    const controller = new AbortController();
    httpGet.mockImplementationOnce(async () => {
      controller.abort();
      return { ok: true, status: 200, data: { data: { tweetResult: { result: tweet('222', [], tweet('111', [video('700')])) } } } };
    });
    const result = await new MediaExtractionService().extractFromClickedElement(target(), { signal: controller.signal });
    expect(result.success).toBe(false);
    expect(result.metadata?.error).toBe('Extraction cancelled');
  });

  it.each(['foreign-link', 'card', 'reply', 'adjacent'])(
    'does not borrow a quote owner across %s boundaries', async (kind) => {
      const clicked = target('unmarked');
      if (kind === 'foreign-link') clicked.parentElement!.insertAdjacentHTML('beforebegin', '<a href="https://evil.example/author/status/111">Foreign</a>');
      if (kind === 'card') clicked.parentElement!.setAttribute('data-testid', 'card.wrapper');
      if (kind === 'reply') clicked.closest('article')!.outerHTML = `<article><a href="/author_222/status/222"><time>A</time></a></article><article><video id="target" poster="${poster('700')}"></video></article>`;
      if (kind === 'adjacent') clicked.closest('article')!.outerHTML = `<article><a href="/author_222/status/222"><time>A</time></a></article><video id="target" poster="${poster('700')}"></video>`;
      const result = await new MediaExtractionService().extractFromClickedElement(document.getElementById('target')!);
      expect(result.success).toBe(false);
    }
  );

  it('retains click-time quote source/scope if DOM is replaced while transport is pending', async () => {
    let finish!: (value: unknown) => void;
    httpGet.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const clicked = target();
    const pending = new MediaExtractionService().extractFromClickedElement(clicked);
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    clicked.setAttribute('poster', poster('800'));
    clicked.setAttribute('src', source('800'));
    target('ordinary').setAttribute('poster', poster('800'));
    finish({ ok: true, status: 200, data: { data: { tweetResult: { result: tweet('222', [video('800')], tweet('111', [video('700')])) } } } });
    const result = await pending;
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.url).toBe(source('700'));
  });

  it('keeps an exact A attachment in a generic clickable wrapper', async () => {
    respond(tweet('222', [video('700')], tweet('111', [video('800')])));
    const result = await new MediaExtractionService().extractFromClickedElement(target('unmarked'));
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems[1]).toMatchObject({ tweetId: '222', url: source('700') });
  });

  it('does not recover B through an ordinary non-clickable A wrapper', async () => {
    const result = await new MediaExtractionService().extractFromClickedElement(target('ordinary'));
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
  });

  it.each([true, false])('bounds ambiguous nested-article recovery to a clickable parent=%s', async (clickable) => {
    document.body.innerHTML = `<article><a href="/author_222/status/222"><time>A</time></a>
      <div ${clickable ? 'role="link"' : ''}><article>
        <a href="/author_111/status/111">B</a><a href="/author_333/status/333">Attribution</a>
        <video id="target" src="blob:https://x.com/nested" poster="${poster('700')}"></video>
      </article></div></article>`;
    const result = await new MediaExtractionService().extractFromClickedElement(document.getElementById('target')!);
    expect(result.success).toBe(clickable);
    if (clickable) {
      expect(requestedId()).toBe('222');
      expect(result.mediaItems[result.clickedIndex!]).toMatchObject({ tweetId: '111', url: source('700') });
    } else expect(httpGet).not.toHaveBeenCalled();
  });

  it('does not use an ancestor CSS background to establish an unknown owner', async () => {
    const clicked = target();
    clicked.removeAttribute('poster');
    clicked.closest('[data-testid="quoteTweet"]')!.setAttribute('style', `background-image: url('${poster('700')}')`);
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(false);
  });

  it('does not promote a nested attribution timestamp over the direct quote owner', async () => {
    document.body.innerHTML = `<article><a href="/author_222/status/222"><time>A</time></a>
      <div role="link"><article><a href="/author_111/status/111">B</a>
        <a href="/author_333/status/333"><time>Attribution</time></a>
        <video id="target" src="blob:https://x.com/nested" poster="${poster('700')}"></video>
      </article></div></article>`;
    const result = await new MediaExtractionService().extractFromClickedElement(document.getElementById('target')!);
    expect(requestedId()).toBe('222');
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.tweetId).toBe('111');
  });

  it('refuses an unknown overlay containing multiple unmarked players', async () => {
    const clicked = target('unmarked');
    clicked.parentElement!.removeAttribute('data-testid');
    clicked.insertAdjacentHTML('afterend', `<video poster="${poster('800')}"></video><span id="overlay">Overlay</span>`);
    const result = await new MediaExtractionService().extractFromClickedElement(document.getElementById('overlay')!);
    expect(result.success).toBe(false);
  });

  it('does not expose a poster when the direct quote has no playable MP4 variant', async () => {
    respond(tweet('222', [], tweet('111', [{ ...video('700'), video_info: { variants: [
      { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/amplify_video/700/playlist.m3u8' },
    ] } }])));
    const result = await new MediaExtractionService().extractFromClickedElement(target());
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
  });

  it('keeps provider outage accounting and cooldown for unknown quote recovery', async () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const service = new MediaExtractionService();
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    for (let attempt = 0; attempt < 3; attempt++) await service.extractFromClickedElement(target());
    expect(httpGet).toHaveBeenCalledTimes(3);
    respond(tweet('222', [], tweet('111', [video('700')])));
    expect((await service.extractFromClickedElement(target())).success).toBe(false);
    expect(httpGet).toHaveBeenCalledTimes(3);
    now += 60_000;
    const recovered = await service.extractFromClickedElement(target());
    expect(recovered.success).toBe(true);
    expect(recovered.mediaItems[recovered.clickedIndex!]?.tweetId).toBe('111');
    expect(httpGet).toHaveBeenCalledTimes(4);
  });

  it('rejects a blob player with contradictory direct src evidence', async () => {
    const clicked = target();
    Object.defineProperty(clicked, 'currentSrc', { get: () => 'blob:https://x.com/current' });
    clicked.setAttribute('src', source('800'));
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(false);
  });

  it('rejects same-owner B attachments with an indistinguishable poster', async () => {
    respond(tweet('111', [video('700'), { ...video('701'), media_url_https: poster('700') }]));
    const result = await new MediaExtractionService().extractFromClickedElement(target('quote', true));
    expect(result.success).toBe(false);
    expect(result.metadata?.strategy).toBe('api-media-ambiguous');
  });

  it('retains marked quote scope through an inner generic clickable wrapper', async () => {
    respond(tweet('222', [video('700')]));
    const clicked = target();
    const wrapper = document.createElement('div');
    wrapper.setAttribute('role', 'link');
    clicked.parentElement!.replaceWith(wrapper);
    wrapper.append(clicked);
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(false);
  });

  it.each(['card.wrapper', 'reply'])('does not promote article A inside %s', async (boundary) => {
    respond(tweet('222', [video('700')]));
    const clicked = target('unmarked');
    clicked.parentElement!.setAttribute('data-testid', boundary);
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(false);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('does not use an unrelated untimed A status link as a quote request context', async () => {
    const clicked = target();
    document.querySelector('time')!.replaceWith('Unrelated link');
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(false);
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('keeps unconfirmed B out of A DOM recovery after provider failure', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    const b = target('unmarked');
    b.setAttribute('src', source('700'));
    const article = b.closest('article')!;
    article.insertAdjacentHTML('beforeend', `<video id="outer" src="${source('800')}"></video>`);
    const result = await new MediaExtractionService().extractFromClickedElement(document.getElementById('outer')!);
    expect(result.success).toBe(true);
    expect(result.mediaItems.map((item) => [item.tweetId, item.url])).toEqual([['222', source('800')]]);
  });

  it('accepts a resolved protocol-relative B poster and an explicit format spelling', async () => {
    const base = document.createElement('base');
    base.href = 'https://x.com';
    document.head.append(base);
    try {
    const clicked = target();
    clicked.setAttribute('poster', '//pbs.twimg.com/amplify_video_thumb/700/img/poster?format=jpg&name=small');
    const result = await new MediaExtractionService().extractFromClickedElement(clicked);
    expect(result.success).toBe(true);
    expect(result.mediaItems[result.clickedIndex!]?.tweetId).toBe('111');
    } finally { base.remove(); }
  });

  it.each(['allow-all', 'block-controls-only', 'block-all'])(
    'routes the observed unmarked native button through production extraction only in %s', async (mode) => {
      settings.mode = mode;
      document.body.innerHTML = `<article><a href="/author_222/status/222"><time>A</time></a>
        <div role="link"><article><a href="/author_111/status/111">B</a>
          <a href="/author_333/status/333">Attribution</a><div><div>
            <video poster="${poster('700')}"></video><button id="target">Native play</button>
          </div></div></article></div></article>`;
      const service = new MediaExtractionService();
      let result: Awaited<ReturnType<typeof service.extractFromClickedElement>> | undefined;
      let pending: Promise<void> | undefined;
      const button = document.getElementById('target')!;
      button.addEventListener('click', (event) => { pending = handleMediaClick(event as MouseEvent, {
        onMediaClick: async (element) => { result = await service.extractFromClickedElement(element); },
        onGalleryClose: () => { throw new Error('Unexpected gallery close'); },
      }, { enableKeyboard: true, enableMediaDetection: true, debugMode: false,
        preventBubbling: true, context: 'native-quote-regression' }); });
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      button.dispatchEvent(event);
      await pending;
      if (mode === 'allow-all') {
        expect(event.defaultPrevented).toBe(true);
        expect(requestedId()).toBe('222');
        expect(result?.success).toBe(true);
        expect(result?.mediaItems[result.clickedIndex!]).toMatchObject({ tweetId: '111', url: source('700') });
      } else {
        expect(event.defaultPrevented).toBe(false);
        expect(httpGet).not.toHaveBeenCalled();
      }
    }
  );
});
