/**
 * Media URL Utility 포괄적 테스트
 * @description 트위터 미디어 URL 처리 및 변환 기능의 통합 테스트
 * @fileoverview 실제 사용 시나리오를 기반으로 한 종합 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// @shared/dom 모킹
vi.mock('@shared/dom', () => ({
  cachedQuerySelectorAll: vi.fn(),
}));

import { getOriginalImageUrl, getVideoThumbnailUrl } from '@shared/utils/media/media-url.util';
import { cachedQuerySelectorAll } from '@shared/dom';

import {
  getMediaUrlsFromTweet,
  createMediaInfoFromImage,
  createMediaInfoFromVideo,
  isValidMediaUrl,
  extractOriginalImageUrl,
} from '@shared/utils/media/media-url.util';

// DOM 환경 모킹
const createMockDocument = () => {
  const mockDoc = {
    documentElement: {
      querySelectorAll: vi.fn(),
    },
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
  };
  return mockDoc as Document;
};

const createMockImageElement = (src: string): HTMLImageElement => {
  return {
    src,
    alt: 'Test image',
    width: 1200,
    height: 800,
    dataset: {},
  } as HTMLImageElement;
};

const createMockVideoElement = (src: string, poster?: string): HTMLVideoElement => {
  return {
    src,
    poster: poster ?? 'https://pbs.twimg.com/media/video_thumb.jpg',
    videoWidth: 1920,
    videoHeight: 1080,
    dataset: {},
  } as HTMLVideoElement;
};

describe('Media URL Utility - Business Logic Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('isValidMediaUrl', () => {
    it('should validate Twitter media URLs', () => {
      const validUrls = [
        'https://pbs.twimg.com/media/FxYzAbCDEfg.jpg',
        'https://video.twimg.com/ext_tw_video/1234567890/1080p.mp4',
        'https://pbs.twimg.com/media/image.png?format=png&name=large',
      ];

      validUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'https://example.com/image.jpg',
        'https://pbs.twimg.com/profile_images/user.jpg', // 프로필 이미지 제외
        'data:image/svg+xml;base64,PHN2Zw==', // 데이터 URL 제외
      ];

      invalidUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidMediaUrl(null as any)).toBe(false);
      expect(isValidMediaUrl(undefined as any)).toBe(false);
      expect(isValidMediaUrl(123 as any)).toBe(false);
    });
  });

  describe('extractOriginalImageUrl', () => {
    it('should extract original URL from Twitter image URLs', () => {
      const testCases = [
        {
          input: 'https://pbs.twimg.com/media/FxYzAbCDEfg.jpg?format=jpg&name=small',
          expected: 'https://pbs.twimg.com/media/FxYzAbCDEfg.jpg?format=jpg&name=orig',
        },
        {
          input: 'https://pbs.twimg.com/media/image.png?format=png&name=medium',
          expected: 'https://pbs.twimg.com/media/image.png?format=png&name=orig',
        },
        {
          input: 'https://pbs.twimg.com/media/test.webp',
          expected: 'https://pbs.twimg.com/media/test.webp?name=orig',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(extractOriginalImageUrl(input)).toBe(expected);
      });
    });

    it('should handle URLs without parameters', () => {
      const url = 'https://pbs.twimg.com/media/FxYzAbCDEfg.jpg';
      const expected = 'https://pbs.twimg.com/media/FxYzAbCDEfg.jpg?name=orig';
      expect(extractOriginalImageUrl(url)).toBe(expected);
    });

    it('should preserve existing orig parameter', () => {
      const url = 'https://pbs.twimg.com/media/FxYzAbCDEfg.jpg?format=jpg&name=orig';
      expect(extractOriginalImageUrl(url)).toBe(url);
    });
  });

  describe('createMediaInfoFromImage', () => {
    it('should create valid media info from image element', () => {
      const mockImg = createMockImageElement(
        'https://pbs.twimg.com/media/test.jpg?format=jpg&name=medium'
      );
      const result = createMediaInfoFromImage(mockImg, '1234567890', 0);

      expect(result).toBeDefined();
      if (result) {
        expect(result.type).toBe('image');
        expect(result.url).toContain('name=orig');
        expect(result.width).toBe(1200);
        expect(result.height).toBe(800);
      }
    });

    it('should handle invalid image elements', () => {
      const mockImg = createMockImageElement('invalid-url');
      const result = createMediaInfoFromImage(mockImg, '1234567890', 0);

      expect(result).toBeNull();
    });

    it('should generate proper filename', () => {
      const mockImg = createMockImageElement('https://pbs.twimg.com/media/FxYzAbCDEfg.jpg');
      const result = createMediaInfoFromImage(mockImg, '1234567890', 0);

      expect(result?.filename).toBe('FxYzAbCDEfg.jpg');
    });
  });

  describe('createMediaInfoFromVideo', () => {
    it('should create valid media info from video element', () => {
      const mockVideo = createMockVideoElement(
        'https://video.twimg.com/ext_tw_video/1234567890/1080p.mp4'
      );
      const result = createMediaInfoFromVideo(mockVideo, '1234567890', 0);

      expect(result).toBeDefined();
      if (result) {
        expect(result.type).toBe('video');
        expect(result.url).toContain('.mp4');
        expect(result.width).toBe(1920);
        expect(result.height).toBe(1080);
      }
    });

    it('should handle videos without valid URLs', () => {
      const mockVideo = createMockVideoElement('', ''); // src와 poster 모두 빈 문자열
      const result = createMediaInfoFromVideo(mockVideo, '1234567890', 0);

      expect(result).toBeNull();
    });
  });

  describe('getMediaUrlsFromTweet - Integration Test', () => {
    it('should extract media from document with cached queries', () => {
      const mockImage = createMockImageElement('https://pbs.twimg.com/media/test1.jpg');
      const mockVideo = createMockVideoElement(
        'https://video.twimg.com/ext_tw_video/123/1080p.mp4'
      );

      // cachedQuerySelectorAll 모킹 설정
      const mockCachedQuerySelectorAll = vi.mocked(cachedQuerySelectorAll);
      mockCachedQuerySelectorAll.mockImplementation((selector: string) => {
        if (selector.includes('img')) {
          return [mockImage] as any;
        } else if (selector.includes('video')) {
          return [mockVideo] as any;
        }
        return [] as any;
      });

      const result = getMediaUrlsFromTweet(document, '1234567890');

      expect(Array.isArray(result)).toBe(true);
      expect(mockCachedQuerySelectorAll).toHaveBeenCalled();
    });

    it('should handle empty document gracefully', () => {
      // cachedQuerySelectorAll이 빈 배열을 반환하도록 모킹
      const mockCachedQuerySelectorAll = vi.mocked(cachedQuerySelectorAll);
      mockCachedQuerySelectorAll.mockReturnValue([]);

      const result = getMediaUrlsFromTweet(document, '1234567890');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted media elements', () => {
      const corruptedImg = {
        src: null,
        alt: null,
        width: NaN,
        height: NaN,
      } as unknown as HTMLImageElement;

      const result = createMediaInfoFromImage(corruptedImg, '1234567890', 0);
      expect(result).toBeNull();
    });

    it('should handle extremely large indexes', () => {
      const mockImg = createMockImageElement('https://pbs.twimg.com/media/test.jpg');
      const result = createMediaInfoFromImage(mockImg, '1234567890', 999999);

      // 인덱스는 내부적으로만 사용되고 order 속성은 제거됨
      expect(result).toBeDefined();
      expect(result?.id).toBeDefined();
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle URL parsing performance for long URLs', () => {
      const longParams = '&'.repeat(1000) + 'name=large';
      const longUrl = `https://pbs.twimg.com/media/test.jpg?format=jpg${longParams}`;

      const result = extractOriginalImageUrl(longUrl);
      expect(result).toContain('name=orig');
    });

    it('should validate extremely long URLs', () => {
      const extremelyLongUrl = 'https://pbs.twimg.com/media/' + 'a'.repeat(10000) + '.jpg';
      const result = isValidMediaUrl(extremelyLongUrl);

      // 실제 Twitter URL 패턴과 맞지 않으므로 false여야 함
      expect(result).toBe(false);
    });
  });
});
