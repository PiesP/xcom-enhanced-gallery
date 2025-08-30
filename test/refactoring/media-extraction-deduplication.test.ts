/**
 * @fileoverview 미디어 추출 로직 중복 제거 TDD 테스트
 * @version 1.0.0 - RED Phase
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('RED Phase: 미디어 추출 로직 중복 문제', () => {
  describe('현재 중복 구현 확인', () => {
    it('FallbackStrategy와 DOMDirectStrategy의 isValidMediaUrl 로직이 다름', async () => {
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );
      const { DOMDirectStrategy } = await import('@shared/services/media-extraction/strategies');

      const fallbackStrategy = new FallbackStrategy();
      const domStrategy = new DOMDirectStrategy();

      // 테스트 URL들
      const testUrls = [
        'https://pbs.twimg.com/media/test.jpg',
        'https://video.twimg.com/test.mp4',
        'https://example.com/profile_images/test.jpg', // 프로필 이미지
        'data:image/jpeg;base64,/9j/', // Data URL
        'http://invalid-url', // HTTP (not HTTPS)
      ];

      // RED: 현재 두 전략의 검증 결과가 다를 수 있음
      const fallbackResults = testUrls.map(url => (fallbackStrategy as any).isValidMediaUrl(url));
      const domResults = testUrls.map(url => (domStrategy as any).isValidMediaUrl(url));

      // 현재는 다른 결과가 나올 수 있음 (문제 상황)
      expect(fallbackResults).not.toEqual(domResults);
    });

    it('createMediaInfo 로직이 여러 곳에서 중복됨', async () => {
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );

      const strategy = new FallbackStrategy();

      // RED: createMediaInfo 메서드가 private이므로 직접 접근 불가
      // 중복 제거 후에는 공통 유틸리티로 추출되어야 함
      expect((strategy as any).createMediaInfo).toBeDefined();

      // 현재는 각 추출 메서드마다 유사한 로직이 반복됨
      const methods = [
        'extractFromImages',
        'extractFromVideos',
        'extractFromDataAttributes',
        'extractFromBackgroundImages',
      ];
      methods.forEach(method => {
        expect((strategy as any)[method]).toBeDefined();
      });
    });
  });

  describe('통합 후 기대 결과', () => {
    it('공통 MediaValidationUtils가 존재해야 함', async () => {
      // GREEN: 이제 구현됨
      const { MediaValidationUtils } = await import('@shared/utils/media/MediaValidationUtils');
      expect(MediaValidationUtils).toBeDefined();
      expect(typeof MediaValidationUtils.isValidMediaUrl).toBe('function');
      expect(typeof MediaValidationUtils.detectMediaType).toBe('function');
    });

    it('공통 MediaInfoBuilder가 존재해야 함', async () => {
      // GREEN: 이제 구현됨
      const { MediaInfoBuilder } = await import('@shared/utils/media/MediaInfoBuilder');
      expect(MediaInfoBuilder).toBeDefined();
      expect(typeof MediaInfoBuilder.createMediaInfo).toBe('function');
      expect(typeof MediaInfoBuilder.createFromElement).toBe('function');
    });

    it('MediaValidationUtils가 일관된 검증 결과를 제공해야 함', async () => {
      const { MediaValidationUtils } = await import('@shared/utils/media/MediaValidationUtils');

      const testUrls = [
        'https://pbs.twimg.com/media/test.jpg',
        'https://video.twimg.com/test.mp4',
        'https://example.com/profile_images/test.jpg', // 프로필 이미지
        'data:image/jpeg;base64,/9j/', // Data URL
        'http://invalid-url', // HTTP (not HTTPS)
      ];

      const expectedResults = [true, true, false, false, false];

      testUrls.forEach((url, index) => {
        const result = MediaValidationUtils.isValidMediaUrl(url);
        expect(result).toBe(expectedResults[index]);
      });
    });

    it('MediaInfoBuilder가 일관된 MediaInfo를 생성해야 함', async () => {
      const { MediaInfoBuilder } = await import('@shared/utils/media/MediaInfoBuilder');

      const mediaInfo = MediaInfoBuilder.createMediaInfo(
        'test_1',
        'https://pbs.twimg.com/media/test.jpg',
        'image',
        undefined,
        { alt: 'Test Image' }
      );

      expect(mediaInfo).toMatchObject({
        id: 'test_1',
        type: 'image',
        url: 'https://pbs.twimg.com/media/test.jpg?name=orig',
        filename: expect.stringContaining('Test_Image'),
      });
    });
  });
});
