// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vite-plus/test';
import {
  VIDEO_FORMAT_API_CASES,
  VIDEO_FORMAT_DIRECT_SOURCE,
  videoFormatApiResponse,
} from './install-preparation.ts';

describe('installed video format API responses', () => {
  it.each(VIDEO_FORMAT_API_CASES)(
    'keeps $name owner and video admission distinct from its sibling photo',
    (fixture) => {
      const response = videoFormatApiResponse(fixture.tweetId);
      expect(response).not.toBeNull();
      const root = response!.data.tweetResult.result;
      expect(root.rest_id).toBe(fixture.tweetId);
      const media = root.legacy.extended_entities.media;
      const expectedSource = `${VIDEO_FORMAT_DIRECT_SOURCE}${fixture.query}`;
      const selected = media.find((item) => 'video_info' in item);
      expect(selected).toMatchObject({
        type: fixture.mediaType,
        video_info: { variants: [{ content_type: 'video/mp4', url: expectedSource }] },
      });
      if (fixture.accepted) {
        expect(media).toHaveLength(1);
      } else {
        expect(media).toHaveLength(2);
        expect(media[0]).toMatchObject({
          type: 'photo',
          media_url_https: 'https://pbs.twimg.com/media/GkE1234ABCDEF?format=jpg&name=small',
        });
      }
    }
  );

  it('has no response for unrelated owner IDs', () => {
    expect(videoFormatApiResponse('4666000000000000484')).toBeNull();
  });
});
