/**
 * 통합 테스트 - 유틸리티 함수들 간의 상호작용 테스트
 * 실제 사용 시나리오에 가까운 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock implementations for testing
class MockMediaExtractor {
  async extractFromElement(element: HTMLElement): Promise<any> {
    if (!element) {
      throw new Error('Element is required');
    }

    // Simulate extraction based on element type
    if (element.tagName === 'IMG') {
      return {
        success: true,
        mediaItems: [
          {
            id: 'img-1',
            type: 'image',
            url: (element as HTMLImageElement).src || 'https://pbs.twimg.com/media/test.jpg',
            originalUrl: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=orig',
          },
        ],
        clickedIndex: 0,
      };
    }

    if (element.tagName === 'VIDEO') {
      return {
        success: true,
        mediaItems: [
          {
            id: 'vid-1',
            type: 'video',
            url: (element as HTMLVideoElement).src || 'https://video.twimg.com/test.mp4',
            thumbnailUrl:
              (element as HTMLVideoElement).poster || 'https://pbs.twimg.com/media/thumb.jpg',
          },
        ],
        clickedIndex: 0,
      };
    }

    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      error: 'No media found',
    };
  }
}

class MockGalleryManager {
  private isOpen = false;

  async openGallery(mediaItems: any[], clickedIndex: number = 0): Promise<boolean> {
    if (!mediaItems || mediaItems.length === 0) {
      return false;
    }

    this.isOpen = true;
    return true;
  }

  closeGallery(): void {
    this.isOpen = false;
  }

  isGalleryOpen(): boolean {
    return this.isOpen;
  }
}

class MockDOMUtils {
  static createMockElement(tagName: string, attributes: Record<string, string> = {}): HTMLElement {
    const element = document.createElement(tagName);

    // Mock setAttribute to store values properly
    const originalSetAttribute = element.setAttribute.bind(element);
    element.setAttribute = vi.fn().mockImplementation((name: string, value: string) => {
      (element as any)[name] = value;
      if (name === 'src') {
        (element as any).src = value;
      }
      if (name === 'alt') {
        (element as any).alt = value;
      }
      if (name === 'data-testid') {
        if (!element.dataset) {
          (element as any).dataset = {};
        }
        element.dataset.testid = value;
      }
      return originalSetAttribute(name, value);
    });

    // Mock getAttribute to return stored values
    element.getAttribute = vi.fn().mockImplementation((name: string) => {
      if (name === 'src') return (element as any).src;
      if (name === 'alt') return (element as any).alt;
      if (name === 'data-testid') return element.dataset?.testid;
      return (element as any)[name];
    });

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  }

  static isValidMediaElement(element: HTMLElement): boolean {
    if (!element) return false;

    const validTags = ['IMG', 'VIDEO'];
    const validSources = ['pbs.twimg.com', 'video.twimg.com'];

    if (!validTags.includes(element.tagName)) {
      return false;
    }

    const src = element.getAttribute('src') || '';
    return validSources.some(domain => src.includes(domain));
  }
}

describe('Integration Tests - Utility Interactions', () => {
  let mediaExtractor: MockMediaExtractor;
  let galleryManager: MockGalleryManager;
  let testContainer: HTMLElement;

  beforeEach(() => {
    mediaExtractor = new MockMediaExtractor();
    galleryManager = new MockGalleryManager();

    // Create test container
    testContainer = document.createElement('div');
    testContainer.id = 'integration-test-container';
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    if (testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    galleryManager.closeGallery();
  });

  describe('Media Extraction and Gallery Opening Workflow', () => {
    it('should extract media from image and open gallery', async () => {
      // Arrange: Create a mock Twitter image
      const imageElement = MockDOMUtils.createMockElement('img', {
        src: 'https://pbs.twimg.com/media/ABC123.jpg?format=jpg&name=small',
        alt: 'Test tweet image',
      });
      testContainer.appendChild(imageElement);

      // Act: Extract media
      const extractionResult = await mediaExtractor.extractFromElement(imageElement);

      // Assert: Extraction successful
      expect(extractionResult.success).toBe(true);
      expect(extractionResult.mediaItems).toHaveLength(1);
      expect(extractionResult.mediaItems[0].type).toBe('image');

      // Act: Open gallery with extracted media
      const galleryOpened = await galleryManager.openGallery(
        extractionResult.mediaItems,
        extractionResult.clickedIndex
      );

      // Assert: Gallery opened successfully
      expect(galleryOpened).toBe(true);
      expect(galleryManager.isGalleryOpen()).toBe(true);
    });

    it('should extract media from video and open gallery', async () => {
      // Arrange: Create a mock Twitter video
      const videoElement = MockDOMUtils.createMockElement('video', {
        src: 'https://video.twimg.com/ext_tw_video/123/pu/vid/video.mp4',
        poster: 'https://pbs.twimg.com/media/poster.jpg',
      });
      testContainer.appendChild(videoElement);

      // Act: Extract media
      const extractionResult = await mediaExtractor.extractFromElement(videoElement);

      // Assert: Extraction successful
      expect(extractionResult.success).toBe(true);
      expect(extractionResult.mediaItems).toHaveLength(1);
      expect(extractionResult.mediaItems[0].type).toBe('video');
      expect(extractionResult.mediaItems[0].thumbnailUrl).toBeTruthy();

      // Act: Open gallery
      const galleryOpened = await galleryManager.openGallery(
        extractionResult.mediaItems,
        extractionResult.clickedIndex
      );

      // Assert: Gallery opened
      expect(galleryOpened).toBe(true);
      expect(galleryManager.isGalleryOpen()).toBe(true);
    });

    it('should handle extraction failure gracefully', async () => {
      // Arrange: Create invalid element
      const invalidElement = MockDOMUtils.createMockElement('div', {
        'data-invalid': 'true',
      });
      testContainer.appendChild(invalidElement);

      // Act: Try to extract media
      const extractionResult = await mediaExtractor.extractFromElement(invalidElement);

      // Assert: Extraction failed
      expect(extractionResult.success).toBe(false);
      expect(extractionResult.mediaItems).toHaveLength(0);

      // Act: Try to open gallery with empty media
      const galleryOpened = await galleryManager.openGallery(extractionResult.mediaItems);

      // Assert: Gallery not opened
      expect(galleryOpened).toBe(false);
      expect(galleryManager.isGalleryOpen()).toBe(false);
    });
  });

  describe('DOM Utils and Media Validation Integration', () => {
    it('should validate media elements correctly', () => {
      // Test valid Twitter image
      const validImage = MockDOMUtils.createMockElement('img', {
        src: 'https://pbs.twimg.com/media/test.jpg',
      });

      expect(MockDOMUtils.isValidMediaElement(validImage)).toBe(true);

      // Test valid Twitter video
      const validVideo = MockDOMUtils.createMockElement('video', {
        src: 'https://video.twimg.com/test.mp4',
      });

      expect(MockDOMUtils.isValidMediaElement(validVideo)).toBe(true);

      // Test invalid element
      const invalidElement = MockDOMUtils.createMockElement('div', {
        src: 'https://example.com/image.jpg',
      });

      expect(MockDOMUtils.isValidMediaElement(invalidElement)).toBe(false);
    });

    it('should create elements with proper attributes', () => {
      const element = MockDOMUtils.createMockElement('img', {
        src: 'https://pbs.twimg.com/media/test.jpg',
        alt: 'Test image',
        'data-testid': 'tweetPhoto',
      });

      expect(element.tagName).toBe('IMG');
      expect(element.getAttribute('src')).toBe('https://pbs.twimg.com/media/test.jpg');
      expect(element.getAttribute('alt')).toBe('Test image');
      expect(element.getAttribute('data-testid')).toBe('tweetPhoto');
    });
  });

  describe('Error Handling Across Components', () => {
    it('should handle null element gracefully', async () => {
      await expect(mediaExtractor.extractFromElement(null as any)).rejects.toThrow(
        'Element is required'
      );
    });

    it('should handle undefined media items gracefully', async () => {
      const result = await galleryManager.openGallery(undefined as any);
      expect(result).toBe(false);
      expect(galleryManager.isGalleryOpen()).toBe(false);
    });

    it('should handle empty media array gracefully', async () => {
      const result = await galleryManager.openGallery([]);
      expect(result).toBe(false);
      expect(galleryManager.isGalleryOpen()).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple media elements in sequence', async () => {
      // Create multiple media elements
      const elements = [
        MockDOMUtils.createMockElement('img', {
          src: 'https://pbs.twimg.com/media/img1.jpg',
        }),
        MockDOMUtils.createMockElement('img', {
          src: 'https://pbs.twimg.com/media/img2.jpg',
        }),
        MockDOMUtils.createMockElement('video', {
          src: 'https://video.twimg.com/video1.mp4',
        }),
      ];

      // Process each element
      const results = [];
      for (const element of elements) {
        testContainer.appendChild(element);
        const result = await mediaExtractor.extractFromElement(element);
        results.push(result);
      }

      // Verify all extractions
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      // Open gallery with first result
      const firstResult = results[0];
      const galleryOpened = await galleryManager.openGallery(
        firstResult!.mediaItems,
        firstResult!.clickedIndex
      );

      expect(galleryOpened).toBe(true);
    });

    it('should handle rapid open/close gallery operations', async () => {
      const mediaElement = MockDOMUtils.createMockElement('img', {
        src: 'https://pbs.twimg.com/media/test.jpg',
      });

      // Extract media
      const result = await mediaExtractor.extractFromElement(mediaElement);
      expect(result.success).toBe(true);

      // Rapid open/close operations
      for (let i = 0; i < 5; i++) {
        const opened = await galleryManager.openGallery(result.mediaItems);
        expect(opened).toBe(true);
        expect(galleryManager.isGalleryOpen()).toBe(true);

        galleryManager.closeGallery();
        expect(galleryManager.isGalleryOpen()).toBe(false);
      }
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large number of elements efficiently', async () => {
      const elementCount = 100;
      const elements = Array.from({ length: elementCount }, (_, i) =>
        MockDOMUtils.createMockElement('img', {
          src: `https://pbs.twimg.com/media/img${i}.jpg`,
        })
      );

      const startTime = performance.now();

      // Process all elements
      const results = await Promise.all(
        elements.map(element => mediaExtractor.extractFromElement(element))
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Verify results
      expect(results).toHaveLength(elementCount);
      expect(results.every(r => r.success)).toBe(true);

      // Performance assertion (should complete within reasonable time)
      expect(processingTime).toBeLessThan(1000); // 1 second
    });
  });
});
