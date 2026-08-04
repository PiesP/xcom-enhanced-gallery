// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { determineClickedIndex } from '@shared/services/media-extraction/determine-clicked-index';
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
      download_url: 'https://video.twimg.com/ext_tw_video/222/pu/vid/1280x720/quote-video.mp4',
      preview_url: 'https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg',
    },
  },
};

describe('determineClickedIndex', () => {
  it('matches a clicked video by its poster when its runtime source is a blob URL', () => {
    const video = document.createElement('video');
    video.src = 'blob:https://x.com/runtime-playback';
    video.poster = quoteTweetVideo.thumbnailUrl ?? '';

    expect(determineClickedIndex(video, [quotedImage, quoteTweetVideo])).toBe(1);
  });
});
