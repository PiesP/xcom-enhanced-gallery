import { TwitterResponseParser } from '@shared/services/media/twitter-response-parser';
import type { TwitterTweet, TwitterUser, TwitterMedia } from '@shared/services/media/types';

describe('TwitterResponseParser Mutation Tests', () => {
  const mockUser: TwitterUser = {
    screen_name: 'testuser',
    name: 'Test User',
  };

  it('should skip media items missing id_str', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
            // missing id_str
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result).toHaveLength(0);
  });

  it('should handle photo without video_info', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
            // no video_info
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('photo');
  });

  it('should pick the first variant with highest bitrate', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'video',
            media_url_https: 'https://example.com/vid.jpg',
            video_info: {
              variants: [
                { content_type: 'video/mp4', bitrate: 100, url: 'low.mp4' },
                { content_type: 'video/mp4', bitrate: 500, url: 'high.mp4' },
                { content_type: 'video/mp4', bitrate: 500, url: 'high2.mp4' }, // same bitrate, should pick first one? Or last? Reduce logic: current > best. So 500 > 500 is false. Keeps first.
              ],
            },
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result).toHaveLength(1);
    expect(result[0]!.download_url).toBe('high.mp4');
  });

  it('should not replace extension if not at end of string', () => {
    // Testing regex /\.(jpg|png)$/
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/image.jpg.backup', // not ending in .jpg
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!.download_url).toBe('https://example.com/image.jpg.backup');
  });

  it('should extract photos correctly', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
          } as TwitterMedia,
        ],
      },
    };
    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('photo');
  });

  it('should handle partial note_tweet structure', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      note_tweet: {
        // missing note_tweet_results
      } as any,
    };
    TwitterResponseParser.normalizeLegacyTweet(tweet);
    expect(tweet.full_text).toBeUndefined();
  });

  // New tests for survivors

  it('should strip media url from tweet text', () => {
    const mediaUrl = 'https://t.co/xyz';
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: `Check this out ${mediaUrl}`,
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
            url: mediaUrl,
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!.tweet_text).toBe('Check this out');
  });

  it('should increment typeIndexOriginal for multiple items of same type', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img1.jpg',
          } as TwitterMedia,
          {
            id_str: 'm2',
            type: 'photo',
            media_url_https: 'https://example.com/img2.jpg',
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result).toHaveLength(2);
    expect(result[0]!.typeIndexOriginal).toBe(0);
    expect(result[1]!.typeIndexOriginal).toBe(1);
  });

  it('should preserve media keys and urls', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
            media_key: 'key123',
            expanded_url: 'https://expanded.com',
            display_url: 'display.com',
            url: 'https://t.co/xyz',
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!.media_key).toBe('key123');
    expect(result[0]!.expanded_url).toBe('https://expanded.com');
    expect(result[0]!.short_expanded_url).toBe('display.com');
    expect(result[0]!.short_tweet_url).toBe('https://t.co/xyz');
  });

  it('should not set original_width if resolvedWidth is missing', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg', // no dimensions in URL
            // no original_info
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!).not.toHaveProperty('original_width');
    expect(result[0]!).not.toHaveProperty('original_height');
  });

  it('should fallback to resolved dimensions for aspect ratio if video_info is missing', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
            original_info: { width: 800, height: 600 },
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!.aspect_ratio).toEqual([800, 600]);
  });

  it('should not process unknown media types even if variants exist', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'test',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'unknown_type',
            media_url_https: 'https://example.com/img.jpg',
            video_info: {
              variants: [{ content_type: 'video/mp4', bitrate: 100, url: 'video.mp4' }],
            },
          } as any,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result).toHaveLength(0);
  });

  it('should handle missing result in note_tweet_results', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      note_tweet: {
        note_tweet_results: {
          // missing result
        } as any,
      },
    };

    // Should not throw
    TwitterResponseParser.normalizeLegacyTweet(tweet);
    expect(tweet.full_text).toBeUndefined();
  });

  it('should trim whitespace from tweet text after url removal', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      full_text: 'Hello world https://t.co/xyz   ',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
            url: 'https://t.co/xyz',
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!.tweet_text).toBe('Hello world');
  });

  it('should handle null entries in media array gracefully', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      extended_entities: {
        media: [
          null as unknown as TwitterMedia,
          {
            id_str: 'm1',
            type: 'photo',
            media_url_https: 'https://example.com/img.jpg',
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result).toHaveLength(1);
    expect(result[0]!.media_id).toBe('m1');
  });

  it('should not use aspect ratio if one dimension is zero', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      extended_entities: {
        media: [
          {
            id_str: 'm1',
            type: 'video',
            media_url_https: 'https://example.com/video.mp4',
            video_info: {
              aspect_ratio: [16, 0],
              variants: [{ content_type: 'video/mp4', url: 'http://video.mp4', bitrate: 1000 }],
            },
            original_info: { width: 100, height: 100 },
          } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!.aspect_ratio).toEqual([100, 100]);
  });

  it('should increment typeIndex for multiple items of same type', () => {
    const tweet: TwitterTweet = {
      id_str: 'tweet123',
      extended_entities: {
        media: [
          { id_str: 'm1', type: 'photo', media_url_https: 'u1' } as TwitterMedia,
          { id_str: 'm2', type: 'photo', media_url_https: 'u2' } as TwitterMedia,
        ],
      },
    };

    const result = TwitterResponseParser.extractMediaFromTweet(tweet, mockUser);
    expect(result[0]!.typeIndex).toBe(0);
    expect(result[1]!.typeIndex).toBe(1);
  });
});
