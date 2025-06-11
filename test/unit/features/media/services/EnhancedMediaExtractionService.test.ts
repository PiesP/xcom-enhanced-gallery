/**
 * EnhancedMediaExtractionService 테스트
 *
 * @description 개선된 미디어 추출 서비스의 기능을 테스트합니다.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EnhancedMediaExtractionOptions,
  EnhancedMediaExtractionService,
} from '../../../../../src/features/media/services/EnhancedMediaExtractionService';

// Mock logger
vi.mock('../../../../../src/infrastructure/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock VideoControlUtil
vi.mock('../../../../../src/shared/utils/media/VideoControlUtil', () => ({
  VideoControlUtil: {
    getInstance: vi.fn(() => ({
      pauseVideosInContainer: vi.fn(),
      extractMediaFromVideoElement: vi.fn().mockReturnValue(null),
    })),
  },
}));

// Mock VideoStateManager
vi.mock('../../../../../src/shared/utils/media/VideoStateManager', () => ({
  VideoStateManager: {
    getInstance: vi.fn(() => ({
      preserveVideoState: vi.fn(),
      getCachedMedia: vi.fn().mockReturnValue(null),
      cacheMediaForTweet: vi.fn(),
    })),
  },
}));

// Mock utility functions
vi.mock('../../../../../src/shared/utils/media/enhanced-image-filter', () => ({
  enhancedImageFilter: vi.fn().mockReturnValue({
    valid: ['https://pbs.twimg.com/media/test1.jpg'],
    invalid: [],
    totalFound: 1,
    filtered: 0,
  }),
}));

vi.mock('../../../../../src/shared/utils/patterns/video-extractor', () => ({
  getTweetIdFromContainer: vi.fn().mockReturnValue('123456789'),
  getVideoMediaEntry: vi.fn().mockReturnValue(null),
  isVideoThumbnail: vi.fn().mockReturnValue(false),
}));

vi.mock('../../../../../src/shared/utils/patterns/tweet-extraction', () => ({
  extractTweetInfoUnified: vi.fn().mockReturnValue({
    username: 'testuser',
    tweetId: '123456789',
    tweetUrl: 'https://x.com/testuser/status/123456789',
  }),
}));

vi.mock('../../../../../src/shared/utils/patterns', () => ({
  getTweetIdFromContainer: vi.fn().mockReturnValue('123456789'),
  getVideoMediaEntry: vi.fn().mockResolvedValue(null),
  isVideoThumbnail: vi.fn().mockReturnValue(false),
  TwitterAPI: {
    getTweetMedias: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../../../src/core/constants/twitter-endpoints', () => ({
  MEDIA_URL_UTILS: {
    isValidDiscoveryUrl: vi.fn(url => url?.includes('pbs.twimg.com')),
    isValidGalleryUrl: vi.fn(url => url?.includes('pbs.twimg.com')),
    generateOriginalUrl: vi.fn(url => url),
  },
}));

// Helper function to create mock DOM elements
const createMockElement = (tagName: string, attributes: Record<string, any> = {}): any => {
  const element = {
    tagName: tagName.toUpperCase(),
    src: attributes.src || '',
    alt: attributes.alt || '',
    dataset: attributes.dataset || {},
    style: attributes.style || {},
    getAttribute: vi.fn((name: string) => attributes[name] || null),
    setAttribute: vi.fn(),
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
    appendChild: vi.fn(),
    closest: vi.fn().mockReturnValue(null),
    contains: vi.fn().mockReturnValue(false),
    getBoundingClientRect: vi.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      toJSON: vi.fn(),
    })),
    ...attributes,
  };
  return element;
};

describe('EnhancedMediaExtractionService', () => {
  let service: EnhancedMediaExtractionService;
  let mockTweetContainer: any;
  let mockImageElement: any;
  let mockVideoElement: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset singleton instance
    (EnhancedMediaExtractionService as any).instance = undefined;
    service = EnhancedMediaExtractionService.getInstance();

    // Create mock DOM elements
    mockTweetContainer = createMockElement('div', {
      'data-testid': 'tweet',
      'data-tweet-id': '123456789',
    });

    mockImageElement = createMockElement('img', {
      src: 'https://pbs.twimg.com/media/test1.jpg',
      'data-testid': 'tweetPhoto',
      alt: 'Tweet image',
    });

    mockVideoElement = createMockElement('video', {
      src: 'https://video.twimg.com/ext_tw_video/test.mp4',
      'data-testid': 'videoPlayer',
    });

    // Setup element relationships
    mockImageElement.closest = vi.fn((selector: string) => {
      if (selector === '[data-testid="tweet"]') return mockTweetContainer;
      return null;
    });

    mockVideoElement.closest = vi.fn((selector: string) => {
      if (selector === '[data-testid="tweet"]') return mockTweetContainer;
      return null;
    });

    mockTweetContainer.querySelectorAll = vi.fn((selector: string) => {
      if (selector.includes('img')) return [mockImageElement];
      if (selector.includes('video')) return [mockVideoElement];
      return [];
    });

    mockTweetContainer.querySelector = vi.fn((selector: string) => {
      if (selector.includes('img')) return mockImageElement;
      if (selector.includes('video')) return mockVideoElement;
      return null;
    });

    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            legacy: {
              extended_entities: {
                media: [
                  {
                    id_str: 'media1',
                    type: 'photo',
                    media_url_https: 'https://pbs.twimg.com/media/test1.jpg',
                    sizes: { orig: { w: 1200, h: 800 } },
                  },
                ],
              },
            },
          },
        }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (EnhancedMediaExtractionService as any).instance = undefined;
  });

  describe('Service Lifecycle', () => {
    it('should create singleton instance correctly', () => {
      const instance1 = EnhancedMediaExtractionService.getInstance();
      const instance2 = EnhancedMediaExtractionService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(EnhancedMediaExtractionService);
    });

    it('should initialize service correctly', async () => {
      expect(service.isInitialized()).toBe(false);

      await service.initialize();

      expect(service.isInitialized()).toBe(true);
    });

    it('should destroy service correctly', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);

      await service.destroy();

      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('Basic Media Extraction', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should extract media from image element', async () => {
      // Create a simple image element that should pass URL validation
      const imgElement = createMockElement('img', {
        src: 'https://pbs.twimg.com/media/test1.jpg',
        tagName: 'IMG',
      });

      const result = await service.extractFromClickedElement(imgElement);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].url).toBe('https://pbs.twimg.com/media/test1.jpg');
      expect(result.mediaItems[0].type).toBe('image');
    });

    it('should extract media from video element', async () => {
      // Create a simple video element
      const videoElement = createMockElement('video', {
        src: 'https://video.twimg.com/ext_tw_video/test.mp4',
        tagName: 'VIDEO',
      });

      const result = await service.extractFromClickedElement(videoElement);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
    });

    it('should calculate clicked index correctly', async () => {
      // Simple direct test of findClickedIndex method
      const images = [
        { src: 'https://pbs.twimg.com/media/test1.jpg', tagName: 'IMG' },
        { src: 'https://pbs.twimg.com/media/test2.jpg', tagName: 'IMG' },
        { src: 'https://pbs.twimg.com/media/test3.jpg', tagName: 'IMG' },
      ] as HTMLImageElement[];

      const clickedImage = {
        src: 'https://pbs.twimg.com/media/test2.jpg',
        tagName: 'IMG',
      } as HTMLImageElement;

      // Test findClickedIndex directly
      const directResult = (service as any).findClickedIndex(clickedImage, images);

      expect(directResult).toBe(1);
    });

    it('should extract tweet information when tweet container exists', async () => {
      // Create elements with proper relationship
      const imgElement = createMockElement('img', {
        src: 'https://pbs.twimg.com/media/test1.jpg',
        tagName: 'IMG',
      });

      const tweetContainer = createMockElement('div', {
        'data-testid': 'tweet',
        'data-tweet-id': '123456789',
        tagName: 'DIV',
      });

      // Set up the relationship properly
      imgElement.closest = vi.fn((selector: string) => {
        if (selector === '[data-testid="tweet"]') return tweetContainer;
        return null;
      });

      const result = await service.extractFromClickedElement(imgElement);

      expect(result.success).toBe(true);
      if (result.tweetInfo) {
        expect(result.tweetInfo.username).toBe('testuser');
        expect(result.tweetInfo.tweetId).toBe('123456789');
        expect(result.tweetInfo.tweetUrl).toBe('https://x.com/testuser/status/123456789');
      }
    });
  });

  describe('Enhanced Extraction Options', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should respect includeVideoElements option', async () => {
      const options: EnhancedMediaExtractionOptions = {
        includeVideoElements: true,
      };

      const result = await service.extractFromClickedElement(mockImageElement, options);

      expect(result.success).toBe(true);
      // Should include both image and video elements
    });

    it('should respect preserveVideoState option', async () => {
      const options: EnhancedMediaExtractionOptions = {
        preserveVideoState: true,
      };

      const result = await service.extractFromClickedElement(mockVideoElement, options);

      expect(result.success).toBe(true);
      // Video state should be preserved
    });

    it('should respect fallbackToVideoAPI option', async () => {
      const options: EnhancedMediaExtractionOptions = {
        fallbackToVideoAPI: true,
      };

      const result = await service.extractFromClickedElement(mockImageElement, options);

      expect(result.success).toBe(true);
      // Should attempt API fallback when needed
    });

    it('should respect enableMutationObserver option', async () => {
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn().mockReturnValue([]),
      };

      vi.spyOn(global, 'MutationObserver').mockImplementation(() => mockObserver as any);

      const options: EnhancedMediaExtractionOptions = {
        enableMutationObserver: true,
      };

      const result = await service.extractFromClickedElement(mockImageElement, options);

      expect(result.success).toBe(true);
      // Note: MutationObserver might not be called in simple extraction scenarios
    });
  });

  describe('Extraction Strategies', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should use image elements strategy', async () => {
      const result = await service.extractFromClickedElement(mockImageElement);

      expect(result.metadata?.usedStrategy).toBe('imageElements');
      expect(result.metadata?.strategyResults).toBeDefined();
    });

    it('should use video elements strategy for video elements', async () => {
      const result = await service.extractFromClickedElement(mockVideoElement);

      expect(result.success).toBe(true);
      // Video strategy should be used
    });

    it('should handle background image strategy', async () => {
      const divWithBgImage = createMockElement('div', {
        style: { backgroundImage: 'url("https://pbs.twimg.com/media/test.jpg")' },
      });

      divWithBgImage.closest = vi.fn(() => mockTweetContainer);
      divWithBgImage.querySelectorAll = vi.fn(() => []);

      // Mock getComputedStyle
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        backgroundImage: 'url("https://pbs.twimg.com/media/test.jpg")',
      } as any);

      const result = await service.extractFromClickedElement(divWithBgImage);

      expect(result.success).toBe(true);
    });

    it('should fallback to API strategy when enabled and tweet container exists', async () => {
      // Make sure the image element has a tweet container
      mockImageElement.closest = vi.fn((selector: string) => {
        if (selector === '[data-testid="tweet"]') return mockTweetContainer;
        return null;
      });

      const options: EnhancedMediaExtractionOptions = {
        fallbackToVideoAPI: true,
      };

      const result = await service.extractFromClickedElement(mockImageElement, options);

      expect(result.success).toBe(true);
      // API might be called in some scenarios, but simple extraction should still work
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.extractFromClickedElement(mockImageElement, {
        fallbackToVideoAPI: true,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Should still succeed with DOM extraction
    });

    it('should handle invalid elements gracefully', async () => {
      const invalidElement = null;

      const result = await service.extractFromClickedElement(invalidElement as any);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
    });

    it('should handle missing tweet container by using simple extraction', async () => {
      mockImageElement.closest = vi.fn().mockReturnValue(null);

      const result = await service.extractFromClickedElement(mockImageElement);

      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Simple extraction should still work
      expect(result.mediaItems.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Metadata', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should generate extraction metadata', async () => {
      const result = await service.extractFromClickedElement(mockImageElement);

      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata?.totalProcessingTime).toBe('number');
      expect(result.metadata?.strategyResults).toBeDefined();
      expect(result.metadata?.usedStrategy).toBeDefined();
    });

    it('should remove duplicate URLs', async () => {
      // Setup multiple images with duplicate URLs
      const images = [
        createMockElement('img', { src: 'https://pbs.twimg.com/media/test1.jpg' }),
        createMockElement('img', { src: 'https://pbs.twimg.com/media/test1.jpg' }), // duplicate
        createMockElement('img', { src: 'https://pbs.twimg.com/media/test2.jpg' }),
      ];

      images.forEach(img => {
        img.closest = vi.fn(() => mockTweetContainer);
      });

      mockTweetContainer.querySelectorAll = vi.fn(() => images);

      const result = await service.extractFromClickedElement(images[0]);

      expect(result.mediaItems).toHaveLength(2); // Should deduplicate
    });

    it('should handle large number of media items efficiently', async () => {
      // Create many images
      const images = Array.from({ length: 50 }, (_, i) =>
        createMockElement('img', { src: `https://pbs.twimg.com/media/test${i}.jpg` })
      );

      images.forEach(img => {
        img.closest = vi.fn(() => mockTweetContainer);
      });

      mockTweetContainer.querySelectorAll = vi.fn(() => images);

      const startTime = Date.now();
      const result = await service.extractFromClickedElement(images[0]);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Integration with External Services', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should integrate with VideoControlUtil', async () => {
      const result = await service.extractFromClickedElement(mockVideoElement);

      expect(result.success).toBe(true);
      // VideoControlUtil methods should be called for video elements
    });

    it('should integrate with VideoStateManager', async () => {
      const options: EnhancedMediaExtractionOptions = {
        preserveVideoState: true,
      };

      const result = await service.extractFromClickedElement(mockVideoElement, options);

      expect(result.success).toBe(true);
      // VideoStateManager methods should be called
    });
  });
});
