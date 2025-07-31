/**
 * Media URL Utilities - 통합 테스트
 * 미디어 URL 추출, 변환, 검증 기능의 통합 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMediaUrlsFromTweet,
  isValidMediaUrl,
  getHighQualityMediaUrl,
  extractOriginalImageUrl,
  cleanFilename,
} from '@shared/utils/media/media-url.util';

describe('Media URL Utilities - 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL 검증', () => {
    it('유효한 Twitter 미디어 URL을 올바르게 검증해야 한다', () => {
      const validUrls = [
        'https://pbs.twimg.com/media/test.jpg',
        'https://pbs.twimg.com/media/test.png',
        'https://pbs.twimg.com/media/test.gif',
      ];

      validUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(true);
      });
    });

    it('유효하지 않은 URL을 거부해야 한다', () => {
      const invalidUrls = ['', 'invalid-url', 'https://example.com/image.jpg'];

      invalidUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(false);
      });
    });
  });

  describe('고품질 URL 변환', () => {
    it('이미지 URL을 처리해야 한다', () => {
      const originalUrl = 'https://pbs.twimg.com/media/test.jpg';
      const result = getHighQualityMediaUrl(originalUrl);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('원본 이미지 URL 추출', () => {
    it('URL에서 원본을 추출해야 한다', () => {
      const url = 'https://pbs.twimg.com/media/test.jpg';
      const result = extractOriginalImageUrl(url);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('파일명 정리', () => {
    it('파일명을 정리해야 한다', () => {
      const filename = 'test file.jpg';
      const result = cleanFilename(filename);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('트윗에서 미디어 추출', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = {
        querySelectorAll: vi.fn(() => []),
        querySelector: vi.fn(() => null),
        getAttribute: vi.fn(() => null),
      } as any;
    });

    it('미디어 정보를 추출해야 한다', () => {
      const result = getMediaUrlsFromTweet(mockElement, 'test123');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
