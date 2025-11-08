/**
 * @fileoverview Media Filter Tests
 * @description Tests for isEmojiUrl, isVideoThumbnailUrl, classifyMediaUrl (Phase 331-332)
 */

import { describe, it, expect } from 'vitest';
import {
  isEmojiUrl,
  isVideoThumbnailUrl,
  classifyMediaUrl,
  shouldIncludeMediaUrl,
  type MediaTypeResult,
} from '@shared/utils/media';

describe('Media Filter - Emoji Detection (Phase 331)', () => {
  describe('isEmojiUrl', () => {
    it('should identify emoji URLs from abs.twimg.com', () => {
      const emojiUrls = [
        'https://abs.twimg.com/emoji/v2/svg/1f600.svg',
        'https://abs-0.twimg.com/emoji/v1/72x72/1f44d.png',
        'https://abs-1.twimg.com/emoji/v2/36x36/1f389.png',
        'https://abs.twimg.com/emoji/v2/svg/2764-fe0f.svg',
      ];

      emojiUrls.forEach(url => {
        expect(isEmojiUrl(url), `Should identify ${url} as emoji`).toBe(true);
      });
    });

    it('should reject non-emoji URLs', () => {
      const nonEmojiUrls = [
        'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig',
        'https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/video.mp4',
        'https://pbs.twimg.com/profile_images/123/avatar.jpg',
        'https://abs.twimg.com/not-emoji/v2/image.png', // abs host but not emoji path
      ];

      nonEmojiUrls.forEach(url => {
        expect(isEmojiUrl(url), `Should reject ${url} as non-emoji`).toBe(false);
      });
    });

    it('should handle invalid inputs gracefully', () => {
      expect(isEmojiUrl('')).toBe(false);
      expect(isEmojiUrl(null as unknown as string)).toBe(false);
      expect(isEmojiUrl(undefined as unknown as string)).toBe(false);
      expect(isEmojiUrl('not-a-url')).toBe(false);
    });

    it('should validate hostname pattern strictly', () => {
      // Valid: abs.twimg.com, abs-0.twimg.com, abs-999.twimg.com
      expect(isEmojiUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg')).toBe(true);
      expect(isEmojiUrl('https://abs-0.twimg.com/emoji/v2/svg/1f600.svg')).toBe(true);
      expect(isEmojiUrl('https://abs-999.twimg.com/emoji/v2/svg/1f600.svg')).toBe(true);

      // Invalid: wrong hostname
      expect(isEmojiUrl('https://pbs.twimg.com/emoji/v2/svg/1f600.svg')).toBe(false);
      expect(isEmojiUrl('https://abs-invalid.twimg.com/emoji/v2/svg/1f600.svg')).toBe(false);
    });

    it('should validate emoji path format strictly', () => {
      // Valid: /emoji/v<N>/(svg|<size>x<size>)/
      expect(isEmojiUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg')).toBe(true);
      expect(isEmojiUrl('https://abs.twimg.com/emoji/v1/72x72/1f600.png')).toBe(true);
      expect(isEmojiUrl('https://abs.twimg.com/emoji/v2/36x36/1f600.png')).toBe(true);

      // Invalid: wrong path structure
      expect(isEmojiUrl('https://abs.twimg.com/emoji/1f600.svg')).toBe(false); // missing version
      expect(isEmojiUrl('https://abs.twimg.com/emoji/v2/1f600.svg')).toBe(false); // missing format
    });
  });
});

describe('Media Filter - Video Thumbnail Detection (Phase 332)', () => {
  describe('isVideoThumbnailUrl', () => {
    it('should identify video thumbnail URLs', () => {
      const videoThumbnailUrls = [
        'https://pbs.twimg.com/amplify_video_thumb/1931629000243453952/img/wzXQeHFbVbPENOya?format=jpg&name=orig',
        'https://pbs.twimg.com/ext_tw_video_thumb/1234567890/img/abc123.jpg',
        'https://pbs.twimg.com/tweet_video_thumb/9876543210/img/def456.jpg',
        'https://pbs.twimg.com/ad_img/amplify_video/1111111111/thumbnail.jpg',
      ];

      videoThumbnailUrls.forEach(url => {
        expect(isVideoThumbnailUrl(url), `Should identify ${url} as video thumbnail`).toBe(true);
      });
    });

    it('should reject non-thumbnail media URLs', () => {
      const nonThumbnailUrls = [
        'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig', // regular image
        'https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/video.mp4', // actual video
        'https://pbs.twimg.com/profile_images/123/avatar.jpg', // profile image
        'https://abs.twimg.com/emoji/v2/svg/1f600.svg', // emoji
      ];

      nonThumbnailUrls.forEach(url => {
        expect(isVideoThumbnailUrl(url), `Should reject ${url} as non-thumbnail`).toBe(false);
      });
    });

    it('should handle invalid inputs gracefully', () => {
      expect(isVideoThumbnailUrl('')).toBe(false);
      expect(isVideoThumbnailUrl(null as unknown as string)).toBe(false);
      expect(isVideoThumbnailUrl(undefined as unknown as string)).toBe(false);
      expect(isVideoThumbnailUrl('not-a-url')).toBe(false);
    });

    it('should validate hostname strictly (pbs.twimg.com only)', () => {
      expect(isVideoThumbnailUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg')).toBe(
        true
      );
      expect(
        isVideoThumbnailUrl('https://video.twimg.com/amplify_video_thumb/123/img/abc.jpg')
      ).toBe(false);
      expect(isVideoThumbnailUrl('https://abs.twimg.com/amplify_video_thumb/123/img/abc.jpg')).toBe(
        false
      );
    });

    it('should validate all thumbnail path patterns', () => {
      // amplify_video_thumb
      expect(isVideoThumbnailUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg')).toBe(
        true
      );

      // ext_tw_video_thumb
      expect(isVideoThumbnailUrl('https://pbs.twimg.com/ext_tw_video_thumb/456/img/def.jpg')).toBe(
        true
      );

      // tweet_video_thumb
      expect(isVideoThumbnailUrl('https://pbs.twimg.com/tweet_video_thumb/789/img/ghi.jpg')).toBe(
        true
      );

      // ad_img/amplify_video
      expect(isVideoThumbnailUrl('https://pbs.twimg.com/ad_img/amplify_video/999/thumb.jpg')).toBe(
        true
      );
    });
  });
});

describe('Media Filter - Comprehensive Classification', () => {
  describe('classifyMediaUrl', () => {
    it('should classify regular images correctly', () => {
      const result = classifyMediaUrl('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig');
      expect(result.type).toBe('image');
      expect(result.shouldInclude).toBe(true);
      expect(result.hostname).toBe('pbs.twimg.com');
      expect(result.reason).toBeUndefined();
    });

    it('should classify videos correctly', () => {
      const result = classifyMediaUrl(
        'https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/video.mp4'
      );
      expect(result.type).toBe('video');
      expect(result.shouldInclude).toBe(true);
      expect(result.hostname).toBe('video.twimg.com');
      expect(result.reason).toBeUndefined();
    });

    it('should filter emoji URLs', () => {
      const result = classifyMediaUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg');
      expect(result.type).toBe('emoji');
      expect(result.shouldInclude).toBe(false);
      expect(result.reason).toContain('Emoji URLs are filtered');
      expect(result.hostname).toBe('abs.twimg.com');
    });

    it('should filter video thumbnail URLs', () => {
      const result = classifyMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg');
      expect(result.type).toBe('video-thumbnail');
      expect(result.shouldInclude).toBe(false);
      expect(result.reason).toContain('Video thumbnails are skipped');
      expect(result.hostname).toBe('pbs.twimg.com');
    });

    it('should handle unknown URLs', () => {
      const unknownUrls = [
        'https://example.com/image.jpg',
        'https://pbs.twimg.com/profile_images/123/avatar.jpg',
        'https://video.twimg.com/unknown/path/video.mp4',
      ];

      unknownUrls.forEach(url => {
        const result = classifyMediaUrl(url);
        expect(result.type, `${url} should be classified as unknown`).toBe('unknown');
        expect(result.shouldInclude, `${url} should not be included`).toBe(false);
        expect(result.reason).toBeDefined();
      });
    });

    it('should handle invalid inputs', () => {
      const invalidInputs = ['', null, undefined, 'not-a-url', 'ftp://invalid.com/file.jpg'];

      invalidInputs.forEach(input => {
        const result = classifyMediaUrl(input as string);
        expect(result.type).toBe('unknown');
        expect(result.shouldInclude).toBe(false);
        expect(result.reason).toBeDefined();
      });
    });

    it('should prioritize emoji filtering over other classifications', () => {
      // Even if path contains 'media', emoji hostname takes precedence
      const result = classifyMediaUrl('https://abs.twimg.com/emoji/v2/svg/media.svg');
      expect(result.type).toBe('emoji');
      expect(result.shouldInclude).toBe(false);
    });

    it('should prioritize video thumbnail filtering over regular images', () => {
      // Thumbnail path takes precedence over pbs.twimg.com hostname
      const result = classifyMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg');
      expect(result.type).toBe('video-thumbnail');
      expect(result.shouldInclude).toBe(false);
    });
  });

  describe('shouldIncludeMediaUrl', () => {
    it('should return true for valid images', () => {
      expect(shouldIncludeMediaUrl('https://pbs.twimg.com/media/ABC123?format=jpg')).toBe(true);
    });

    it('should return true for valid videos', () => {
      expect(
        shouldIncludeMediaUrl('https://video.twimg.com/ext_tw_video/123/pu/vid/video.mp4')
      ).toBe(true);
    });

    it('should return false for emoji URLs', () => {
      expect(shouldIncludeMediaUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg')).toBe(false);
    });

    it('should return false for video thumbnails', () => {
      expect(
        shouldIncludeMediaUrl('https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg')
      ).toBe(false);
    });

    it('should return false for invalid/unknown URLs', () => {
      expect(shouldIncludeMediaUrl('')).toBe(false);
      expect(shouldIncludeMediaUrl('not-a-url')).toBe(false);
      expect(shouldIncludeMediaUrl('https://example.com/image.jpg')).toBe(false);
    });
  });
});

describe('Media Filter - Real-world Edge Cases', () => {
  it('should handle emoji URLs with query parameters', () => {
    const result = classifyMediaUrl('https://abs.twimg.com/emoji/v2/svg/1f600.svg?v=12345');
    expect(result.type).toBe('emoji');
    expect(result.shouldInclude).toBe(false);
  });

  it('should handle video thumbnail URLs with multiple query parameters', () => {
    const result = classifyMediaUrl(
      'https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg?format=jpg&name=orig&v=1'
    );
    expect(result.type).toBe('video-thumbnail');
    expect(result.shouldInclude).toBe(false);
  });

  it('should handle URLs with encoded characters', () => {
    const result = classifyMediaUrl('https://pbs.twimg.com/media/ABC%20123?format=jpg&name=orig');
    expect(result.type).toBe('image');
    expect(result.shouldInclude).toBe(true);
  });

  it('should handle video URLs with tag parameter', () => {
    const result = classifyMediaUrl(
      'https://video.twimg.com/ext_tw_video/123/pu/vid/video.mp4?tag=12'
    );
    expect(result.type).toBe('video');
    expect(result.shouldInclude).toBe(true);
  });

  it('should handle mixed-case hostnames', () => {
    const result = classifyMediaUrl('https://PBS.TWIMG.COM/media/ABC123?format=jpg');
    expect(result.type).toBe('image');
    expect(result.shouldInclude).toBe(true);
  });

  it('should handle protocol-relative URLs gracefully', () => {
    // These should fail URL parsing but not crash
    const result = classifyMediaUrl('//pbs.twimg.com/media/ABC123');
    expect(result.type).toBe('unknown');
    expect(result.shouldInclude).toBe(false);
  });
});

describe('Media Filter - Performance & Caching', () => {
  it('should use cached regex patterns efficiently', () => {
    // Test that multiple calls don't recreate patterns
    const urls = Array(1000).fill('https://abs.twimg.com/emoji/v2/svg/1f600.svg');

    const startTime = performance.now();
    urls.forEach(url => isEmojiUrl(url));
    const endTime = performance.now();

    // Should complete quickly (< 50ms for 1000 calls)
    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should handle batch classification efficiently', () => {
    const testUrls = [
      'https://pbs.twimg.com/media/ABC123?format=jpg',
      'https://abs.twimg.com/emoji/v2/svg/1f600.svg',
      'https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg',
      'https://video.twimg.com/ext_tw_video/123/pu/vid/video.mp4',
    ];

    const startTime = performance.now();
    const results = testUrls.map(url => classifyMediaUrl(url));
    const endTime = performance.now();

    // Should complete very quickly (< 5ms for 4 classifications)
    expect(endTime - startTime).toBeLessThan(5);

    // Verify all results
    expect(results[0].type).toBe('image');
    expect(results[1].type).toBe('emoji');
    expect(results[2].type).toBe('video-thumbnail');
    expect(results[3].type).toBe('video');
  });
});
