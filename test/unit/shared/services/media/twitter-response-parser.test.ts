import { TwitterResponseParser } from '@shared/services/media/twitter-response-parser';
import type { TwitterMedia, TwitterTweet, TwitterUser } from '@shared/services/media/types';

// Mock logger to avoid console noise
vi.mock('@shared/logging');

describe('TwitterResponseParser', () => {
  describe('extractMediaFromTweet', () => {
    const mockUser: TwitterUser = {
      rest_id: '123',
      screen_name: 'testuser',
      name: 'Test User',
    };

    it('should return empty array if no extended_entities', () => {
      const tweet: TwitterTweet = {
        id_str: '100',
        full_text: 'Just text',
      };
      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
      expect(result).toEqual([]);
    });

    it('should extract photo media', () => {
      const media: TwitterMedia = {
        id_str: '200',
        media_key: 'key200',
        media_url_https: 'https://pbs.twimg.com/media/img.jpg',
        type: 'photo',
        url: 'https://t.co/xyz',
        display_url: 'pic.twitter.com/xyz',
        expanded_url: 'https://twitter.com/testuser/status/100/photo/1',
        original_info: { width: 1000, height: 800 },
      };

      const tweet: TwitterTweet = {
        id_str: '100',
        full_text: 'Check this out https://t.co/xyz',
        extended_entities: { media: [media] },
      };

      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          screen_name: 'testuser',
          tweet_id: '100',
          type: 'photo',
          download_url: 'https://pbs.twimg.com/media/img?format=jpg&name=orig',
          original_width: 1000,
          original_height: 800,
          index: 0,
        })
      );
    });

    it('should not derive aspect ratio when only width is resolved', () => {
      const media: TwitterMedia = {
        id_str: '201',
        media_key: 'key201',
        media_url_https: 'https://pbs.twimg.com/media/half.jpg',
        type: 'photo',
        url: 'https://t.co/half',
        original_info: { width: 4096 },
      };

      const tweet: TwitterTweet = {
        id_str: '110',
        full_text: 'Single dimension photo https://t.co/half',
        extended_entities: { media: [media] },
      };

      const [entry] = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);

      expect(entry?.original_width).toBe(4096);
      expect(entry?.original_height).toBeUndefined();
      expect(entry?.aspect_ratio).toBeUndefined();
    });

    it('should extract video media with highest bitrate', () => {
      const media: TwitterMedia = {
        id_str: '300',
        media_key: 'key300',
        media_url_https: 'https://pbs.twimg.com/media/vid.jpg',
        type: 'video',
        url: 'https://t.co/vid',
        video_info: {
          aspect_ratio: [16, 9],
          variants: [
            {
              content_type: 'application/x-mpegURL',
              url: 'https://video.m3u8',
            },
            {
              content_type: 'video/mp4',
              bitrate: 800000,
              url: 'https://video-low.mp4',
            },
            {
              content_type: 'video/mp4',
              bitrate: 2000000,
              url: 'https://video-high.mp4',
            },
          ],
        },
      };

      const tweet: TwitterTweet = {
        id_str: '101',
        full_text: 'Video tweet',
        extended_entities: { media: [media] },
      };

      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          type: 'video',
          download_url: 'https://video-high.mp4',
          aspect_ratio: [16, 9],
        })
      );
    });

    it('should handle animated_gif as video', () => {
      const media: TwitterMedia = {
        id_str: '400',
        media_key: 'key400',
        media_url_https: 'https://pbs.twimg.com/media/gif.jpg',
        type: 'animated_gif',
        url: 'https://t.co/gif',
        video_info: {
          variants: [{ content_type: 'video/mp4', bitrate: 0, url: 'https://gif.mp4' }],
        },
      };

      const tweet: TwitterTweet = {
        id_str: '102',
        full_text: 'GIF tweet',
        extended_entities: { media: [media] },
      };

      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('video');
      expect(result[0]?.typeOriginal).toBe('animated_gif');
      expect(result[0]?.download_url).toBe('https://gif.mp4');
    });

    it('should skip media without valid URL', () => {
      const media: TwitterMedia = {
        id_str: '500',
        type: 'photo',
        // Missing media_url_https
      } as TwitterMedia;

      const tweet: TwitterTweet = {
        id_str: '103',
        extended_entities: { media: [media] },
      };

      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
      expect(result).toHaveLength(0);
    });

    it('should skip video media when no mp4 variants are available', () => {
      const media: TwitterMedia = {
        id_str: '510',
        media_key: 'key510',
        media_url_https: 'https://pbs.twimg.com/media/no-mp4.jpg',
        type: 'video',
        video_info: {
          variants: [{ content_type: 'application/x-mpegURL', url: 'https://playlist.m3u8' }],
        },
      };

      const tweet: TwitterTweet = {
        id_str: '104',
        extended_entities: { media: [media] },
      };

      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
      expect(result).toEqual([]);
    });

    it('should skip video media gracefully when video_info is missing', () => {
      const media: TwitterMedia = {
        id_str: '511',
        media_key: 'key511',
        media_url_https: 'https://pbs.twimg.com/media/no-info.jpg',
        type: 'video',
      } as TwitterMedia;

      const tweet: TwitterTweet = {
        id_str: '105',
        extended_entities: { media: [media] },
      };

      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
      expect(result).toEqual([]);
    });

    it('should retain the highest bitrate variant even when it appears first', () => {
      const media: TwitterMedia = {
        id_str: '512',
        media_key: 'key512',
        media_url_https: 'https://pbs.twimg.com/media/high-first.jpg',
        type: 'video',
        video_info: {
          variants: [
            { content_type: 'video/mp4', bitrate: 3_000_000, url: 'https://video-ultra.mp4' },
            { content_type: 'video/mp4', bitrate: 1_000_000, url: 'https://video-mid.mp4' },
          ],
        },
      };

      const tweet: TwitterTweet = {
        id_str: '106',
        extended_entities: { media: [media] },
      };

      const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);

      expect(result).toHaveLength(1);
      expect(result[0]?.download_url).toBe('https://video-ultra.mp4');
    });
  });

  describe('normalizeLegacyTweet', () => {
    it('should copy legacy fields to top level', () => {
      const tweet: TwitterTweet = {
        legacy: {
          id_str: '999',
          full_text: 'Legacy text',
          extended_entities: { media: [] },
        },
      };

      TwitterResponseParser.normalizeLegacyTweet(tweet);

      expect(tweet.id_str).toBe('999');
      expect(tweet.full_text).toBe('Legacy text');
      expect(tweet.extended_entities).toEqual({ media: [] });
    });

    it('should not overwrite populated tweet fields with legacy data', () => {
      const legacyMedia: TwitterMedia = {
        id_str: '1',
        media_key: 'key',
        media_url_https: 'https://pbs.twimg.com/media/img.jpg',
        type: 'photo',
      };

      const tweet: TwitterTweet = {
        id_str: 'original',
        full_text: 'Original text',
        extended_entities: { media: [] },
        legacy: {
          id_str: 'legacy-id',
          full_text: 'Legacy text',
          extended_entities: { media: [legacyMedia] },
        },
      };

      TwitterResponseParser.normalizeLegacyTweet(tweet);

      expect(tweet.id_str).toBe('original');
      expect(tweet.full_text).toBe('Original text');
      expect(tweet.extended_entities).toEqual({ media: [] });
    });

    it('should prioritize note_tweet text', () => {
      const tweet: TwitterTweet = {
        full_text: 'Short text',
        note_tweet: {
          note_tweet_results: {
            result: {
              text: 'Long note tweet text',
            },
          },
        },
      };

      TwitterResponseParser.normalizeLegacyTweet(tweet);

      expect(tweet.full_text).toBe('Long note tweet text');
    });

    it('should ignore note tweet when results are incomplete', () => {
      const tweet: TwitterTweet = {
        full_text: 'Existing text',
        note_tweet: {
          note_tweet_results: {
            result: {},
          },
        },
      };

      TwitterResponseParser.normalizeLegacyTweet(tweet);

      expect(tweet.full_text).toBe('Existing text');
    });

    it('should leave tweet untouched when legacy payload is missing', () => {
      const tweet: TwitterTweet = {
        id_str: 'original',
        full_text: 'Original text',
        extended_entities: { media: [] },
      };

      expect(() => TwitterResponseParser.normalizeLegacyTweet(tweet)).not.toThrow();
      expect(tweet.id_str).toBe('original');
      expect(tweet.full_text).toBe('Original text');
    });
  });

  describe('normalizeLegacyUser', () => {
    it('should copy legacy user fields', () => {
      const user: TwitterUser = {
        rest_id: '888',
        legacy: {
          screen_name: 'legacy_user',
          name: 'Legacy Name',
        },
      };

      TwitterResponseParser.normalizeLegacyUser(user);

      expect(user.screen_name).toBe('legacy_user');
      expect(user.name).toBe('Legacy Name');
    });

    it('should not overwrite existing fields', () => {
      const user: TwitterUser = {
        rest_id: '888',
        screen_name: 'existing_user',
        legacy: {
          screen_name: 'legacy_user',
        },
      };

      TwitterResponseParser.normalizeLegacyUser(user);

      expect(user.screen_name).toBe('existing_user');
    });

    it('should not overwrite existing user names', () => {
      const user: TwitterUser = {
        rest_id: '999',
        screen_name: 'existing_user',
        name: 'Existing Name',
        legacy: {
          name: 'Legacy Name',
        },
      };

      TwitterResponseParser.normalizeLegacyUser(user);

      expect(user.name).toBe('Existing Name');
    });

    it('should no-op when legacy user payload is missing', () => {
      const user: TwitterUser = {
        rest_id: '777',
        screen_name: 'current',
        name: 'Current Name',
      };

      expect(() => TwitterResponseParser.normalizeLegacyUser(user)).not.toThrow();
      expect(user.screen_name).toBe('current');
      expect(user.name).toBe('Current Name');
    });
  });
});
