// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { matchClickedMedia } from '@shared/services/media-extraction/determine-clicked-index';
import type { MediaInfo } from '@shared/types/media.types';
import { describe, expect, it } from 'vitest';

const quotedImage: MediaInfo = {
  id: 'quoted-image',
  type: 'image',
  url: 'https://pbs.twimg.com/media/quoted-image.jpg?format=jpg&name=orig',
  sourceLocation: 'quoted',
};

const quoteTweetVideo: MediaInfo = {
  id: 'quote-tweet-video',
  type: 'video',
  url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/1280x720/quote-video.mp4',
  thumbnailUrl: 'https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg',
  sourceLocation: 'original',
  metadata: {
    apiData: {
      tweet_id: '222',
      download_url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/1280x720/quote-video.mp4',
      preview_url: 'https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg',
    },
  },
};

describe('matchClickedMedia', () => {
  it('matches a clicked video by its poster when its runtime source is a blob URL', () => {
    const video = document.createElement('video');
    video.src = 'blob:https://x.com/runtime-playback';
    video.poster = quoteTweetVideo.thumbnailUrl ?? '';

    expect(matchClickedMedia(video, [quotedImage, quoteTweetVideo], '222')).toEqual({
      status: 'matched',
      index: 1,
    });
  });

  it('distinguishes missing URL evidence from contradictory media', () => {
    const image = document.createElement('img');
    expect(matchClickedMedia(image, [quotedImage], '222')).toEqual({ status: 'unknown', index: 0 });
    image.src = 'https://pbs.twimg.com/media/another-image.jpg';
    expect(matchClickedMedia(image, [quotedImage], '222')).toEqual({
      status: 'contradictory',
      index: 0,
    });
  });

  it('does not match a video thumbnail to an API photo with the same URL', () => {
    const image = document.createElement('img');
    image.src = quoteTweetVideo.thumbnailUrl!;
    expect(matchClickedMedia(image, [{ ...quotedImage, url: image.src }], '222')).toEqual({
      status: 'contradictory',
      index: 0,
    });
  });

  it('matches a non-first ordinary image in mixed media', () => {
    const image = document.createElement('img');
    image.src = quotedImage.url;
    expect(matchClickedMedia(image, [quoteTweetVideo, quotedImage], '222')).toEqual({
      status: 'matched',
      index: 1,
    });
  });

  it('uses type evidence for a single video but leaves multiple URL-less videos ambiguous', () => {
    const preview = document.createElement('div');
    preview.dataset.testid = 'tweetPhoto';
    preview.innerHTML =
      '<div data-testid="previewInterstitial"><img><button data-testid="playButton">Play</button></div>';
    const poster = preview.querySelector('img')!;
    expect(matchClickedMedia(poster, [quotedImage, quoteTweetVideo], '222')).toEqual({
      status: 'unknown',
      index: 1,
    });
    expect(
      matchClickedMedia(
        poster,
        [quotedImage, quoteTweetVideo, { ...quoteTweetVideo, id: 'another' }],
        '222'
      )
    ).toEqual({ status: 'unknown', index: null });
  });

  it('cannot infer API ownership from request-level IDs or source-location labels', () => {
    const video = document.createElement('video');
    video.src = 'blob:https://x.com/runtime-playback';
    const missingOwner = { ...quoteTweetVideo, tweetId: '222', metadata: undefined };
    const conflictingOwner = {
      ...quoteTweetVideo,
      tweetId: '222',
      metadata: {
        apiData: { tweet_id: '111' },
      },
    };
    for (const item of [missingOwner, conflictingOwner]) {
      expect(matchClickedMedia(video, [item], '222')).toEqual({ status: 'unknown', index: null });
    }
  });
});
