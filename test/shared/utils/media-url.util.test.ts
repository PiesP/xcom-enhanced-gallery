/**
 * 미디어 URL 유틸리티 실전 테스트
 * 실제 Twitter/X.com URL 패턴을 기반으로 한 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractOriginalImageUrl,
  cleanFilename,
  isValidMediaUrl,
} from '@shared/utils/media/media-url.util';

describe('Media URL Utility - Real-world Scenarios', () => {
  describe('Real Twitter URL Processing', () => {
    it('should handle actual Twitter image URLs', () => {
      const realUrls = [
        'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg?format=jpg&name=large',
        'https://pbs.twimg.com/media/F1a2b3c4d5e.png?format=png&name=orig',
        'https://pbs.twimg.com/media/F1a2b3c4d5e.webp?format=webp&name=medium',
      ];

      realUrls.forEach(url => {
        const result = extractOriginalImageUrl(url);
        expect(result).toBeTruthy();
        expect(result).toContain('pbs.twimg.com');
        expect(isValidMediaUrl(result)).toBe(true);
      });
    });

    it('should build correct original URLs for different formats', () => {
      const testCases = [
        {
          input: 'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg?format=jpg&name=large',
          expected: 'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg?format=jpg&name=orig',
        },
        {
          input: 'https://pbs.twimg.com/media/F1a2b3c4d5e.png?format=png&name=medium',
          expected: 'https://pbs.twimg.com/media/F1a2b3c4d5e.png?format=png&name=orig',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractOriginalImageUrl(input);
        expect(result).toBe(expected);
      });
    });

    it('should generate clean filenames from Twitter media URLs', () => {
      const testCases = [
        {
          url: 'https://pbs.twimg.com/media/F1a2b3c4d5e.jpg?format=jpg&name=orig',
          shouldContain: 'F1a2b3c4d5e',
        },
        {
          url: 'https://pbs.twimg.com/media/AbCdEfGh123.png?format=png&name=large',
          shouldContain: 'AbCdEfGh123',
        },
      ];

      testCases.forEach(({ url, shouldContain }) => {
        const result = cleanFilename(url);
        expect(result).toContain(shouldContain);
      });
    });
  });

  describe('Video URL Processing', () => {
    it('should handle Twitter video URLs', () => {
      const videoUrls = [
        'https://video.twimg.com/ext_tw_video/1234567890/pu/vid/720x1280/video.mp4?tag=12',
        'https://video.twimg.com/amplify_video/1234567890/vid/1280x720/video.mp4?tag=14',
      ];

      videoUrls.forEach(url => {
        expect(url).toContain('video.twimg.com');
        expect(isValidMediaUrl(url)).toBe(true);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed URLs gracefully', () => {
      const malformedUrls = [
        '',
        'not-a-url',
        'https://example.com/image.jpg',
        'https://pbs.twimg.com/media/', // incomplete
      ];

      malformedUrls.forEach(url => {
        expect(() => extractOriginalImageUrl(url)).not.toThrow();
        expect(() => cleanFilename(url)).not.toThrow();
        expect(() => isValidMediaUrl(url)).not.toThrow();
      });
    });

    it('should validate URL security', () => {
      const suspiciousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'https://evil.com/fake-twimg.com/media/image.jpg',
      ];

      suspiciousUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(false);
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should process large numbers of URLs efficiently', () => {
      const startTime = Date.now();
      const urls = Array(1000)
        .fill(0)
        .map((_, i) => `https://pbs.twimg.com/media/F${i}a2b3c4d5e.jpg?format=jpg&name=large`);

      urls.forEach(url => {
        extractOriginalImageUrl(url);
        isValidMediaUrl(url);
        cleanFilename(url);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should process 1000 URLs in less than 1000ms (reasonable performance expectation)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('URL Pattern Matching', () => {
    it('should correctly identify different Twitter CDN patterns', () => {
      const patterns = [
        { url: 'https://pbs.twimg.com/media/image.jpg', valid: true },
        { url: 'https://video.twimg.com/ext_tw_video/123/video.mp4', valid: true },
        { url: 'https://ton.twimg.com/i/something.jpg', valid: false }, // Different subdomain
        { url: 'https://pbs.twimg.com.evil.com/media/image.jpg', valid: false }, // Domain spoofing
      ];

      patterns.forEach(({ url, valid }) => {
        expect(isValidMediaUrl(url)).toBe(valid);
      });
    });
  });
});
