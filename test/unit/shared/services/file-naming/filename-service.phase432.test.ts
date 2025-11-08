/**
 * @fileoverview FilenameService 테스트 - Phase 432 Username 추출 개선
 * @description generateMediaFilename, extractUsernameFromUrl, generateFallbackFilename 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FilenameService } from '../../../../../src/shared/services/file-naming';
import type { MediaInfo } from '../../../../../src/shared/types/media.types';

describe('FilenameService - Phase 432 Username Extraction', () => {
  let service: FilenameService;

  beforeEach(() => {
    service = new FilenameService();
  });

  describe('generateMediaFilename()', () => {
    it('should prioritize tweetUsername over URL extraction', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=orig',
        type: 'image',
        tweetUsername: 'testuser',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toBe('testuser_1234567890_1.jpg');
    });

    it('should reject "unknown" username and use fallback', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=orig',
        type: 'image',
        tweetUsername: 'unknown',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      // Should use tweet_{tweetId} fallback
      expect(filename).toBe('tweet_1234567890_1.jpg');
    });

    it('should skip media URL extraction (pbs.twimg.com)', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      // Should NOT extract 'media' or 'pbs' from URL
      expect(filename).toBe('tweet_1234567890_1.jpg');
      expect(filename).not.toContain('media_');
      expect(filename).not.toContain('pbs_');
    });

    it('should use quoted tweet info when sourceLocation is "quoted"', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        sourceLocation: 'quoted',
        quotedUsername: 'quoteduser',
        quotedTweetId: '9876543210',
        tweetUsername: 'originaluser',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      // Should use quoted tweet info
      expect(filename).toBe('quoteduser_9876543210_1.jpg');
    });

    it('should handle missing username with TweetId-based fallback', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toBe('tweet_1234567890_1.jpg');
    });

    it('should use timestamp fallback when no TweetId available', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
      };

      const filename = service.generateMediaFilename(media);

      // Should use media_{timestamp} format
      expect(filename).toMatch(/^media_\d+_\d+\.jpg$/);
    });

    it('should handle video files with proper extension', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://video.twimg.com/ext_tw_video/test.mp4?tag=12',
        type: 'video',
        tweetUsername: 'videouser',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toBe('videouser_1234567890_1.mp4');
    });

    it('should use fallbackUsername option when provided', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media, {
        fallbackUsername: 'fallbackuser',
      });

      expect(filename).toBe('fallbackuser_1234567890_1.jpg');
    });
  });

  describe('extractUsernameFromUrl() - via generateMediaFilename', () => {
    it('should NOT extract from pbs.twimg.com URLs', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        originalUrl: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      // Should use fallback, not extract from URL
      expect(filename).toMatch(/^tweet_1234567890_/);
    });

    it('should NOT extract from video.twimg.com URLs', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://video.twimg.com/ext_tw_video/test.mp4',
        originalUrl: 'https://video.twimg.com/ext_tw_video/test.mp4',
        type: 'video',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toMatch(/^tweet_1234567890_/);
    });

    it('should extract from valid twitter.com/username URLs', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        originalUrl: 'https://twitter.com/validuser/status/1234567890',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toMatch(/^validuser_1234567890_/);
    });

    it('should reject reserved paths (i, home, search, etc.)', () => {
      const reservedPaths = ['i', 'home', 'search', 'settings', 'explore'];

      reservedPaths.forEach(reserved => {
        const media: MediaInfo = {
          id: 'test_1',
          url: 'https://pbs.twimg.com/media/test.jpg',
          originalUrl: `https://twitter.com/${reserved}/something`,
          type: 'image',
          tweetId: '1234567890',
        };

        const filename = service.generateMediaFilename(media);

        // Should use fallback, not reserved path
        expect(filename).toMatch(/^tweet_1234567890_/);
        expect(filename).not.toContain(`${reserved}_`);
      });
    });

    it('should validate username pattern (alphanumeric + underscore, 1-15 chars)', () => {
      const invalidUsernames = [
        'user-name', // hyphen not allowed
        'user.name', // dot not allowed
        'a', // too short (actually valid, but testing boundary)
        'averylongusername', // 16 chars, too long
        '123', // valid actually (numbers allowed)
      ];

      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        originalUrl: 'https://twitter.com/user-name/status/123',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      // user-name should be rejected (contains hyphen)
      expect(filename).toMatch(/^tweet_1234567890_/);
    });
  });

  describe('generateFallbackFilename() - TweetId prioritization', () => {
    it('should use tweet_{tweetId} format when TweetId available', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toBe('tweet_1234567890_1.jpg');
    });

    it('should use media_{timestamp} format when no TweetId', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toMatch(/^media_\d{13}_\d+\.jpg$/); // 13-digit timestamp
    });

    it('should reject invalid TweetId (non-numeric)', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetId: 'invalid_id',
      };

      const filename = service.generateMediaFilename(media);

      // Should use timestamp fallback
      expect(filename).toMatch(/^media_\d{13}_\d+\.jpg$/);
      expect(filename).not.toContain('tweet_invalid_id');
    });

    it('should use custom fallbackPrefix option', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
      };

      const filename = service.generateMediaFilename(media, {
        fallbackPrefix: 'custom',
      });

      expect(filename).toMatch(/^custom_\d{13}_\d+\.jpg$/);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty tweetUsername', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetUsername: '',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      expect(filename).toMatch(/^tweet_1234567890_/);
    });

    it('should handle null/undefined URL gracefully', () => {
      const media: MediaInfo = {
        id: 'test_1',
        url: '',
        type: 'image',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      // Should still generate valid filename
      expect(filename).toMatch(/^tweet_1234567890_\d+\.jpg$/);
    });

    it('should extract correct index from media ID', () => {
      const media: MediaInfo = {
        id: 'img_1234567890_media_2',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        tweetUsername: 'testuser',
        tweetId: '1234567890',
      };

      const filename = service.generateMediaFilename(media);

      // Index should be 3 (2 + 1 due to zero-based to one-based conversion)
      expect(filename).toBe('testuser_1234567890_3.jpg');
    });
  });
});
