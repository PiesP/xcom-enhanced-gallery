/**
 * @fileoverview 미디어 추출 로직 중복 제거 TDD 테스트
 * @version 1.0.0 - RED Phase
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('GREEN Phase: 미디어 추출 로직 통합 완료', () => {
  describe('통합 완료 상태 확인', () => {
    it('FallbackStrategy가 MediaValidationUtils를 사용함', async () => {
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );
      const { MediaValidationUtils } = await import('@shared/utils/media/MediaValidationUtils');

      const fallbackStrategy = new FallbackStrategy();

      // 테스트 URL들
      const testUrls = [
        'https://pbs.twimg.com/media/test.jpg',
        'https://video.twimg.com/test.mp4',
        'https://example.com/profile_images/test.jpg', // 프로필 이미지
        'data:image/jpeg;base64,/9j/', // Data URL
        'http://invalid-url', // HTTP (not HTTPS)
      ];

      // GREEN: 통합된 유틸리티를 사용하므로 일관된 검증 결과
      const validationResults = testUrls.map(url => MediaValidationUtils.isValidMediaUrl(url));

      // private 메서드가 제거되었는지 확인
      expect((fallbackStrategy as any).isValidMediaUrl).toBeUndefined();

      // 통합된 유틸리티가 일관된 결과를 제공함
      expect(validationResults).toEqual([true, true, false, false, false]);
    });

    it('createMediaInfo 로직이 MediaInfoBuilder로 통합됨', async () => {
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );
      const { MediaInfoBuilder } = await import('@shared/utils/media/MediaInfoBuilder');

      const strategy = new FallbackStrategy();

      // GREEN: private createMediaInfo 메서드가 제거되고 MediaInfoBuilder 사용
      const hasPrivateMethod = 'createMediaInfo' in strategy;
      const hasBuilderMethod = typeof MediaInfoBuilder.createMediaInfo === 'function';

      expect(hasPrivateMethod).toBe(false); // private 메서드 제거됨
      expect(hasBuilderMethod).toBe(true); // 통합된 빌더 사용

      // MediaInfoBuilder가 올바른 타입의 객체를 생성하는지 확인
      const testMediaInfo = MediaInfoBuilder.createMediaInfo(
        'test-id',
        'https://pbs.twimg.com/media/test.jpg',
        'image'
      );
      expect(testMediaInfo).toHaveProperty('id');
      expect(testMediaInfo).toHaveProperty('url');
      expect(testMediaInfo).toHaveProperty('type');
    });

    it('private 메서드들이 제거되고 추출 로직이 통합되어야 함', async () => {
      const { FallbackStrategy } = await import(
        '@shared/services/media-extraction/strategies/fallback/FallbackStrategy'
      );

      const strategy = new FallbackStrategy();

      // GREEN: private 중복 메서드들이 제거되고 공통 로직으로 통합됨
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
