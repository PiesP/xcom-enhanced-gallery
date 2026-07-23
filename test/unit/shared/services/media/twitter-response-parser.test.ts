// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect } from 'vitest';
import {
  extractMediaFromTweet,
  getHighQualityMediaUrl,
  normalizeLegacyTweet,
  normalizeLegacyUser,
} from '@shared/services/media/twitter-parser/twitter-response-parser';

describe('twitter-response-parser (pure functions)', () => {
  describe('getHighQualityMediaUrl', () => {
    it('should return photo URL with format param', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC?format=jpg&name=large',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toContain('format=jpg');
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

    // ── Additional edge cases ──

    it('should handle photo with jpg extension', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC.jpg?name=large',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toContain('format=jpg');
      expect(result).toContain('name=orig');
    });

    it('should return null when media_url_https is undefined for photo', () => {
      const media = { type: 'photo' } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBeNull();
    });

    it('should handle photo with empty media_url_https', () => {
      const media = { type: 'photo', media_url_https: '' } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBe('');
    });

    it('should return null for video with empty variants array', () => {
      const media = {
        type: 'video',
        video_info: { variants: [] },
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBeNull();
    });

    it('should return null for video with missing video_info', () => {
      const media = { type: 'video' } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBeNull();
    });

    it('should return null for animated_gif with empty variants', () => {
      const media = {
        type: 'animated_gif',
        video_info: { variants: [] },
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBeNull();
    });

    it('should handle photo with already-present format param', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC.jpg?format=jpg&name=orig',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toContain('format=jpg');
      expect(result).toContain('name=orig');
    });

    it('should handle photo with case-insensitive extension', () => {
      const media = {
        type: 'photo',
        media_url_https: 'https://pbs.twimg.com/media/ABC.JPG?name=large',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toContain('format=jpg');
      expect(result).toContain('name=orig');
    });

    it('should handle video where all variants have undefined bitrate', () => {
      const media = {
        type: 'video',
        video_info: {
          variants: [
            { content_type: 'video/mp4', url: 'https://video.twimg.com/vid.mp4' },
            { content_type: 'video/mp4', url: 'https://video.twimg.com/vid2.mp4' },
          ],
        },
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBe('https://video.twimg.com/vid.mp4');
    });

    it('should prefer higher bitrate over later position', () => {
      const media = {
        type: 'video',
        video_info: {
          variants: [
            { content_type: 'video/mp4', bitrate: 100000, url: 'https://video.twimg.com/low.mp4' },
            { content_type: 'video/mp4', bitrate: 500000, url: 'https://video.twimg.com/high.mp4' },
            { content_type: 'video/mp4', bitrate: 256000, url: 'https://video.twimg.com/mid.mp4' },
          ],
        },
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).toBe('https://video.twimg.com/high.mp4');
    });

    it('should handle malformed photo URL gracefully', () => {
      const media = {
        type: 'photo',
        media_url_https: 'not-a-valid-url',
      } as any;
      const result = getHighQualityMediaUrl(media);
      expect(result).not.toBeNull();
    });
  });

  describe('extractMediaFromTweet', () => {
    it('extracts downloadable media in note-tweet inline order and removes short URLs', () => {
      const photo = {
        type: 'photo',
        id_str: 'photo-1',
        media_key: '3_1',
        media_url_https: 'https://pbs.twimg.com/media/photo-1.jpg?name=large',
        url: 'https://t.co/photo',
        display_url: 'pic.x.com/photo',
        ext_alt_text: '  sunset  ',
        original_info: { width: 1920, height: 1080 },
      };
      const video = {
        type: 'video',
        id_str: 'video-1',
        media_url_https: 'https://pbs.twimg.com/media/video-1.jpg',
        url: 'https://t.co/video',
        video_info: {
          aspect_ratio: [16, 9],
          variants: [
            { content_type: 'video/mp4', bitrate: 256_000, url: 'https://video.twimg.com/low.mp4' },
            { content_type: 'video/mp4', bitrate: 1_024_000, url: 'https://video.twimg.com/high.mp4' },
          ],
        },
      };
      const tweet = {
        rest_id: 'tweet-1',
        full_text: 'Look https://t.co/photo https://t.co/video',
        extended_entities: { media: [video, photo] },
        note_tweet: {
          note_tweet_results: {
            result: {
              media: {
                inline_media: [
                  { media_id: 'photo-1', index: 0 },
                  { media_id: 'video-1', index: 1 },
                ],
              },
            },
          },
        },
      } as any;

      const entries = extractMediaFromTweet(tweet, { screen_name: 'alice' });

      expect(entries).toHaveLength(2);
      expect(entries.map((entry) => entry.media_id)).toEqual(['photo-1', 'video-1']);
      expect(entries[0]).toMatchObject({
        tweet_id: 'tweet-1',
        screen_name: 'alice',
        type: 'photo',
        original_width: 1920,
        original_height: 1080,
        alt_text: 'sunset',
        tweet_text: 'Look',
        sourceLocation: 'original',
      });
      expect(entries[1]).toMatchObject({
        type: 'video',
        download_url: 'https://video.twimg.com/high.mp4',
        aspect_ratio: [16, 9],
      });
    });

    it('extracts media from a quoted tweet and marks its source location', () => {
      const quoted = {
        rest_id: 'quoted-1',
        full_text: 'Quoted post',
        extended_entities: {
          media: [
            {
              type: 'photo',
              id_str: 'quoted-photo',
              media_url_https: 'https://pbs.twimg.com/media/quoted-photo.png',
            },
          ],
        },
      };
      const tweet = { quoted_status_result: { result: quoted } } as any;

      const entries = extractMediaFromTweet(tweet, { screen_name: 'bob' }, 'quoted');

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        tweet_id: 'quoted-1',
        media_id: 'quoted-photo',
        sourceLocation: 'quoted',
      });
    });
  });

  describe('legacy normalization', () => {
    it('promotes legacy tweet and user fields without mutating the input', () => {
      const tweet = {
        legacy: {
          id_str: 'legacy-1',
          full_text: 'Legacy text',
          extended_entities: { media: [] },
        },
      } as any;
      const user = {
        legacy: { screen_name: 'legacy-user', name: 'Legacy User' },
      } as any;

      const normalizedTweet = normalizeLegacyTweet(tweet);
      const normalizedUser = normalizeLegacyUser(user);

      expect(normalizedTweet).toMatchObject({
        id_str: 'legacy-1',
        full_text: 'Legacy text',
        extended_entities: { media: [] },
      });
      expect(normalizedUser).toMatchObject({ screen_name: 'legacy-user', name: 'Legacy User' });
      expect(tweet.id_str).toBeUndefined();
      expect(user.screen_name).toBeUndefined();
    });
  });
});
