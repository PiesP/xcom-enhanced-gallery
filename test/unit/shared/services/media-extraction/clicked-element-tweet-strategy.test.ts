import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClickedElementTweetStrategy } from '../../../../../src/shared/services/media-extraction/strategies/clicked-element-tweet-strategy.js';
import type { TweetInfo } from '../../../../../src/shared/types/media.types.js';

describe('ClickedElementTweetStrategy', () => {
  let strategy: ClickedElementTweetStrategy;

  beforeEach(() => {
    strategy = new ClickedElementTweetStrategy();
    // Reset window.location for each test
    delete (window as any).location;
    (window as any).location = {
      href: 'https://x.com/testuser/status/123456789',
      pathname: '/testuser/status/123456789',
    };
  });

  describe('strategy metadata', () => {
    it('should have correct name and priority', () => {
      expect(strategy.name).toBe('clicked-element');
      expect(strategy.priority).toBe(1);
    });
  });

  describe('extractFromDataAttributes', () => {
    it('should extract from data-tweet-id', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1234567890');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.extractionMethod).toBe('clicked-element-data-attributes');
    });

    it('should extract from data-item-id', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-item-id', '9876543210');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('9876543210');
    });

    it('should extract from data-testid if numeric', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', '1111111111');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1111111111');
    });

    it('should ignore data-testid if non-numeric', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'tweet-item');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should extract from data-focusable if numeric', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-focusable', '2222222222');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('2222222222');
    });

    it('should prioritize data-tweet-id over others', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1111111111');
      element.setAttribute('data-item-id', '2222222222');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.tweetId).toBe('1111111111');
    });
  });

  describe('extractTweetIdFromAriaLabel', () => {
    it('should extract from aria-labelledby with id__ pattern', async () => {
      const element = document.createElement('div');
      element.setAttribute('aria-labelledby', 'id__1234567890 id__9876543210');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.extractionMethod).toBe('clicked-element-aria-labelledby');
    });

    it('should handle single aria-labelledby', async () => {
      const element = document.createElement('div');
      element.setAttribute('aria-labelledby', 'id__9999999999');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('9999999999');
    });

    it('should return null if aria-labelledby has no id__ pattern', async () => {
      const element = document.createElement('div');
      element.setAttribute('aria-labelledby', 'some-other-id');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('extractTweetIdFromUrl', () => {
    it('should extract from href with /status/ pattern', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', '/testuser/status/1234567890');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.extractionMethod).toBe('clicked-element-href-attribute');
    });

    it('should extract from full URL with /status/', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', 'https://twitter.com/testuser/status/9876543210');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('9876543210');
    });

    it('should extract from /photo/ URL using current page URL', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', '/testuser/status/123456789/photo/1');

      // Current page URL has tweet ID
      (window as any).location = {
        href: 'https://x.com/testuser/status/123456789',
        pathname: '/testuser/status/123456789',
      };

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('123456789');
    });

    it('should return null if /photo/ and no tweet in current URL', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', '/photo/1');

      (window as any).location = { href: 'https://x.com/home', pathname: '/home' };

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });
  });

  describe('buildTweetInfo', () => {
    it('should build complete TweetInfo with username', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1234567890');
      const parent = document.createElement('div');
      const usernameLink = document.createElement('a');
      usernameLink.setAttribute('href', '/testuser');
      parent.appendChild(usernameLink);
      parent.appendChild(element);

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.username).toBe('testuser');
      expect(result?.tweetUrl).toBe('https://twitter.com/testuser/status/1234567890');
      expect(result?.confidence).toBe(0.9);
      expect(result?.metadata?.element).toBe('div');
    });

    it('should use "unknown" if username extraction fails', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1234567890');

      (window as any).location = { href: 'https://x.com/home', pathname: '/home' };

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeDefined();
      expect(result?.username).toBe('unknown');
      expect(result?.tweetUrl).toBe('https://twitter.com/unknown/status/1234567890');
    });

    it('should include extraction method in metadata', async () => {
      const element = document.createElement('div');
      element.setAttribute('aria-labelledby', 'id__1234567890');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.extractionMethod).toBe('clicked-element-aria-labelledby');
      expect(result?.metadata?.method).toBe('aria-labelledby');
    });
  });

  describe('extractUsername', () => {
    it('should extract username from parent link', async () => {
      const element = document.createElement('img');
      element.setAttribute('data-tweet-id', '1234567890');
      const article = document.createElement('article');
      const usernameLink = document.createElement('a');
      usernameLink.setAttribute('href', '/elonmusk');
      article.appendChild(usernameLink);
      article.appendChild(element);

      // Override window.location to avoid fallback to URL username
      (window as any).location = { href: 'https://x.com/home', pathname: '/home' };

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.username).toBe('elonmusk');
    });

    it('should ignore /status/ links when finding username', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1234567890');
      const parent = document.createElement('div');
      const statusLink = document.createElement('a');
      statusLink.setAttribute('href', '/testuser/status/1234567890');
      const usernameLink = document.createElement('a');
      usernameLink.setAttribute('href', '/testuser');
      parent.appendChild(statusLink);
      parent.appendChild(usernameLink);
      parent.appendChild(element);

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.username).toBe('testuser');
    });

    it('should ignore /photo/ links when finding username', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1234567890');
      const parent = document.createElement('div');
      const photoLink = document.createElement('a');
      photoLink.setAttribute('href', '/testuser/status/1234567890/photo/1');
      const usernameLink = document.createElement('a');
      usernameLink.setAttribute('href', '/testuser');
      parent.appendChild(photoLink);
      parent.appendChild(usernameLink);
      parent.appendChild(element);

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.username).toBe('testuser');
    });

    it('should extract username from current URL pathname', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1234567890');

      (window as any).location = {
        href: 'https://x.com/testuser/status/1234567890',
        pathname: '/testuser/status/1234567890',
      };

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.username).toBe('testuser');
    });

    it('should traverse up to 10 parent levels', async () => {
      const element = document.createElement('span');
      element.setAttribute('data-tweet-id', '1234567890');

      // Create deep nesting (15 levels)
      let current: HTMLElement = element;
      for (let i = 0; i < 15; i++) {
        const parent = document.createElement('div');
        parent.appendChild(current);
        current = parent;
      }

      // Add username link at level 11 (should NOT be found)
      const deepUsernameLink = document.createElement('a');
      deepUsernameLink.setAttribute('href', '/deepuser');
      current.appendChild(deepUsernameLink);

      // But current URL has username
      (window as any).location = {
        href: 'https://x.com/urluser/status/1234567890',
        pathname: '/urluser/status/1234567890',
      };

      const result: TweetInfo | null = await strategy.extract(element);

      // Should use URL username since parent traversal stopped at 10 levels
      expect(result?.username).toBe('urluser');
    });
  });

  describe('error handling', () => {
    it('should return null on extraction error', async () => {
      const element = document.createElement('div');
      // Cause error by making querySelector throw
      vi.spyOn(element, 'querySelector').mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle null element gracefully', async () => {
      const result: TweetInfo | null = await strategy.extract(null as any);

      expect(result).toBeNull();
    });
  });

  describe('extraction priority', () => {
    it('should prioritize data-attributes over aria-labelledby', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1111111111');
      element.setAttribute('aria-labelledby', 'id__2222222222');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.tweetId).toBe('1111111111');
      expect(result?.extractionMethod).toBe('clicked-element-data-attributes');
    });

    it('should prioritize data-attributes over href', async () => {
      const element = document.createElement('a');
      element.setAttribute('data-tweet-id', '1111111111');
      element.setAttribute('href', '/testuser/status/2222222222');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.tweetId).toBe('1111111111');
      expect(result?.extractionMethod).toBe('clicked-element-data-attributes');
    });

    it('should prioritize aria-labelledby over href', async () => {
      const element = document.createElement('a');
      element.setAttribute('aria-labelledby', 'id__1111111111');
      element.setAttribute('href', '/testuser/status/2222222222');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result?.tweetId).toBe('1111111111');
      expect(result?.extractionMethod).toBe('clicked-element-aria-labelledby');
    });
  });

  describe('edge cases', () => {
    it('should handle empty data attributes', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle non-numeric data-tweet-id', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', 'abc123');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle malformed href', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', 'javascript:void(0)');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle elements without any identifiers', async () => {
      const element = document.createElement('div');

      const result: TweetInfo | null = await strategy.extract(element);

      expect(result).toBeNull();
    });

    it('should handle username link with multiple slashes', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-tweet-id', '1234567890');
      const parent = document.createElement('div');
      const invalidLink = document.createElement('a');
      invalidLink.setAttribute('href', '/user/extra/path');
      parent.appendChild(invalidLink);
      parent.appendChild(element);

      (window as any).location = {
        href: 'https://x.com/testuser/status/1234567890',
        pathname: '/testuser/status/1234567890',
      };

      const result: TweetInfo | null = await strategy.extract(element);

      // Should fall back to URL username
      expect(result?.username).toBe('testuser');
    });
  });
});
