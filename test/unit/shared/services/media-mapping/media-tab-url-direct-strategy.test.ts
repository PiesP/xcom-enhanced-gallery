/**
 * @fileoverview Tests for MediaTabUrlDirectStrategy
 * @description TDD: Phase 124 Step 4 - media-tab-url-direct-strategy.ts 커버리지 향상
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type StrategyModule =
  typeof import('@/shared/services/media-mapping/media-tab-url-direct-strategy');

async function importModule(): Promise<StrategyModule> {
  vi.resetModules();
  return await import('@/shared/services/media-mapping/media-tab-url-direct-strategy');
}

describe('MediaTabUrlDirectStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('초기화 및 속성', () => {
    it('should create instance with correct properties', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe('media-tab-url-direct');
      expect(strategy.priority).toBe(1);
    });

    it('should have execute method', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      expect(strategy.execute).toBeDefined();
      expect(typeof strategy.execute).toBe('function');
    });
  });

  describe('execute - pageType validation', () => {
    it('should return null for timeline pageType', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const mockElement = document.createElement('div');
      const result = await strategy.execute(mockElement, 'timeline');

      expect(result).toBeNull();
    });

    it('should process photoDetail pageType', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      // Mock window.location with tweet ID
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123456789' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/1.jpg';
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      // Restore
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result).not.toBeNull();
      if (result) {
        expect(result.pageType).toBe('photoDetail');
        expect(result.tweetId).toBe('123456789');
      }
    });

    it('should process videoDetail pageType', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      // Mock window.location
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/987654321' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/video.mp4';
      mockElement.appendChild(video);

      const result = await strategy.execute(mockElement, 'videoDetail');

      // Restore
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result).not.toBeNull();
      if (result) {
        expect(result.pageType).toBe('videoDetail');
        expect(result.tweetId).toBe('987654321');
      }
    });
  });

  describe('URL parsing', () => {
    it('should return null when URL has no tweet ID', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      // Mock URL without tweet ID
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/home' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const result = await strategy.execute(mockElement, 'photoDetail');

      // Restore
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result).toBeNull();
    });

    it('should extract tweet ID from URL correctly', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/1234567890123456789' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/1.jpg';
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      // Restore
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result?.tweetId).toBe('1234567890123456789');
    });
  });

  describe('Media extraction from img element', () => {
    it('should extract media URL from img element', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result?.mediaUrls).toContain('https://pbs.twimg.com/media/test.jpg');
      expect(result?.metadata?.mediaUrl).toBe('https://pbs.twimg.com/media/test.jpg');
    });

    it('should find img element using querySelector', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const nested = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/nested.jpg';
      nested.appendChild(img);
      mockElement.appendChild(nested);

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result?.mediaUrls).toContain('https://pbs.twimg.com/media/nested.jpg');
    });
  });

  describe('Media extraction from video element', () => {
    it('should extract media URL from video src', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/test.mp4';
      mockElement.appendChild(video);

      const result = await strategy.execute(mockElement, 'videoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result?.mediaUrls).toContain('https://video.twimg.com/test.mp4');
    });

    it('should fallback to poster if video src is empty', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const video = document.createElement('video');
      video.poster = 'https://pbs.twimg.com/poster.jpg';
      mockElement.appendChild(video);

      const result = await strategy.execute(mockElement, 'videoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result?.mediaUrls).toContain('https://pbs.twimg.com/poster.jpg');
    });
  });

  describe('Media index extraction', () => {
    it('should extract media index from URL', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/3/test.jpg';
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      // Media index 3 -> array index 2
      expect(result?.mediaIndex).toBe(2);
    });

    it('should default to index 0 when no index in URL', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/test.jpg';
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result?.mediaIndex).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return null when no media element found', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      // No img or video

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result).toBeNull();
    });

    it('should return null when media URL is empty', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      // src is empty
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result).toBeNull();
    });
  });

  describe('Result structure', () => {
    it('should return complete MediaMapping structure', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/1.jpg';
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result).not.toBeNull();
      if (result) {
        expect(result.pageType).toBe('photoDetail');
        expect(Array.isArray(result.mediaUrls)).toBe(true);
        expect(result.tweetId).toBe('123');
        expect(typeof result.mediaIndex).toBe('number');
        expect(result.confidence).toBe(0.95);
        expect(result.method).toBe('media-tab-url-direct');
        expect(result.metadata).toBeDefined();
      }
    });

    it('should have confidence score of 0.95', async () => {
      const { MediaTabUrlDirectStrategy } = await importModule();
      const strategy = new MediaTabUrlDirectStrategy();

      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: 'https://twitter.com/user/status/123' },
        writable: true,
      });

      const mockElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/1.jpg';
      mockElement.appendChild(img);

      const result = await strategy.execute(mockElement, 'photoDetail');

      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });

      expect(result?.confidence).toBe(0.95);
    });
  });
});
