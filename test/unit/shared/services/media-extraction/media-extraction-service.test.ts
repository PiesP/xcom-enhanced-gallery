// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuotedVideoTweetResponse } from '../../../../fixtures/quoted-video-tweet-response';

const httpGet = vi.hoisted(() => vi.fn());

vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));

vi.mock('@shared/services/media/twitter-auth/twitter-auth', () => ({
  getCsrfTokenAsync: vi.fn(async () => 'csrf-token'),
  resolveBearerToken: vi.fn(() => 'Bearer test-token'),
}));

import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';

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
});
