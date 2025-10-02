/**
 * @file url-hostname-validation.test.ts
 * @description SECURITY-HARDENING-001: URL hostname validation tests
 * RED tests for CodeQL issue: js/incomplete-url-substring-sanitization
 */

import { describe, expect, it } from 'vitest';
import { isTrustedHostname, TWITTER_MEDIA_HOSTS } from '@shared/utils/url-safety';

describe('SECURITY-HARDENING-001: URL hostname validation', () => {
  describe('RED: Detect substring sanitization vulnerability', () => {
    it('should reject URLs with hostname in query parameter', () => {
      const maliciousUrls = [
        'https://evil.com?url=https://pbs.twimg.com/image.jpg',
        'https://attacker.com/redirect?to=pbs.twimg.com',
        'https://phishing.com#pbs.twimg.com',
        'https://bad.com/path/pbs.twimg.com/fake.jpg',
      ];

      for (const url of maliciousUrls) {
        const result = isTrustedHostname(url, TWITTER_MEDIA_HOSTS);
        expect(result).toBe(false);
      }
    });

    it('should reject URLs with hostname-like strings in path', () => {
      const maliciousUrls = [
        'https://evil.com/pbs.twimg.com',
        'https://attacker.com/folder/pbs.twimg.com/image.jpg',
        'http://phishing.net/video.twimg.com/player',
      ];

      for (const url of maliciousUrls) {
        const result = isTrustedHostname(url, TWITTER_MEDIA_HOSTS);
        expect(result).toBe(false);
      }
    });

    it('should reject URLs with subdomain spoofing', () => {
      const maliciousUrls = [
        'https://pbs.twimg.com.evil.com/image.jpg',
        'https://fake-pbs.twimg.com/image.jpg',
        'https://pbstwimg.com/image.jpg',
      ];

      for (const url of maliciousUrls) {
        const result = isTrustedHostname(url, TWITTER_MEDIA_HOSTS);
        expect(result).toBe(false);
      }
    });
  });

  describe('GREEN: Accept valid Twitter media URLs', () => {
    it('should accept genuine Twitter media URLs', () => {
      const validUrls = [
        'https://pbs.twimg.com/media/abc123.jpg',
        'https://pbs.twimg.com/media/xyz.png?format=jpg&name=large',
        'https://video.twimg.com/tweet_video/test.mp4',
        'https://video.twimg.com/amplify_video/12345/vid/1280x720/video.mp4',
      ];

      for (const url of validUrls) {
        const result = isTrustedHostname(url, TWITTER_MEDIA_HOSTS);
        expect(result).toBe(true);
      }
    });

    it('should handle case-insensitive hostname matching', () => {
      const urls = [
        'https://PBS.TWIMG.COM/media/image.jpg',
        'https://Pbs.Twimg.Com/media/image.jpg',
        'https://VIDEO.TWIMG.COM/video.mp4',
      ];

      for (const url of urls) {
        const result = isTrustedHostname(url, TWITTER_MEDIA_HOSTS);
        expect(result).toBe(true);
      }
    });
  });

  describe('Edge cases', () => {
    it('should reject empty or invalid URLs', () => {
      const invalidUrls = ['', ' ', 'not-a-url', 'javascript:alert(1)'];

      for (const url of invalidUrls) {
        const result = isTrustedHostname(url, TWITTER_MEDIA_HOSTS);
        expect(result).toBe(false);
      }
    });

    it('should reject non-HTTPS protocols by default', () => {
      const result = isTrustedHostname('http://pbs.twimg.com/image.jpg', TWITTER_MEDIA_HOSTS);
      expect(result).toBe(false);
    });

    it('should accept HTTP when explicitly allowed', () => {
      const result = isTrustedHostname('http://pbs.twimg.com/image.jpg', TWITTER_MEDIA_HOSTS, {
        allowedProtocols: ['https:', 'http:'],
      });
      expect(result).toBe(true);
    });
  });
});
