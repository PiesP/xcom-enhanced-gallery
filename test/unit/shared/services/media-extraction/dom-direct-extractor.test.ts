/**
 * @fileoverview dom-direct-extractor.ts 테스트
 * @description DOMDirectExtractor 클래스 백업 추출기 테스트
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DOMDirectExtractor } from '../../../../../src/shared/services/media-extraction/extractors/dom-direct-extractor';
import type {
  MediaExtractionOptions,
  MediaExtractionResult,
  TweetInfo,
} from '../../../../../src/shared/types/media.types';

// Mock dependencies
vi.mock('../../../../../src/shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../../../src/shared/utils/media/media-url.util', () => ({
  extractOriginalImageUrl: vi.fn((url: string) => url.split('?')[0]),
  isValidMediaUrl: vi.fn((url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'pbs.twimg.com';
    } catch {
      return false;
    }
  }),
}));

// Mock createSelectorRegistry
const mockSelectorRegistry = {
  findClosest: vi.fn(),
  findTweetContainer: vi.fn(),
};

vi.mock('../../../../../src/shared/dom', () => ({
  createSelectorRegistry: vi.fn(() => mockSelectorRegistry),
}));

describe('DOMDirectExtractor', () => {
  let extractor: DOMDirectExtractor;
  let mockOptions: MediaExtractionOptions;
  let mockTweetInfo: TweetInfo;

  beforeEach(() => {
    extractor = new DOMDirectExtractor();
    mockOptions = {} as MediaExtractionOptions;
    mockTweetInfo = {
      tweetId: '1234567890',
      username: 'testuser',
      tweetUrl: 'https://x.com/testuser/status/1234567890',
      extractionMethod: 'dom-direct',
      confidence: 0.9,
    };
    vi.clearAllMocks();
  });

  describe('extract', () => {
    it('should successfully extract images and videos', async () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <img src="https://pbs.twimg.com/media/test1.jpg?format=jpg" />
        <img src="https://pbs.twimg.com/media/test2.jpg?format=jpg" />
        <video src="https://video.twimg.com/video.mp4"></video>
      `;

      mockSelectorRegistry.findClosest.mockReturnValue(container);

      const result = await extractor.extract(container, mockOptions, 'test-id', mockTweetInfo);

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(3);
      expect(result.mediaItems[0]?.type).toBe('image');
      expect(result.mediaItems[1]?.type).toBe('image');
      expect(result.mediaItems[2]?.type).toBe('video');
      expect(result.metadata.sourceType).toBe('dom-direct');
      expect(result.metadata.strategy).toBe('dom-fallback');
      expect(result.tweetInfo).toEqual(mockTweetInfo);
    });

    it('should return failure if no media found in container', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<div>No media here</div>';

      // findMediaContainer는 항상 element를 반환하므로 null이 될 수 없음
      mockSelectorRegistry.findClosest.mockReturnValue(null);
      mockSelectorRegistry.findTweetContainer.mockReturnValue(null);

      const result = await extractor.extract(element, mockOptions, 'test-id');

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
      expect(result.metadata.strategy).toBe('dom-fallback-failed');
      expect(result.metadata.error).toBe('미디어를 찾을 수 없음');
    });

    it('should return failure if no media found', async () => {
      const container = document.createElement('div');
      container.innerHTML = '<div>No media here</div>';

      mockSelectorRegistry.findClosest.mockReturnValue(container);

      const result = await extractor.extract(container, mockOptions, 'test-id');

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
      expect(result.metadata.error).toBe('미디어를 찾을 수 없음');
    });

    it('should find clicked index for clicked element', async () => {
      const container = document.createElement('div');
      const img1 = document.createElement('img');
      img1.src = 'https://pbs.twimg.com/media/test1.jpg';
      const img2 = document.createElement('img');
      img2.src = 'https://pbs.twimg.com/media/test2.jpg';
      container.appendChild(img1);
      container.appendChild(img2);

      mockSelectorRegistry.findClosest.mockReturnValue(container);

      const result = await extractor.extract(img2, mockOptions, 'test-id');

      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(1);
    });
  });

  describe('findMediaContainer', () => {
    it('should prioritize closest tweet container', () => {
      const element = document.createElement('div');
      const closestTweet = document.createElement('article');
      mockSelectorRegistry.findClosest.mockReturnValue(closestTweet);

      // @ts-expect-error - private method 테스트
      const result = extractor.findMediaContainer(element);

      expect(result).toBe(closestTweet);
      expect(mockSelectorRegistry.findClosest).toHaveBeenCalled();
    });

    it('should fallback to findTweetContainer', () => {
      const element = document.createElement('div');
      const tweetContainer = document.createElement('article');
      mockSelectorRegistry.findClosest.mockReturnValue(null);
      mockSelectorRegistry.findTweetContainer.mockReturnValue(tweetContainer);

      // @ts-expect-error - private method 테스트
      const result = extractor.findMediaContainer(element);

      expect(result).toBe(tweetContainer);
    });

    it('should return element as final fallback', () => {
      const element = document.createElement('div');
      mockSelectorRegistry.findClosest.mockReturnValue(null);
      mockSelectorRegistry.findTweetContainer.mockReturnValue(null);

      // @ts-expect-error - private method 테스트
      const result = extractor.findMediaContainer(element);

      expect(result).toBe(element);
    });
  });

  describe('extractMediaFromContainer', () => {
    it('should extract images from container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <img src="https://pbs.twimg.com/media/test1.jpg" />
        <img src="https://pbs.twimg.com/media/test2.jpg" />
      `;

      // @ts-expect-error - private method 테스트
      const result = extractor.extractMediaFromContainer(container);

      expect(result).toHaveLength(2);
      expect(result[0]?.type).toBe('image');
      expect(result[1]?.type).toBe('image');
    });

    it('should extract videos from container', () => {
      const container = document.createElement('div');
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/video.mp4';
      container.appendChild(video);

      // @ts-expect-error - private method 테스트
      const result = extractor.extractMediaFromContainer(container);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('video');
      expect(result[0]?.url).toBe('https://video.twimg.com/video.mp4');
    });

    it('should extract mixed media (images and videos)', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <img src="https://pbs.twimg.com/media/test.jpg" />
        <video src="https://video.twimg.com/video.mp4"></video>
      `;

      // @ts-expect-error - private method 테스트
      const result = extractor.extractMediaFromContainer(container);

      expect(result).toHaveLength(2);
      expect(result[0]?.type).toBe('image');
      expect(result[1]?.type).toBe('video');
    });

    it('should skip invalid image URLs', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <img src="https://pbs.twimg.com/media/test.jpg" />
        <img src="https://invalid.com/test.jpg" />
      `;

      // @ts-expect-error - private method 테스트
      const result = extractor.extractMediaFromContainer(container);

      expect(result).toHaveLength(1);
      expect(result[0]?.url).toContain('pbs.twimg.com');
    });

    it('should return empty array for empty container', () => {
      const container = document.createElement('div');

      // @ts-expect-error - private method 테스트
      const result = extractor.extractMediaFromContainer(container);

      expect(result).toHaveLength(0);
    });

    it('should include tweetInfo in media items', () => {
      const container = document.createElement('div');
      container.innerHTML = '<img src="https://pbs.twimg.com/media/test.jpg" />';

      // @ts-expect-error - private method 테스트
      const result = extractor.extractMediaFromContainer(container, mockTweetInfo);

      expect(result[0]?.tweetId).toBe('1234567890');
      expect(result[0]?.tweetUsername).toBe('testuser');
    });
  });

  describe('createImageMediaInfo', () => {
    it('should create image media info with all properties', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.createImageMediaInfo('https://test.jpg', 0, mockTweetInfo);

      expect(result.type).toBe('image');
      expect(result.url).toBe('https://test.jpg');
      expect(result.originalUrl).toBe('https://test.jpg');
      expect(result.filename).toContain('testuser_media_1_1234567890.jpg');
      expect(result.tweetId).toBe('1234567890');
      expect(result.tweetUsername).toBe('testuser');
      expect(result.id).toContain('img_');
    });

    it('should create image media info without tweetInfo', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.createImageMediaInfo('https://test.jpg', 0);

      expect(result.type).toBe('image');
      expect(result.filename).toBe('media_1.jpg');
      expect(result.tweetId).toBeUndefined();
      expect(result.tweetUsername).toBeUndefined();
    });
  });

  describe('createVideoMediaInfo', () => {
    it('should create video media info with all properties', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.createVideoMediaInfo(
        'https://video.twimg.com/video.mp4',
        0,
        mockTweetInfo
      );

      expect(result.type).toBe('video');
      expect(result.url).toBe('https://video.twimg.com/video.mp4');
      expect(result.originalUrl).toBe('https://video.twimg.com/video.mp4');
      expect(result.filename).toContain('testuser_media_1_1234567890.mp4');
      expect(result.thumbnailUrl).toBe('https://video.twimg.com/video.jpg');
      expect(result.tweetId).toBe('1234567890');
      expect(result.tweetUsername).toBe('testuser');
      expect(result.id).toContain('vid_');
    });

    it('should create video media info without tweetInfo', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.createVideoMediaInfo('https://video.twimg.com/video.mp4', 0);

      expect(result.type).toBe('video');
      expect(result.filename).toBe('media_1.mp4');
      expect(result.tweetId).toBeUndefined();
      expect(result.tweetUsername).toBeUndefined();
    });
  });

  describe('generateFilename', () => {
    it('should generate image filename with tweetInfo', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.generateFilename('image', 0, mockTweetInfo);

      expect(result).toBe('testuser_media_1_1234567890.jpg');
    });

    it('should generate video filename with tweetInfo', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.generateFilename('video', 1, mockTweetInfo);

      expect(result).toBe('testuser_media_2_1234567890.mp4');
    });

    it('should generate filename without tweetInfo', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.generateFilename('image', 0);

      expect(result).toBe('media_1.jpg');
    });

    it('should increment index correctly', () => {
      // @ts-expect-error - private method 테스트
      const result1 = extractor.generateFilename('image', 0, mockTweetInfo);
      // @ts-expect-error - private method 테스트
      const result2 = extractor.generateFilename('image', 1, mockTweetInfo);

      expect(result1).toContain('media_1');
      expect(result2).toContain('media_2');
    });
  });

  describe('generateVideoThumbnail', () => {
    it('should convert .mp4 to .jpg', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.generateVideoThumbnail('https://video.twimg.com/video.mp4');

      expect(result).toBe('https://video.twimg.com/video.jpg');
    });

    it('should handle .mp4 with query params', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.generateVideoThumbnail('https://video.twimg.com/video.mp4?tag=14');

      expect(result).toBe('https://video.twimg.com/video.jpg');
    });
  });

  describe('isValidImageUrl', () => {
    it('should validate image URL using isValidMediaUrl', () => {
      // @ts-expect-error - private method 테스트
      const result1 = extractor.isValidImageUrl('https://pbs.twimg.com/media/test.jpg');
      // @ts-expect-error - private method 테스트
      const result2 = extractor.isValidImageUrl('https://invalid.com/test.jpg');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('findClickedIndex', () => {
    it('should find index for clicked IMG element', () => {
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test2.jpg?format=jpg';

      const mediaItems = [
        { url: 'https://pbs.twimg.com/media/test1.jpg', type: 'image' as const },
        { url: 'https://pbs.twimg.com/media/test2.jpg', type: 'image' as const },
        { url: 'https://pbs.twimg.com/media/test3.jpg', type: 'image' as const },
      ];

      // @ts-expect-error - private method 테스트
      const result = extractor.findClickedIndex(img, mediaItems);

      expect(result).toBe(1);
    });

    it('should find index for clicked VIDEO element', () => {
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/video2.mp4';

      const mediaItems = [
        { url: 'https://video.twimg.com/video1.mp4', type: 'video' as const },
        { url: 'https://video.twimg.com/video2.mp4', type: 'video' as const },
      ];

      // @ts-expect-error - private method 테스트
      const result = extractor.findClickedIndex(video, mediaItems);

      expect(result).toBe(1);
    });

    it('should return 0 for non-media element', () => {
      const div = document.createElement('div');
      const mediaItems = [{ url: 'https://test.jpg', type: 'image' as const }];

      // @ts-expect-error - private method 테스트
      const result = extractor.findClickedIndex(div, mediaItems);

      expect(result).toBe(0);
    });

    it('should return 0 if clicked media not found', () => {
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/notfound.jpg';

      const mediaItems = [{ url: 'https://pbs.twimg.com/media/test.jpg', type: 'image' as const }];

      // @ts-expect-error - private method 테스트
      const result = extractor.findClickedIndex(img, mediaItems);

      expect(result).toBe(0);
    });

    it('should handle query params in IMG src matching', () => {
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=large';

      const mediaItems = [{ url: 'https://pbs.twimg.com/media/test.jpg', type: 'image' as const }];

      // @ts-expect-error - private method 테스트
      const result = extractor.findClickedIndex(img, mediaItems);

      expect(result).toBe(0);
    });
  });

  describe('createFailureResult', () => {
    it('should create failure result with error message', () => {
      // @ts-expect-error - private method 테스트
      const result = extractor.createFailureResult('Test error');

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
      expect(result.clickedIndex).toBe(0);
      expect(result.metadata.sourceType).toBe('dom-direct');
      expect(result.metadata.strategy).toBe('dom-fallback-failed');
      expect(result.metadata.error).toBe('Test error');
      expect(result.tweetInfo).toBeNull();
    });
  });
});
