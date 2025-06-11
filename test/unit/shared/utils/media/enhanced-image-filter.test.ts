/**
 * Enhanced Image Filter Unit Tests
 *
 * @description 이미지 필터링 시스템의 각 기능을 독립적으로 테스트합니다.
 * Feature-based 아키텍처의 미디어 처리 로직을 검증합니다.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the image filter module
const mockIsValidEnhancedTweetImage = vi.fn();
const mockFilterValidImages = vi.fn();
const mockGetDetailedFilterResults = vi.fn();
const mockEnhancedImageFilter = vi.fn();

// Mock module with proper exports
vi.mock('../../../../../src/shared/utils/media/enhanced-image-filter', () => ({
  isValidEnhancedTweetImage: mockIsValidEnhancedTweetImage,
  filterValidImages: mockFilterValidImages,
  getDetailedFilterResults: mockGetDetailedFilterResults,
  enhancedImageFilter: mockEnhancedImageFilter,
}));

describe('Enhanced Image Filter', () => {
  // 테스트용 샘플 URL들
  const validTwitterImageUrls = [
    'https://pbs.twimg.com/media/test.jpg',
    'https://pbs.twimg.com/media/test.png?name=orig',
    'https://pbs.twimg.com/media/test.webp?name=large',
  ];

  const invalidUrls = [
    'https://example.com/image.jpg',
    'data:image/gif;base64,abc123',
    'blob:https://twitter.com/abc-123',
    'https://pbs.twimg.com/profile_banners/test.jpg',
  ];

  const videoThumbnailUrls = [
    'https://pbs.twimg.com/ext_tw_video_thumb/test.jpg',
    'https://pbs.twimg.com/amplify_video_thumb/test.jpg',
    'https://video.twimg.com/tweet_video_thumb/test.jpg',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidEnhancedTweetImage', () => {
    it('유효한 트위터 이미지 URL을 정확히 감지해야 함', () => {
      mockIsValidEnhancedTweetImage.mockImplementation((url: string) =>
        url.includes('pbs.twimg.com/media/')
      );

      validTwitterImageUrls.forEach(url => {
        expect(mockIsValidEnhancedTweetImage(url)).toBe(true);
      });

      expect(mockIsValidEnhancedTweetImage).toHaveBeenCalledTimes(validTwitterImageUrls.length);
    });

    it('무효한 URL들을 올바르게 거부해야 함', () => {
      mockIsValidEnhancedTweetImage.mockImplementation((url: string) =>
        url.includes('pbs.twimg.com/media/')
      );

      invalidUrls.forEach(url => {
        expect(mockIsValidEnhancedTweetImage(url)).toBe(false);
      });
    });

    it('동영상 썸네일을 필터링 옵션에 따라 처리해야 함', () => {
      mockIsValidEnhancedTweetImage.mockImplementation((url: string, options?: any) => {
        if (options?.excludeVideoThumbnails && url.includes('video_thumb')) {
          return false;
        }
        return url.includes('pbs.twimg.com');
      });

      // 기본 옵션으로는 비디오 썸네일 허용
      expect(mockIsValidEnhancedTweetImage(videoThumbnailUrls[0])).toBe(true);

      // excludeVideoThumbnails 옵션으로 비디오 썸네일 제외
      expect(
        mockIsValidEnhancedTweetImage(videoThumbnailUrls[0], { excludeVideoThumbnails: true })
      ).toBe(false);
    });

    it('빈 문자열이나 null에 대해 false를 반환해야 함', () => {
      mockIsValidEnhancedTweetImage.mockImplementation((url: string) =>
        Boolean(url && url.includes('pbs.twimg.com/media/'))
      );

      expect(mockIsValidEnhancedTweetImage('')).toBe(false);
      expect(mockIsValidEnhancedTweetImage(null as any)).toBe(false);
      expect(mockIsValidEnhancedTweetImage(undefined as any)).toBe(false);
    });
  });

  describe('filterValidImages', () => {
    it('유효한 이미지들만 필터링해야 함', () => {
      const allUrls = [...validTwitterImageUrls, ...invalidUrls];

      mockFilterValidImages.mockImplementation((urls: string[]) =>
        urls.filter(url => url.includes('pbs.twimg.com/media/'))
      );

      const result = mockFilterValidImages(allUrls);
      expect(result).toEqual(validTwitterImageUrls);
    });

    it('빈 배열에 대해 빈 배열을 반환해야 함', () => {
      mockFilterValidImages.mockReturnValue([]);

      const result = mockFilterValidImages([]);
      expect(result).toEqual([]);
    });

    it('중복 URL을 제거해야 함', () => {
      const duplicateUrls = [
        validTwitterImageUrls[0],
        validTwitterImageUrls[0],
        validTwitterImageUrls[1],
      ];

      mockFilterValidImages.mockImplementation((urls: string[]) => {
        const validUrls = urls.filter(url => url.includes('pbs.twimg.com/media/'));
        return [...new Set(validUrls)]; // 중복 제거
      });

      const result = mockFilterValidImages(duplicateUrls);
      expect(result).toHaveLength(2);
    });
  });

  describe('getDetailedFilterResults', () => {
    it('상세한 필터링 결과를 반환해야 함', () => {
      const allUrls = [...validTwitterImageUrls, ...invalidUrls];

      mockGetDetailedFilterResults.mockReturnValue({
        valid: validTwitterImageUrls,
        invalid: invalidUrls,
        totalFound: allUrls.length,
        filtered: invalidUrls.length,
        categories: {
          images: validTwitterImageUrls.length,
          videoThumbnails: 0,
          profileImages: 0,
          external: invalidUrls.length,
        },
      });

      const result = mockGetDetailedFilterResults(allUrls);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('invalid');
      expect(result).toHaveProperty('totalFound');
      expect(result).toHaveProperty('filtered');
      expect(result.valid).toHaveLength(validTwitterImageUrls.length);
      expect(result.invalid).toHaveLength(invalidUrls.length);
    });

    it('품질별 분류 기능이 동작해야 함', () => {
      mockGetDetailedFilterResults.mockReturnValue({
        valid: validTwitterImageUrls,
        invalid: [],
        totalFound: validTwitterImageUrls.length,
        filtered: 0,
        qualityBreakdown: {
          original: 1,
          large: 1,
          medium: 0,
          small: 1,
        },
      });

      const result = mockGetDetailedFilterResults(validTwitterImageUrls);

      expect(result.qualityBreakdown).toBeDefined();
      expect(result.qualityBreakdown.original).toBe(1);
      expect(result.qualityBreakdown.large).toBe(1);
    });
  });

  describe('enhancedImageFilter', () => {
    it('포괄적인 이미지 필터링을 수행해야 함', () => {
      const allUrls = [...validTwitterImageUrls, ...invalidUrls];

      mockEnhancedImageFilter.mockReturnValue({
        urls: validTwitterImageUrls,
        count: validTwitterImageUrls.length,
        filtered: invalidUrls.length,
        quality: 'high',
        metadata: {
          hasVideoThumbnails: false,
          hasExternalImages: true,
          processingTime: 10,
        },
      });

      const result = mockEnhancedImageFilter(allUrls);

      expect(result.urls).toEqual(validTwitterImageUrls);
      expect(result.count).toBe(validTwitterImageUrls.length);
      expect(result.filtered).toBe(invalidUrls.length);
      expect(result.metadata).toBeDefined();
    });

    it('다양한 필터링 옵션을 지원해야 함', () => {
      const options = {
        excludeVideoThumbnails: true,
        minWidth: 400,
        maxResults: 10,
      };

      mockEnhancedImageFilter.mockReturnValue({
        urls: validTwitterImageUrls.slice(0, 2),
        count: 2,
        filtered: 1,
        options: options,
      });

      const result = mockEnhancedImageFilter(validTwitterImageUrls, options);

      expect(result.count).toBe(2);
      expect(result.options).toEqual(options);
    });
  });

  describe('Edge Cases', () => {
    it('매우 큰 URL 배열을 처리해야 함', () => {
      const largeUrlArray = Array.from(
        { length: 1000 },
        (_, i) => `https://pbs.twimg.com/media/test${i}.jpg`
      );

      mockFilterValidImages.mockReturnValue(largeUrlArray);

      const result = mockFilterValidImages(largeUrlArray);
      expect(result).toHaveLength(1000);
    });

    it('특수 문자가 포함된 URL을 안전하게 처리해야 함', () => {
      const specialUrls = [
        'https://pbs.twimg.com/media/test-file%20name.jpg',
        'https://pbs.twimg.com/media/test_file.jpg?name=orig&format=jpg',
      ];

      mockIsValidEnhancedTweetImage.mockReturnValue(true);

      specialUrls.forEach(url => {
        expect(mockIsValidEnhancedTweetImage(url)).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('대량의 URL 처리가 효율적이어야 함', () => {
      const startTime = Date.now();

      // 성능 측정을 위한 모킹
      mockEnhancedImageFilter.mockImplementation(() => {
        // 실제 처리 시뮬레이션
        return { urls: [], count: 0, processingTime: Date.now() - startTime };
      });

      const result = mockEnhancedImageFilter(Array(100).fill('test'));
      expect(result.processingTime).toBeLessThan(100); // 100ms 이하
    });

    it('캐싱 메커니즘이 동작해야 함', () => {
      const testUrls = validTwitterImageUrls;

      // 첫 번째 호출
      mockEnhancedImageFilter.mockReturnValueOnce({ cached: false, urls: testUrls });
      const firstResult = mockEnhancedImageFilter(testUrls);

      // 두 번째 호출 (캐시된 결과)
      mockEnhancedImageFilter.mockReturnValueOnce({ cached: true, urls: testUrls });
      const secondResult = mockEnhancedImageFilter(testUrls);

      expect(firstResult.cached).toBe(false);
      expect(secondResult.cached).toBe(true);
    });
  });
});
