// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateMediaFilename } from '@shared/core/filename/filename-utils';
import type { TwitterMedia, TwitterTweet } from '@shared/services/media/types';
import { captureClickedMediaEvidence } from '@shared/services/media-extraction/determine-clicked-index';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const httpGet = vi.hoisted(() => vi.fn());
vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));
vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({
  getCsrfTokenAsync: vi.fn(async () => 'fixture'),
  resolveBearerToken: vi.fn(() => 'Bearer fixture'),
}));

const A = '8555555555555555555';
const B = '9555555555555555555';
const C = '7555555555555555555';
const selectedPreview = 'https://pbs.twimg.com/media/CompactQuoteSelected?format=webp&name=medium';
const selectedOriginal = 'https://pbs.twimg.com/media/CompactQuoteSelected?format=webp&name=orig';
const firstPhoto = 'https://pbs.twimg.com/media/CompactQuoteFirst.jpg';
const bPhoto = 'https://pbs.twimg.com/media/CompactQuoteMiddle.jpg';

function photo(id: string, url: string): TwitterMedia {
  return {
    type: 'photo',
    id_str: id,
    media_url_https: url,
    original_info: { width: 320, height: 180 },
  };
}
function tweet(id: string, medias: TwitterMedia[] = [], quoted?: TwitterTweet): TwitterTweet {
  const handle = id === A ? 'outer_fixture' : id === B ? 'middle_fixture' : 'inner_fixture';
  return {
    rest_id: id,
    core: { user_results: { result: { legacy: { screen_name: handle } } } },
    legacy: { id_str: id, full_text: `Fixture ${id}`, extended_entities: { media: medias } },
    ...(quoted ? { quoted_status_result: { result: quoted } } : {}),
  };
}
function response(value: TwitterTweet) {
  return { ok: true, status: 200, data: { data: { tweetResult: { result: value } } } };
}
function requestedId(): string {
  const request = httpGet.mock.calls[0]?.[0];
  if (typeof request !== 'string') throw new Error('Expected an API request');
  const url = new URL(request);
  return (JSON.parse(url.searchParams.get('variables') ?? '{}') as { tweetId: string }).tweetId;
}
function element<T extends HTMLElement>(selector: string): T {
  const match = document.querySelector<T>(selector);
  expect(match).not.toBeNull();
  return match!;
}
function installMiddlePhoto(): HTMLAnchorElement {
  const slot = element<HTMLElement>('#b-media-slot');
  const cell = document.createElement('div');
  const imageLink = document.createElement('a');
  imageLink.href = `/middle_fixture/status/${B}`;
  const image = document.createElement('img');
  image.src = bPhoto;
  imageLink.append(image);
  const overlay = document.createElement('a');
  overlay.id = 'b-overlay';
  overlay.href = `/middle_fixture/status/${B}`;
  cell.append(imageLink, overlay);
  slot.append(cell);
  return overlay;
}

describe('compact inner quote photo, preserving observed overlay ownership', () => {
  beforeEach(() => {
    httpGet.mockReset();
    document.body.innerHTML = readFileSync(
      resolve(process.cwd(), 'test/e2e/fixtures/installed-compact-quote-photo-page.html'),
      'utf8'
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('requests C from its overlapping status link and selects the second C photo', async () => {
    httpGet.mockResolvedValue(
      response(tweet(C, [photo('101', firstPhoto), photo('102', selectedPreview)]))
    );
    const overlay = element<HTMLAnchorElement>('#c-overlay');
    const evidence = captureClickedMediaEvidence(overlay);
    expect(isProcessableMedia(overlay)).toBe(true);
    expect(new TweetInfoExtractor().extractContext(overlay)?.ownership).toEqual({
      requestTweetId: C,
      ownerTweetId: C,
      scope: 'owned',
    });
    expect(evidence).toMatchObject({
      mediaType: 'image',
      sourceKey: 'pbs.twimg.com/media/CompactQuoteSelected',
    });

    const result = await new MediaExtractionService().extractFromClickedElement(overlay);
    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(requestedId()).toBe(C);
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems.map((item) => item.tweetId)).toEqual([C, C]);
    expect(result.mediaItems.map((item) => item.url)).toEqual([
      'https://pbs.twimg.com/media/CompactQuoteFirst.jpg?format=jpg&name=orig',
      selectedOriginal,
    ]);
    const chosen = result.mediaItems[1]!;
    expect(chosen).toMatchObject({
      tweetId: C,
      tweetUsername: 'inner_fixture',
      tweetText: `Fixture ${C}`,
      tweetUrl: `https://x.com/inner_fixture/status/${C}`,
      downloadSource: { quality: 'cdn-original', provenance: 'api' },
      metadata: { apiData: { tweet_id: C } },
    });
    expect(generateMediaFilename(chosen)).toContain(`inner_fixture_${C}_`);
  });

  it('keeps a B photo distinct from C when both are visible in the nested layout', async () => {
    const overlay = installMiddlePhoto();
    httpGet.mockResolvedValue(
      response(tweet(B, [photo('201', bPhoto)], tweet(C, [photo('102', selectedPreview)])))
    );
    expect(isProcessableMedia(overlay)).toBe(true);
    const result = await new MediaExtractionService().extractFromClickedElement(overlay);
    expect(requestedId()).toBe(B);
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems.map((item) => item.tweetId)).toEqual([C, B]);
    expect(result.mediaItems[0]).toMatchObject({
      metadata: { apiData: { tweet_id: C, quoteParentTweetId: B, quotedTweetId: C } },
    });
    expect(result.mediaItems[result.clickedIndex!]).toMatchObject({
      tweetId: B,
      tweetUsername: 'middle_fixture',
      tweetText: `Fixture ${B}`,
      metadata: { apiData: { tweet_id: B } },
    });
    expect(result.mediaItems.some((item) => item.tweetId === A)).toBe(false);
  });

  it('retains C ownership and observed source on a 403 DOM fallback', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 403, data: {} });
    const result = await new MediaExtractionService().extractFromClickedElement(
      element<HTMLAnchorElement>('#c-overlay')
    );
    expect(requestedId()).toBe(C);
    expect(result.success).toBe(true);
    expect(result.metadata?.sourceType).toBe('dom-fallback');
    expect(result.clickedIndex).toBe(0);
    expect(result.mediaItems).toHaveLength(1);
    expect(result.mediaItems[0]).toMatchObject({
      tweetId: C,
      tweetUsername: 'inner_fixture',
      url: selectedPreview,
      downloadSource: { url: selectedOriginal, provenance: 'dom' },
    });
    expect(result.mediaItems.some((item) => item.tweetId === A || item.tweetId === B)).toBe(false);
  });

  it('rejects conflicting overlay ownership and leaves a separate external link native', async () => {
    const overlay = element<HTMLAnchorElement>('#c-overlay');
    overlay.href = `/other_fixture/status/6555555555555555555`;
    httpGet.mockResolvedValue(response(tweet(C, [photo('102', selectedPreview)])));
    const result = await new MediaExtractionService().extractFromClickedElement(overlay);
    expect(result.success).toBe(false);
    expect(requestedId()).toBe('6555555555555555555');
    expect(result.mediaItems).toEqual([]);
    const external = document.createElement('a');
    external.href = 'https://example.org/fixture-story';
    element<HTMLElement>('#compact-c').append(external);
    expect(isProcessableMedia(external)).toBe(false);
  });

  it.each(['#a-header', '#b-header', '#c-header'])(
    'leaves the %s status header as a native post link',
    (selector) => {
      expect(isProcessableMedia(element<HTMLAnchorElement>(selector))).toBe(false);
    }
  );
});
