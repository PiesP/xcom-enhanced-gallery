// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuotedVideoTweetResponse } from '../../../../fixtures/quoted-video-tweet-response';
import { unanchoredVideoPreview } from '../../../../fixtures/unanchored-video-preview';
import { createMixedOwnerVideoResponse } from '../../../../fixtures/mixed-owner-video-response';

const httpGet = vi.hoisted(() => vi.fn());

vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));

vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({
  getCsrfTokenAsync: vi.fn(async () => 'csrf-token'),
  resolveBearerToken: vi.fn(() => 'Bearer test-token'),
}));

import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { getTweetMedias } from '@shared/services/media/twitter-api-client';
import type { MediaExtractionResult } from '@shared/types/media.types';

describe('MediaExtractionService quoted media selection', () => {
  beforeEach(() => {
    httpGet.mockReset();
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: createQuotedVideoTweetResponse(),
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('requests the main owner for an unanchored preview before quoted links', async () => {
    document.body.innerHTML = unanchoredVideoPreview;
    const result = await new MediaExtractionService().extractFromClickedElement(
      document.querySelector<HTMLImageElement>('#main-poster')!
    );
    const requestedUrl = new URL(httpGet.mock.calls[0]?.[0] as string);
    const variables = JSON.parse(requestedUrl.searchParams.get('variables') ?? '{}');
    expect(variables.tweetId).toBe('222');
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems[result.clickedIndex ?? 0]?.type).toBe('video');
  });

  it('does not replace a poster-only failed video with a quoted photo', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 403, data: {} });
    document.body.innerHTML = unanchoredVideoPreview;
    const result = await new MediaExtractionService().extractFromClickedElement(
      document.querySelector<HTMLImageElement>('#main-poster')!
    );
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
  });

  it('selects the sole API video when the preview has no URL evidence', async () => {
    document.body.innerHTML = unanchoredVideoPreview;
    const poster = document.querySelector<HTMLImageElement>('#main-poster')!;
    poster.removeAttribute('src');
    const result = await new MediaExtractionService().extractFromClickedElement(poster);
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.metadata?.clickedMatch).toBe('unknown');
    expect(result.mediaItems[1]?.type).toBe('video');
  });

  it.each(['preview', 'blob-player'] as const)(
    'does not substitute the quote video when only the main MP4 is unavailable: %s',
    async (kind) => {
      httpGet.mockResolvedValue({
        ok: true,
        status: 200,
        data: createMixedOwnerVideoResponse(false),
      });
      // Exercise the actual parser: the quote still has a valid playable variant.
      const parsed = await getTweetMedias('222');
      expect(parsed.map((entry) => entry.tweet_id)).toEqual(['111']);
      expect(parsed[0]?.download_url).toContain('/444/');
      expect(parsed[0]?.sourceLocation).toBe('quoted');
      document.body.innerHTML = unanchoredVideoPreview;
      const poster = document.querySelector<HTMLImageElement>('#main-poster')!;
      if (kind === 'preview') poster.removeAttribute('src');
      else
        poster.outerHTML =
          '<video id="main-poster" src="blob:https://x.com/runtime-playback"></video>';
      const result = await new MediaExtractionService().extractFromClickedElement(
        document.querySelector<HTMLElement>('#main-poster')!
      );
      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.tweetInfo?.tweetId).toBe('222');
      expect(result.metadata?.error).toBe('Insufficient evidence to select the clicked video');
      for (const [url] of httpGet.mock.calls) {
        expect(
          JSON.parse(new URL(url as string).searchParams.get('variables') ?? '{}').tweetId
        ).toBe('222');
      }
    }
  );

  it('selects the main video by API provenance with a URL-less preview and two owners', async () => {
    httpGet.mockResolvedValue({ ok: true, status: 200, data: createMixedOwnerVideoResponse() });
    document.body.innerHTML = unanchoredVideoPreview;
    const poster = document.querySelector<HTMLImageElement>('#main-poster')!;
    poster.removeAttribute('src');
    const result = await new MediaExtractionService().extractFromClickedElement(poster);
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems).toHaveLength(2);
    expect(result.mediaItems[0]?.metadata?.apiData).toMatchObject({ tweet_id: '111' });
    expect(result.mediaItems[1]?.metadata?.apiData).toMatchObject({ tweet_id: '222' });
    expect(result.mediaItems[1]?.url).toContain('/333/');
  });

  it('requests an unanchored quote video owner rather than the outer article', async () => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: JSON.parse(JSON.stringify(createQuotedVideoTweetResponse()).replaceAll('222', '444')),
    });
    document.body.innerHTML = unanchoredVideoPreview;
    const quote = document.querySelector('[data-testid="quoteTweet"]')!;
    quote.removeAttribute('role');
    quote.removeAttribute('data-testid');
    quote.innerHTML =
      '<div data-testid="tweetPhoto"><div data-testid="previewInterstitial"><img id="quote-video" src="https://pbs.twimg.com/ext_tw_video_thumb/444/pu/img/quote-video.jpg"><button data-testid="playButton">Play</button></div></div><a href="/quote_author/status/444">Quote permalink</a>';
    const result = await new MediaExtractionService().extractFromClickedElement(
      document.querySelector<HTMLImageElement>('#quote-video')!
    );
    const variables = JSON.parse(
      new URL(httpGet.mock.calls[0]?.[0] as string).searchParams.get('variables') ?? '{}'
    );
    expect(variables.tweetId).toBe('444');
    expect(result.success).toBe(true);
    expect(result.clickedIndex).toBe(1);
    expect(result.tweetInfo?.tweetId).toBe('444');
  });

  it('does not return quoted API photos when the requested video has no MP4 variant', async () => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: JSON.parse(
        JSON.stringify(createQuotedVideoTweetResponse()).replaceAll(
          'video/mp4',
          'application/x-mpegURL'
        )
      ),
    });
    document.body.innerHTML = unanchoredVideoPreview;
    const result = await new MediaExtractionService().extractFromClickedElement(
      document.querySelector<HTMLImageElement>('#main-poster')!
    );
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
    expect(result.metadata?.error).toBe('API media does not match the clicked media');
  });

  it('rejects contradictory successful API media instead of selecting index zero', async () => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: JSON.parse(
        JSON.stringify(createQuotedVideoTweetResponse()).replaceAll(
          'quote-video',
          'unrelated-video'
        )
      ),
    });
    document.body.innerHTML = unanchoredVideoPreview;
    const result = await new MediaExtractionService().extractFromClickedElement(
      document.querySelector<HTMLImageElement>('#main-poster')!
    );
    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
    expect(result.metadata?.error).toBe('API media does not match the clicked media');
  });

  it('keeps quote metadata and excludes the main poster during photo fallback', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 403, data: {} });
    document.body.innerHTML = unanchoredVideoPreview;
    const result = await new MediaExtractionService().extractFromClickedElement(
      document.querySelector<HTMLImageElement>('#quoted-photo')!
    );
    expect(result.success).toBe(true);
    expect(result.mediaItems).toHaveLength(1);
    expect(result.mediaItems[0]?.tweetId).toBe('111');
    expect(result.mediaItems[0]?.type).toBe('image');
  });

  it('requests the outer tweet and selects its video after the quoted image', async () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <a href="/original_author/status/111/photo/1">
          <img src="https://pbs.twimg.com/media/quoted-image.jpg" alt="Quoted original image">
        </a>
        <a href="/quote_author/status/222/video/1">
          <div data-testid="videoPlayer">
            <video
              src="blob:https://x.com/runtime-playback"
              poster="https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg"
            ></video>
          </div>
        </a>
      </article>
    `;

    const clickedVideo = document.querySelector('video');
    expect(clickedVideo).toBeInstanceOf(HTMLVideoElement);

    const service = new MediaExtractionService();
    const result = await service.extractFromClickedElement(clickedVideo as HTMLVideoElement);

    expect(result.success).toBe(true);
    expect(result.mediaItems).toHaveLength(2);
    expect(result.clickedIndex).toBe(1);
    expect(result.mediaItems.map((media) => media.type)).toEqual(['image', 'video']);
    expect(result.mediaItems[0]?.url).toContain('quoted-image.jpg');
    expect(result.mediaItems[1]?.url).toBe(
      'https://video.twimg.com/ext_tw_video/222/pu/vid/1280x720/quote-video.mp4'
    );
    expect(result.mediaItems[1]?.thumbnailUrl).toBe(
      'https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg'
    );

    expect(httpGet).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(httpGet.mock.calls[0]?.[0] as string);
    const variables = JSON.parse(requestedUrl.searchParams.get('variables') ?? '{}') as {
      tweetId?: string;
    };
    expect(variables.tweetId).toBe('222');
  });

  it('falls back to media in a public plain article and keeps the clicked overlay index', async () => {
    httpGet.mockResolvedValue({ ok: false, status: 403, data: {} });
    document.body.innerHTML = `
      <article>
        <img
          src="https://pbs.twimg.com/profile_images/123/avatar.jpg"
          alt="Account avatar"
        >
        <div class="media-cell">
          <img
            src="https://pbs.twimg.com/media/first?format=jpg&amp;name=large"
            alt="First photo"
          >
          <a
            aria-label="View media"
            href="/public_author/status/333/photo/1"
          ></a>
        </div>
        <div class="media-cell">
          <img
            src="https://pbs.twimg.com/media/second?format=jpg&amp;name=large"
            alt="Second photo"
          >
          <a
            aria-label="View media"
            href="/public_author/status/333/photo/2"
          ></a>
        </div>
      </article>
    `;

    const clickedOverlay = document.querySelector<HTMLAnchorElement>('a[href$="/photo/2"]');
    expect(clickedOverlay).toBeInstanceOf(HTMLAnchorElement);

    const service = new MediaExtractionService();
    const result = await service.extractFromClickedElement(clickedOverlay as HTMLAnchorElement);

    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.metadata?.sourceType).toBe('dom-fallback');
    expect(result.tweetInfo?.tweetId).toBe('333');
    expect(result.mediaItems.map((media) => media.url)).toEqual([
      'https://pbs.twimg.com/media/first?format=jpg&name=large',
      'https://pbs.twimg.com/media/second?format=jpg&name=large',
    ]);
    expect(result.mediaItems.every((media) => !media.url.includes('/profile_images/'))).toBe(true);
    expect(result.clickedIndex).toBe(1);
  });

  it('does not let an aborted API response mutate or return success after a newer click', async () => {
    let resolveResponse!: (value: {
      ok: boolean;
      status: number;
      data: ReturnType<typeof createQuotedVideoTweetResponse>;
    }) => void;
    httpGet.mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      })
    );
    document.body.innerHTML = `
      <article data-testid="tweet">
        <a href="/quote_author/status/222/video/1">
          <div data-testid="videoPlayer"><video></video></div>
        </a>
      </article>
    `;
    const clickedVideo = document.querySelector('video') as HTMLVideoElement;
    const controller = new AbortController();
    const service = new MediaExtractionService();

    const pending = service.extractFromClickedElement(clickedVideo, { signal: controller.signal });
    await vi.waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));
    controller.abort();
    resolveResponse({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });

    const result = await pending;
    expect(result.success).toBe(false);
    expect(result.metadata?.error).toBe('Extraction cancelled');
  });
});

describe('MediaExtractionService API circuit', () => {
  let now = 1_000_000;

  beforeEach(() => {
    now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    httpGet.mockReset();
    document.body.innerHTML = `
      <article data-testid="tweet">
        <a href="/quote_author/status/222/video/1">
          <div data-testid="videoPlayer">
            <video poster="https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg"></video>
          </div>
        </a>
      </article>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  const click = (service: MediaExtractionService): Promise<MediaExtractionResult> =>
    service.extractFromClickedElement(document.querySelector('video')!);

  it('skips open-circuit requests without postponing recovery and resets after success', async () => {
    const service = new MediaExtractionService();
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });

    for (let attempt = 0; attempt < 3; attempt++) await click(service);
    expect(httpGet).toHaveBeenCalledTimes(3);

    now += 59_000;
    for (let skipped = 0; skipped < 4; skipped++) await click(service);
    expect(httpGet).toHaveBeenCalledTimes(3);

    now += 1_001;
    httpGet.mockResolvedValue({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    expect((await click(service)).success).toBe(true);
    expect(httpGet).toHaveBeenCalledTimes(4);

    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    await click(service);
    expect(httpGet).toHaveBeenCalledTimes(5);
    httpGet.mockResolvedValue({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    expect((await click(service)).success).toBe(true);
    expect(httpGet).toHaveBeenCalledTimes(6);
  });

  it('does not open the circuit for response matching or missing-media failures', async () => {
    const service = new MediaExtractionService();
    const mismatchedResponse = JSON.parse(
      JSON.stringify(createQuotedVideoTweetResponse()).replaceAll('quote-video', 'unrelated-video')
    );
    httpGet.mockResolvedValue({ ok: true, status: 200, data: mismatchedResponse });

    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await click(service);
      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBe('API media does not match the clicked media');
    }
    httpGet.mockResolvedValue({ ok: true, status: 200, data: {} });
    await click(service);
    expect(httpGet).toHaveBeenCalledTimes(4);
  });

  it('clears earlier provider failures when a response is healthy but mismatched', async () => {
    const service = new MediaExtractionService();
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    await click(service);
    await click(service);

    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: JSON.parse(
        JSON.stringify(createQuotedVideoTweetResponse()).replaceAll('quote-video', 'unrelated-video')
      ),
    });
    expect((await click(service)).success).toBe(false);

    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    await click(service);
    httpGet.mockResolvedValue({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    expect((await click(service)).success).toBe(true);
    expect(httpGet).toHaveBeenCalledTimes(5);
  });

  it('does not count an aborted response as an API failure', async () => {
    const service = new MediaExtractionService();
    httpGet.mockResolvedValue({ ok: false, status: 503, data: {} });
    await click(service);
    await click(service);

    const controller = new AbortController();
    httpGet.mockImplementationOnce(async () => {
      controller.abort();
      return { ok: false, status: 503, data: {} };
    });
    const cancelled = await service.extractFromClickedElement(document.querySelector('video')!, {
      signal: controller.signal,
    });
    expect(cancelled.metadata?.error).toBe('Extraction cancelled');

    httpGet.mockResolvedValue({ ok: true, status: 200, data: createQuotedVideoTweetResponse() });
    expect((await click(service)).success).toBe(true);
    expect(httpGet).toHaveBeenCalledTimes(4);
  });
});
