/**
 * Tweet Extraction Utilities Unit Tests
 */

import { extractTweetInfoUnified } from '@shared/utils/patterns/tweet-extraction';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('extractTweetInfoUnified', () => {
  let mockTweetContainer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTweetContainer = {
      querySelectorAll: vi.fn().mockReturnValue([]),
      querySelector: vi.fn().mockReturnValue(null),
      getAttribute: vi.fn().mockReturnValue(null),
      closest: vi.fn().mockReturnValue(null),
      textContent: '',
    };

    // Mock window location
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          href: 'https://x.com',
          pathname: '/',
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Link Extraction', () => {
    it('should extract tweet info from status links', () => {
      const mockStatusLink = {
        href: 'https://x.com/testuser/status/1234567890',
      };

      mockTweetContainer.querySelectorAll.mockReturnValue([mockStatusLink]);

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.tweetUrl).toBe('https://x.com/testuser/status/1234567890');
    });

    it('should handle twitter.com URLs', () => {
      const mockStatusLink = {
        href: 'https://twitter.com/testuser/status/1234567890',
      };

      mockTweetContainer.querySelectorAll.mockReturnValue([mockStatusLink]);

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.tweetUrl).toBe('https://twitter.com/testuser/status/1234567890');
    });
  });

  describe('Time Element Extraction', () => {
    it('should extract tweet info from time element datetime attribute', () => {
      const mockTimeElement = {
        closest: vi.fn().mockReturnValue({
          href: 'https://x.com/testuser/status/1234567890',
        }),
      };

      // First strategy (status links) fails
      mockTweetContainer.querySelectorAll.mockReturnValue([]);
      // Second strategy (time element) succeeds
      mockTweetContainer.querySelector.mockReturnValue(mockTimeElement);

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
      expect(result?.tweetId).toBe('1234567890');
    });
  });

  describe('Data Attributes Extraction', () => {
    it('should extract tweet info from data attributes', () => {
      const mockElement = {
        querySelectorAll: vi.fn().mockReturnValue([
          {
            getAttribute: vi.fn().mockReturnValue('https://x.com/testuser/status/1234567890'),
          },
        ]),
      };

      // First two strategies fail
      mockTweetContainer.querySelectorAll.mockReturnValue([]);
      mockTweetContainer.querySelector
        .mockReturnValueOnce(null) // time element
        .mockReturnValue(mockElement); // data-testid element

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
      expect(result?.tweetId).toBe('1234567890');
    });
  });

  describe('URL Attributes Extraction', () => {
    it('should extract from URL-like attributes', () => {
      const mockLinkElement = {
        getAttribute: vi.fn().mockReturnValue('https://x.com/testuser/status/1234567890'),
      };

      mockTweetContainer.querySelectorAll
        .mockReturnValueOnce([]) // status links
        .mockReturnValue([mockLinkElement]); // all elements

      mockTweetContainer.querySelector
        .mockReturnValueOnce(null) // time element
        .mockReturnValue(null); // data-testid elements

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
      expect(result?.tweetId).toBe('1234567890');
    });
  });

  describe('Current URL Extraction', () => {
    it('should extract from current window location', () => {
      // All previous strategies fail
      mockTweetContainer.querySelectorAll.mockReturnValue([]);
      mockTweetContainer.querySelector.mockReturnValue(null);

      // Set window location to contain tweet URL
      Object.defineProperty(global.window, 'location', {
        value: {
          href: 'https://x.com/testuser/status/1234567890',
        },
        writable: true,
      });

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
      expect(result?.tweetId).toBe('1234567890');
    });
  });

  describe('Invalid Tweet Info Handling', () => {
    it('should reject invalid usernames like "i"', () => {
      const mockStatusLink = {
        href: 'https://x.com/i/status/1234567890',
      };

      mockTweetContainer.querySelectorAll.mockReturnValue([mockStatusLink]);

      const result = extractTweetInfoUnified(mockTweetContainer);

      // Should return synthetic info instead of invalid "i" username
      expect(result).not.toBeNull();
      expect(result?.username).not.toBe('i');
      expect(result?.username).toBe('unknown_user');
    });

    it('should reject non-numeric tweet IDs', () => {
      const mockStatusLink = {
        href: 'https://x.com/testuser/status/invalid_id',
      };

      mockTweetContainer.querySelectorAll.mockReturnValue([mockStatusLink]);

      const result = extractTweetInfoUnified(mockTweetContainer);

      // Should return synthetic info instead of invalid ID
      expect(result).not.toBeNull();
      expect(result?.tweetId).toMatch(/^\d+$/);
    });
  });

  describe('Fallback Strategies', () => {
    it('should generate synthetic tweet info when all strategies fail', () => {
      // All strategies fail
      mockTweetContainer.querySelectorAll.mockReturnValue([]);
      mockTweetContainer.querySelector.mockReturnValue(null);
      mockTweetContainer.textContent = '';

      Object.defineProperty(global.window, 'location', {
        value: {
          href: 'https://example.com',
        },
        writable: true,
      });

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('unknown_user');
      expect(result?.tweetId).toMatch(/^\d+$/);
      expect(result?.tweetUrl).toContain('unknown_user');
    });
  });

  describe('Error Handling', () => {
    it('should handle DOM errors gracefully', () => {
      mockTweetContainer.querySelectorAll.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = extractTweetInfoUnified(mockTweetContainer);

      // Should still return synthetic info even with errors
      expect(result).not.toBeNull();
      expect(result?.username).toBe('unknown_user');
    });
  });

  describe('Complex Scenarios', () => {
    it('should prioritize status links over other methods', () => {
      const mockStatusLink = {
        href: 'https://x.com/linkuser/status/1234567890',
      };

      mockTweetContainer.querySelectorAll.mockReturnValue([mockStatusLink]);

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('linkuser');
      expect(result?.tweetId).toBe('1234567890');
    });

    it('should handle mixed URL formats correctly', () => {
      const mockStatusLink = {
        href: 'https://twitter.com/testuser/status/1234567890?s=20&t=abcd',
      };

      mockTweetContainer.querySelectorAll.mockReturnValue([mockStatusLink]);

      const result = extractTweetInfoUnified(mockTweetContainer);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
      expect(result?.tweetId).toBe('1234567890');
      expect(result?.tweetUrl).toBe('https://twitter.com/testuser/status/1234567890?s=20&t=abcd');
    });
  });
});
