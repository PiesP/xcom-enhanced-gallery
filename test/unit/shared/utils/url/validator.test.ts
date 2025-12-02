import { isTwitterMediaUrl, isValidMediaUrl } from '@shared/utils/url/validator';

describe('URL Validator', () => {
  describe('isValidMediaUrl', () => {
    it('should return true for valid pbs.twimg.com media URLs', () => {
      expect(isValidMediaUrl('https://pbs.twimg.com/media/ABC.jpg')).toBe(true);
      expect(isValidMediaUrl('https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/ABC.jpg')).toBe(
        true
      );
      expect(isValidMediaUrl('https://pbs.twimg.com/tweet_video_thumb/ABC.jpg')).toBe(true);
      expect(isValidMediaUrl('https://pbs.twimg.com/video_thumb/ABC.jpg')).toBe(true);
    });

    it('should return true for valid video.twimg.com URLs', () => {
      expect(isValidMediaUrl('https://video.twimg.com/ext_tw_video/123/pu/vid/ABC.mp4')).toBe(true);
      expect(isValidMediaUrl('https://video.twimg.com/tweet_video/ABC.mp4')).toBe(true);
    });

    it('should return false for invalid domains', () => {
      expect(isValidMediaUrl('https://example.com/image.jpg')).toBe(false);
      expect(isValidMediaUrl('https://google.com')).toBe(false);
    });

    it('should return false for invalid paths on pbs.twimg.com', () => {
      expect(isValidMediaUrl('https://pbs.twimg.com/profile_images/123.jpg')).toBe(false);
      expect(isValidMediaUrl('https://pbs.twimg.com/banners/123.jpg')).toBe(false);
      expect(isValidMediaUrl('https://pbs.twimg.com/')).toBe(false);
    });

    it('should return false for invalid protocols', () => {
      expect(isValidMediaUrl('ftp://pbs.twimg.com/media/ABC.jpg')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidMediaUrl('not-a-url')).toBe(false);
      expect(isValidMediaUrl('')).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidMediaUrl(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidMediaUrl(undefined)).toBe(false);
    });

    it('should return false for URLs exceeding max length', () => {
      const longUrl = 'https://pbs.twimg.com/media/' + 'a'.repeat(2050);
      expect(isValidMediaUrl(longUrl)).toBe(false);
    });

    it('should return true for http protocol', () => {
      expect(isValidMediaUrl('http://pbs.twimg.com/media/ABC.jpg')).toBe(true);
    });

    it('should return false for URLs exactly at max length if they are otherwise invalid (or true if valid)', () => {
      // 2048 chars.
      // "https://pbs.twimg.com/media/" is 28 chars.
      // We need 2020 more chars.
      const validUrl = 'https://pbs.twimg.com/media/' + 'a'.repeat(2020);
      expect(validUrl.length).toBe(2048);
      expect(isValidMediaUrl(validUrl)).toBe(true);
    });
  });

  describe('isTwitterMediaUrl', () => {
    it('should return true for supported media hosts', () => {
      expect(isTwitterMediaUrl('https://pbs.twimg.com/media/ABC.jpg')).toBe(true);
      expect(isTwitterMediaUrl('https://video.twimg.com/ext_tw_video/123.mp4')).toBe(true);
    });

    it('should return false for unsupported hosts', () => {
      expect(isTwitterMediaUrl('https://twitter.com/home')).toBe(false);
      expect(isTwitterMediaUrl('https://x.com/home')).toBe(false);
      expect(isTwitterMediaUrl('https://example.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isTwitterMediaUrl('not-a-url')).toBe(false);
      expect(isTwitterMediaUrl('')).toBe(false);
    });
  });
});
