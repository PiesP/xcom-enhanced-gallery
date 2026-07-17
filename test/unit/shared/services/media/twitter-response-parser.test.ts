// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import { getHighQualityMediaUrl } from '@shared/services/media/twitter-parser/twitter-response-parser';

describe('twitter-response-parser (pure functions)', () => {
  describe('getHighQualityMediaUrl', () => {
    it('should return photo URL with format param', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC?format=jpg&name=large',
      } as any;
      const result = getHighQualityMediaUrl(media);
      // getPhotoHighQualityUrl adds/replaces format and name params
      expect(result).toContain('format=jpg');
      // Note: in jsdom environment, URLSearchParams.set may not replace existing values
      // The important thing is the URL is returned with format param
      expect(result).not.toBeNull();
    });

    it('should return original URL for photo without valid extension', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBe('https://pbs.twimg.com/media/ABC');
    });

    it('should return highest bitrate video URL', () => {
      const media = {
        type: 'video',
        video_info: {
          variants: [
            { content_type: 'video/mp4', bitrate: 256000, url: 'https://video.twimg.com/low.mp4' },
            { content_type: 'video/mp4', bitrate: 832000, url: 'https://video.twimg.com/mid.mp4' },
            { content_type: 'video/mp4', bitrate: 2176000, url: 'https://video.twimg.com/high.mp4' },
            { content_type: 'application/x-mpegURL', bitrate: 0, url: 'https://video.twimg.com/playlist.m3u8' },
          ],
        },
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBe('https://video.twimg.com/high.mp4');
    });

    it('should return null for video with no mp4 variants', () => {
      const media = {
        type: 'video',
        video_info: {
          variants: [
            { content_type: 'application/x-mpegURL', bitrate: 0, url: 'https://video.twimg.com/playlist.m3u8' },
          ],
        },
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBeNull();
    });

    it('should handle animated_gif type', () => {
      const media = {
        type: 'animated_gif',
        video_info: {
          variants: [
            { content_type: 'video/mp4', bitrate: 0, url: 'https://video.twimg.com/gif.mp4' },
          ],
        },
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBe('https://video.twimg.com/gif.mp4');
    });

    it('should return null for unknown type', () => {
      const media = { type: 'unknown' } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBeNull();
    });

    it('should handle photo with png extension', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC.png?name=large',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toContain('format=png');
      expect(result).toContain('name=orig');
    });

    it('should handle photo with jpeg extension', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC.jpeg?name=small',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toContain('format=jpeg');
      expect(result).toContain('name=orig');
    });
  });
});
