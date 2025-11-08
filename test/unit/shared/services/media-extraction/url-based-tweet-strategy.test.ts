/**
 * @fileoverview UrlBasedTweetStrategy 테스트
 * @description URL 기반 트윗 정보 추출 전략 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import type { TweetInfo } from '@/shared/types/media.types.js';
import { UrlBasedTweetStrategy } from '@/shared/services/media-extraction/strategies/url-based-tweet-strategy.js';

// parseUsernameFast 모킹
vi.mock('@/shared/services/media/username-extraction-service.js', () => ({
  parseUsernameFast: vi.fn(() => null),
}));

describe('UrlBasedTweetStrategy', () => {
  setupGlobalTestIsolation();

  let strategy: UrlBasedTweetStrategy;
  let element: HTMLElement;

  beforeEach(() => {
    strategy = new UrlBasedTweetStrategy();
    element = document.createElement('div');
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { href: 'https://x.com/home' };
  });

  describe('strategy metadata', () => {
    it('should have correct name and priority', () => {
      expect(strategy.name).toBe('url-based');
      expect(strategy.priority).toBe(2);
    });
  });

  describe('extractTweetIdFromUrl', () => {
    it('should extract tweet ID from status URL', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should extract tweet ID from URL with query params', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890?s=20' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });

    it('should extract tweet ID from URL with hash', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890#reply' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });

    it('should extract tweet ID from twitter.com domain', async () => {
      (window as any).location = { href: 'https://twitter.com/testuser/status/9876543210' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('9876543210');
    });

    it('should return null if no status in URL', async () => {
      (window as any).location = { href: 'https://x.com/testuser' };

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should return null if status without tweet ID', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/' };

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle photo URL with status', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890/photo/1' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle video URL with status', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890/video/1' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });
  });

  describe('extractUsernameFromUrl', () => {
    it('should extract username from twitter.com URL', async () => {
      (window as any).location = { href: 'https://twitter.com/elonmusk/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.username).toBe('elonmusk');
    });

    it('should extract username from x.com URL', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.username).toBe('testuser');
    });

    it('should extract username with underscores', async () => {
      (window as any).location = { href: 'https://x.com/test_user_123/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.username).toBe('test_user_123');
    });

    it('should return null if username is "fallback"', async () => {
      (window as any).location = { href: 'https://x.com/fallback/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should return null if no username in URL', async () => {
      (window as any).location = { href: 'https://x.com/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('tweetUrl construction', () => {
    it('should construct correct tweetUrl', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.tweetUrl).toBe('https://twitter.com/testuser/status/1234567890');
    });

    it('should use extracted username in tweetUrl', async () => {
      (window as any).location = { href: 'https://x.com/elonmusk/status/9999999999' };

      const result = await strategy.extract(element);

      expect(result?.tweetUrl).toBe('https://twitter.com/elonmusk/status/9999999999');
    });
  });

  describe('confidence and metadata', () => {
    it('should have confidence of 0.8', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.confidence).toBe(0.8);
    });

    it('should include sourceUrl in metadata', async () => {
      const url = 'https://x.com/testuser/status/1234567890';
      (window as any).location = { href: url };

      const result = await strategy.extract(element);

      expect(result?.metadata?.sourceUrl).toBe(url);
    });

    it('should have correct extractionMethod', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.extractionMethod).toBe('url-based');
    });
  });

  describe('error handling', () => {
    it('should return null on extraction error', async () => {
      // Invalid URL 구조
      (window as any).location = { href: 'invalid-url' };

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle malformed URL gracefully', async () => {
      (window as any).location = { href: 'https://x.com/////////status///' };

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle empty href', async () => {
      (window as any).location = { href: '' };

      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle URL with multiple slashes', async () => {
      (window as any).location = { href: 'https://x.com//testuser//status//1234567890' };

      const result = await strategy.extract(element);

      // 정규식 패턴이 엄격하므로 실패할 수 있음
      expect(result).toBeNull();
    });

    it('should handle URL with special characters in username', async () => {
      (window as any).location = { href: 'https://x.com/test-user/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.username).toBe('test-user');
    });

    it('should handle very long tweet ID', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/99999999999999999999' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('99999999999999999999');
    });

    it('should handle URL with port number', async () => {
      (window as any).location = { href: 'https://twitter.com:443/testuser/status/1234567890' };

      const result = await strategy.extract(element);

      // twitter.com 패턴 매칭이 포트를 포함하지 않을 수 있음
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should ignore element parameter', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890' };
      element.setAttribute('data-tweet-id', '9999999999');

      const result = await strategy.extract(element);

      // URL 기반이므로 element 속성은 무시
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle quoted tweet URL', async () => {
      (window as any).location = {
        href: 'https://x.com/testuser/status/1234567890/quote/9876543210',
      };

      const result = await strategy.extract(element);

      // 첫 번째 status ID 추출
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle retweet URL', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890/retweets' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle analytics URL', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890/analytics' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle mobile URL format', async () => {
      (window as any).location = { href: 'https://mobile.twitter.com/testuser/status/1234567890' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle URL with fragment identifier', async () => {
      (window as any).location = { href: 'https://x.com/testuser/status/1234567890#m' };

      const result = await strategy.extract(element);

      expect(result?.tweetId).toBe('1234567890');
    });
  });

  describe('parseUsernameFast fallback', () => {
    it('should use parseUsernameFast if URL extraction fails', async () => {
      // URL에 username이 없는 경우
      (window as any).location = { href: 'https://x.com/status/1234567890' };

      // parseUsernameFast도 실패하는 경우
      const result = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });
});
