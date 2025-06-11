/// <reference types="vitest" />

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MediaInfo } from '../../../../../src/shared/types/media.types';
import { VideoStateManager } from '../../../../../src/shared/utils/media/video-state-manager';

// Mock the logger to prevent logging during tests
vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock MutationObserver
const mockMutationObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
};

Object.defineProperty(global, 'MutationObserver', {
  writable: true,
  value: vi.fn(() => mockMutationObserver),
});

describe('VideoStateManager', () => {
  let manager: VideoStateManager;
  let mockTweetContainer: HTMLElement;
  let mockMediaItems: MediaInfo[];

  beforeEach(() => {
    // Reset singleton instance for testing
    (VideoStateManager as any).instance = undefined;
    manager = VideoStateManager.getInstance();

    // Create mock tweet container
    mockTweetContainer = document.createElement('div');
    mockTweetContainer.setAttribute('data-testid', 'tweet');

    // Add mock tweet link for ID extraction
    const tweetLink = document.createElement('a');
    tweetLink.href = 'https://x.com/user/status/1234567890';
    mockTweetContainer.appendChild(tweetLink);

    // Add mock thumbnail images
    const img1 = document.createElement('img');
    img1.src = 'https://pbs.twimg.com/media/test1.jpg';
    const img2 = document.createElement('img');
    img2.src = 'https://pbs.twimg.com/media/test2.jpg';
    mockTweetContainer.appendChild(img1);
    mockTweetContainer.appendChild(img2);

    document.body.appendChild(mockTweetContainer);

    // Mock media items
    mockMediaItems = [
      {
        id: 'media1',
        type: 'image',
        url: 'https://pbs.twimg.com/media/test1.jpg',
        filename: 'test1.jpg',
        width: 1200,
        height: 800,
      },
      {
        id: 'media2',
        type: 'video',
        url: 'https://video.twimg.com/ext_tw_video/test.mp4',
        thumbnailUrl: 'https://pbs.twimg.com/media/test2.jpg',
        filename: 'test.mp4',
        width: 1280,
        height: 720,
      },
    ];
  });

  afterEach(() => {
    // Cleanup DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    manager.cleanup();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = VideoStateManager.getInstance();
      const instance2 = VideoStateManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Media Caching', () => {
    it('should cache media for tweet', () => {
      const tweetId = '1234567890';
      manager.cacheMediaForTweet(tweetId, mockTweetContainer, mockMediaItems);

      const cachedMedia = manager.getCachedMedia(tweetId);
      expect(cachedMedia).not.toBeNull();
      expect(cachedMedia?.tweetId).toBe(tweetId);
      expect(cachedMedia?.mediaItems).toEqual(mockMediaItems);
    });

    it('should return null for non-existent cache', () => {
      const cachedMedia = manager.getCachedMedia('nonexistent');
      expect(cachedMedia).toBeNull();
    });

    it('should clear all cache', () => {
      const tweetId1 = '1234567890';
      const tweetId2 = '0987654321';

      manager.cacheMediaForTweet(tweetId1, mockTweetContainer, mockMediaItems);
      manager.cacheMediaForTweet(tweetId2, mockTweetContainer, mockMediaItems);

      manager.clearAllCache();

      expect(manager.getCachedMedia(tweetId1)).toBeNull();
      expect(manager.getCachedMedia(tweetId2)).toBeNull();
    });
  });

  describe('Gallery Trigger Management', () => {
    it('should create gallery trigger when cache exists', () => {
      const tweetId = '1234567890';
      const mockCallback = vi.fn();

      // First cache the media
      manager.cacheMediaForTweet(tweetId, mockTweetContainer, mockMediaItems);

      // Verify cache exists
      const cachedMedia = manager.getCachedMedia(tweetId);
      expect(cachedMedia).not.toBeNull();

      // Create gallery trigger
      manager.createGalleryTrigger(mockTweetContainer, tweetId, mockCallback);

      // Find trigger by data-tweet-id since classList might not work in JSDOM
      // Using manual iteration as querySelector with attributes may not work in JSDOM
      let trigger: Element | null = null;
      for (let i = 0; i < mockTweetContainer.children.length; i++) {
        const child = mockTweetContainer.children[i];
        if (child.getAttribute('data-tweet-id') === tweetId) {
          trigger = child;
          break;
        }
      }
      expect(trigger).not.toBeNull();
      expect(trigger?.getAttribute('data-tweet-id')).toBe(tweetId);
      expect(trigger?.getAttribute('role')).toBe('button');
    });

    it('should not create gallery trigger without cache', () => {
      const tweetId = '1234567890';
      const mockCallback = vi.fn();

      manager.createGalleryTrigger(mockTweetContainer, tweetId, mockCallback);

      const trigger = mockTweetContainer.querySelector('.xeg-gallery-trigger');
      expect(trigger).toBeNull();
    });

    it('should remove gallery trigger', () => {
      const tweetId = '1234567890';
      const mockCallback = vi.fn();

      manager.cacheMediaForTweet(tweetId, mockTweetContainer, mockMediaItems);
      manager.createGalleryTrigger(mockTweetContainer, tweetId, mockCallback);

      let trigger: Element | null = null;
      for (let i = 0; i < mockTweetContainer.children.length; i++) {
        const child = mockTweetContainer.children[i];
        if (child.getAttribute('data-tweet-id') === tweetId) {
          trigger = child;
          break;
        }
      }
      expect(trigger).not.toBeNull();

      manager.removeGalleryTrigger(tweetId);

      trigger = mockTweetContainer.querySelector('.xeg-gallery-trigger');
      expect(trigger).toBeNull();
    });

    it('should trigger callback on click', () => {
      const tweetId = '1234567890';
      const mockCallback = vi.fn();

      manager.cacheMediaForTweet(tweetId, mockTweetContainer, mockMediaItems);
      manager.createGalleryTrigger(mockTweetContainer, tweetId, mockCallback);

      let trigger: Element | null = null;
      for (let i = 0; i < mockTweetContainer.children.length; i++) {
        const child = mockTweetContainer.children[i];
        if (child.getAttribute('data-tweet-id') === tweetId) {
          trigger = child;
          break;
        }
      }
      expect(trigger).not.toBeNull();

      (trigger as HTMLElement).click();

      expect(mockCallback).toHaveBeenCalledWith(mockMediaItems, 0);
    });
  });

  describe('DOM Observer', () => {
    it('should start DOM observer', () => {
      const mockCallback = vi.fn();
      manager.startDOMObserver(mockCallback);
      expect(manager.isObservingDOM).toBe(true);
    });

    it('should stop DOM observer', () => {
      const mockCallback = vi.fn();
      manager.startDOMObserver(mockCallback);
      manager.stopDOMObserver();
      expect(manager.isObservingDOM).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', () => {
      const tweetId = '1234567890';
      const mockCallback = vi.fn();

      manager.cacheMediaForTweet(tweetId, mockTweetContainer, mockMediaItems);
      manager.createGalleryTrigger(mockTweetContainer, tweetId, mockCallback);
      manager.startDOMObserver(mockCallback);

      expect(manager.getCachedMedia(tweetId)).not.toBeNull();
      let trigger: Element | null = null;
      for (let i = 0; i < mockTweetContainer.children.length; i++) {
        const child = mockTweetContainer.children[i];
        if (child.getAttribute('data-tweet-id') === tweetId) {
          trigger = child;
          break;
        }
      }
      expect(trigger).not.toBeNull();

      manager.cleanup();

      expect(manager.getCachedMedia(tweetId)).toBeNull();
      trigger = null;
      for (let i = 0; i < mockTweetContainer.children.length; i++) {
        const child = mockTweetContainer.children[i];
        if (child.getAttribute('data-tweet-id') === tweetId) {
          trigger = child;
          break;
        }
      }
      expect(trigger).toBeNull();
      expect(manager.isObservingDOM).toBe(false);
    });
  });
});
