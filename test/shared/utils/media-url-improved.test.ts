/**
 * 미디어 URL 유틸리티 테스트
 * 미디어 URL 추출, 변환, 검증 기능 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getMediaUrlsFromTweet,
  isValidMediaUrl,
  getHighQualityMediaUrl,
} from '../../../src/shared/utils/media/media-url.util';

// 새로운 테스트 유틸리티 import
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createMockElement,
  createMockImageElement,
  createMockVideoElement,
} from '../../utils/helpers/test-environment';
import { createMockMediaUrl } from '../../utils/fixtures/test-factories';
import {
  expectUrlToBeMediaUrl,
  expectUrlToHaveParams,
  expectFunctionToExecuteWithin,
} from '../../utils/helpers/test-assertions';

describe('Media URL Utilities', () => {
  beforeEach(async () => {
    await setupTestEnvironment('component');
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  describe('isValidMediaUrl', () => {
    it('should validate Twitter media URLs', () => {
      // 팩토리 함수를 사용하여 일관된 테스트 데이터 생성
      const validUrls = [
        createMockMediaUrl('image', { format: 'jpg' }),
        createMockMediaUrl('image', { quality: 'large', format: 'png' }),
        createMockMediaUrl('video', { format: 'mp4' }),
        createMockMediaUrl('video', { quality: 'medium' }),
      ];

      validUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(true);
        expectUrlToBeMediaUrl(url, url.includes('video.twimg.com') ? 'video' : 'image');
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'https://example.com/image.jpg',
        'ftp://pbs.twimg.com/media/image.jpg', // 잘못된 프로토콜
        'https://pbs.twimg.com/profile_images/123.jpg', // 프로필 이미지
      ];

      invalidUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      // 유효한 기본 URL들
      expect(isValidMediaUrl('https://pbs.twimg.com/media/')).toBe(true);
      expect(isValidMediaUrl('https://video.twimg.com/video.mp4')).toBe(true);

      // 잘못된 프로토콜
      expect(isValidMediaUrl('ftp://pbs.twimg.com/media/image.jpg')).toBe(false);

      // 타입 안전성 테스트
      expect(isValidMediaUrl(null)).toBe(false);
      expect(isValidMediaUrl(undefined)).toBe(false);
      expect(isValidMediaUrl('')).toBe(false);
    });
  });

  describe('getHighQualityMediaUrl', () => {
    it('should convert URL to high quality version', () => {
      const smallImageUrl = createMockMediaUrl('image', { quality: 'small', format: 'jpg' });
      const mediumImageUrl = createMockMediaUrl('image', { quality: 'medium', format: 'png' });
      const smallVideoUrl = createMockMediaUrl('video', { quality: 'small' });

      const result1 = getHighQualityMediaUrl(smallImageUrl);
      expectUrlToHaveParams(result1, { name: 'large' });

      const result2 = getHighQualityMediaUrl(mediumImageUrl);
      expectUrlToHaveParams(result2, { name: 'large' });

      const result3 = getHighQualityMediaUrl(smallVideoUrl);
      expectUrlToHaveParams(result3, { name: 'large' });
    });

    it('should handle different quality options', () => {
      const baseUrl = createMockMediaUrl('image', { quality: 'small', format: 'jpg' });

      expect(getHighQualityMediaUrl(baseUrl, 'large')).toContain('name=large');
      expect(getHighQualityMediaUrl(baseUrl, 'medium')).toContain('name=medium');
      expect(getHighQualityMediaUrl(baseUrl, 'small')).toContain('name=small');
    });

    it('should return original URL if conversion fails', () => {
      const invalidUrl = 'invalid-url';
      expect(getHighQualityMediaUrl(invalidUrl)).toBe(invalidUrl);
    });
  });

  describe('getMediaUrlsFromTweet', () => {
    it('should extract media URLs from tweet document', () => {
      const mockImage = createMockImageElement(
        createMockMediaUrl('image', { format: 'jpg', quality: 'small' })
      );

      // 전역 document 객체 활용
      const mockDocument = {
        documentElement: {
          querySelectorAll: vi.fn(selector => {
            if (selector.includes('img')) {
              return [mockImage];
            }
            return [];
          }),
        },
      };

      const result = getMediaUrlsFromTweet(mockDocument, '1234567890');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle documents with no media', () => {
      const mockDocument = {
        documentElement: {
          querySelectorAll: vi.fn().mockReturnValue([]),
        },
      };

      const result = getMediaUrlsFromTweet(mockDocument, '1234567890');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should extract both images and videos', () => {
      const mockImage = createMockImageElement(createMockMediaUrl('image'));
      const mockVideo = createMockVideoElement(createMockMediaUrl('video'));

      const mockDocument = {
        documentElement: {
          querySelectorAll: vi.fn(selector => {
            if (selector.includes('img')) {
              return [mockImage];
            }
            if (selector.includes('video')) {
              return [mockVideo];
            }
            return [];
          }),
        },
      };

      const result = getMediaUrlsFromTweet(mockDocument, '1234567890');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle HTMLElement input instead of Document', () => {
      const mockElement = createMockElement('div');
      mockElement.querySelectorAll = vi.fn().mockReturnValue([]);

      const result = getMediaUrlsFromTweet(mockElement, '1234567890');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('URL Format Conversion', () => {
    it('should handle Twitter image URL format variations', () => {
      const testUrls = [
        createMockMediaUrl('image', { format: 'jpg' }),
        createMockMediaUrl('image', { format: 'png', quality: 'orig' }),
        createMockMediaUrl('image', { format: 'webp', quality: 'large' }),
      ];

      testUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(true);
        expectUrlToBeMediaUrl(url, 'image');

        const highQuality = getHighQualityMediaUrl(url);
        expect(highQuality).toContain('name=large');
      });
    });

    it('should preserve format parameter when converting quality', () => {
      const pngUrl = createMockMediaUrl('image', { format: 'png', quality: 'small' });
      const result = getHighQualityMediaUrl(pngUrl);

      expect(result).toContain('format=png');
      expect(result).toContain('name=large');
    });
  });

  describe('Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(() => getMediaUrlsFromTweet(null, '123')).not.toThrow();
      expect(() => isValidMediaUrl(null)).not.toThrow();
      expect(() => getHighQualityMediaUrl(undefined)).not.toThrow();
    });

    it('should handle malformed URLs', () => {
      const malformedUrls = ['https://', 'pbs.twimg.com/media/', '://malformed.url'];

      malformedUrls.forEach(url => {
        expect(() => isValidMediaUrl(url)).not.toThrow();
        expect(() => getHighQualityMediaUrl(url)).not.toThrow();
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large number of media elements efficiently', async () => {
      const manyImages = Array.from({ length: 100 }, (_, i) =>
        createMockImageElement(createMockMediaUrl('image', { id: `IMG${i}` }))
      );

      const mockDocument = {
        documentElement: {
          querySelectorAll: vi.fn(selector => {
            if (selector.includes('img')) {
              return manyImages;
            }
            return [];
          }),
        },
      };

      await expectFunctionToExecuteWithin(
        () => {
          const result = getMediaUrlsFromTweet(mockDocument, '1234567890');
          expect(Array.isArray(result)).toBe(true);
        },
        1000 // 1초 이내에 완료되어야 함
      );
    });
  });
});
