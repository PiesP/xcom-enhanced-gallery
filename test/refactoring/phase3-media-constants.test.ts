/**
 * @fileoverview Phase 3: 상수 파일 분해 - 미디어 상수 TDD 테스트
 * @description constants.ts의 미디어 관련 상수를 분리하는 TDD 테스트
 */

/**
 * Phase 3: 상수 파일 분해 - 미디어 상수 TDD 테스트
 *
 * 목표: constants.ts의 미디어 관련 상수를 분리
 */

import { describe, it, expect } from 'vitest';
import {
  MEDIA_QUALITY,
  MEDIA_TYPES,
  MEDIA_EXTENSIONS,
  MEDIA_DOMAINS,
  isValidMediaUrl,
  extractMediaId,
  generateOriginalUrl,
} from '@shared/constants/media.constants';

describe('MediaConstants - TDD Phase 3.1', () => {
  describe('미디어 품질 상수', () => {
    it('미디어 품질 상수가 정의되어야 한다', () => {
      expect(MEDIA_QUALITY.ORIGINAL).toBe('orig');
      expect(MEDIA_QUALITY.LARGE).toBe('large');
      expect(MEDIA_QUALITY.MEDIUM).toBe('medium');
      expect(MEDIA_QUALITY.SMALL).toBe('small');
    });

    it('미디어 품질 상수가 불변이어야 한다', () => {
      // Then: 상수 객체가 불변이어야 함
      expect(() => {
        // @ts-expect-error - 의도적으로 불변성 테스트
        MEDIA_QUALITY.ORIGINAL = 'modified';
      }).toThrow();
    });
  });

  describe('미디어 타입 상수', () => {
    it('미디어 타입 상수가 정의되어야 한다', () => {
      expect(MEDIA_TYPES.IMAGE).toBe('image');
      expect(MEDIA_TYPES.VIDEO).toBe('video');
      expect(MEDIA_TYPES.GIF).toBe('gif');
    });

    it('모든 미디어 타입이 문자열이어야 한다', () => {
      const types = Object.values(MEDIA_TYPES);
      for (const type of types) {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      }
    });
  });

  describe('미디어 확장자 상수', () => {
    it('미디어 확장자 상수가 정의되어야 한다', () => {
      expect(MEDIA_EXTENSIONS.JPEG).toBe('jpg');
      expect(MEDIA_EXTENSIONS.PNG).toBe('png');
      expect(MEDIA_EXTENSIONS.WEBP).toBe('webp');
      expect(MEDIA_EXTENSIONS.GIF).toBe('gif');
      expect(MEDIA_EXTENSIONS.MP4).toBe('mp4');
      expect(MEDIA_EXTENSIONS.ZIP).toBe('zip');
    });

    it('확장자는 소문자여야 한다', () => {
      const extensions = Object.values(MEDIA_EXTENSIONS);
      for (const ext of extensions) {
        expect(ext).toBe(ext.toLowerCase());
      }
    });
  });

  describe('미디어 도메인 상수', () => {
    it('지원 도메인이 정의되어야 한다', () => {
      expect(MEDIA_DOMAINS).toContain('pbs.twimg.com');
      expect(MEDIA_DOMAINS).toContain('video.twimg.com');
      expect(MEDIA_DOMAINS).toContain('abs.twimg.com');
    });

    it('도메인 배열이 읽기 전용이어야 한다', () => {
      // Then: 배열이 불변이어야 함
      expect(() => {
        // @ts-expect-error - 의도적으로 불변성 테스트
        MEDIA_DOMAINS.push('malicious.com');
      }).toThrow();
    });
  });

  describe('미디어 URL 유효성 검사', () => {
    it('유효한 미디어 URL을 식별할 수 있어야 한다', () => {
      // Given: 유효한 미디어 URL들
      const validUrls = [
        'https://pbs.twimg.com/media/ABC123?format=jpg&name=large',
        'https://pbs.twimg.com/media/DEF456?format=png&name=orig',
        'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/GHI789.jpg',
      ];

      // When & Then: 모든 URL이 유효해야 함
      for (const url of validUrls) {
        expect(isValidMediaUrl(url)).toBe(true);
      }
    });

    it('무효한 미디어 URL을 식별할 수 있어야 한다', () => {
      // Given: 무효한 URL들
      const invalidUrls = [
        'https://example.com/image.jpg',
        'https://pbs.twimg.com/profile_images/123.jpg',
        'not-a-url',
        '',
        'https://malicious.com/media/fake',
      ];

      // When & Then: 모든 URL이 무효해야 함
      for (const url of invalidUrls) {
        expect(isValidMediaUrl(url)).toBe(false);
      }
    });
  });

  describe('미디어 ID 추출', () => {
    it('일반 미디어 URL에서 ID를 추출할 수 있어야 한다', () => {
      // Given: 일반 미디어 URL
      const url = 'https://pbs.twimg.com/media/ABC123DEF?format=jpg&name=large';

      // When: ID 추출
      const mediaId = extractMediaId(url);

      // Then: 올바른 ID가 추출되어야 함
      expect(mediaId).toBe('ABC123DEF');
    });

    it('비디오 썸네일 URL에서 ID를 추출할 수 있어야 한다', () => {
      // Given: 비디오 썸네일 URL
      const url = 'https://pbs.twimg.com/ext_tw_video_thumb/123456789/pu/img/XYZ789ABC.jpg';

      // When: ID 추출
      const mediaId = extractMediaId(url);

      // Then: 이미지 ID가 추출되어야 함
      expect(mediaId).toBe('XYZ789ABC');
    });

    it('무효한 URL에서는 null을 반환해야 한다', () => {
      // Given: 무효한 URL들
      const invalidUrls = ['https://example.com/image.jpg', 'invalid-url', '', null, undefined];

      // When & Then: 모든 경우에 null 반환
      for (const url of invalidUrls) {
        expect(extractMediaId(url as string)).toBeNull();
      }
    });
  });

  describe('원본 URL 생성', () => {
    it('미디어 URL에서 원본 URL을 생성할 수 있어야 한다', () => {
      // Given: 미디어 URL
      const url = 'https://pbs.twimg.com/media/ABC123?format=jpg&name=large';

      // When: 원본 URL 생성
      const originalUrl = generateOriginalUrl(url);

      // Then: 원본 URL이 생성되어야 함
      expect(originalUrl).toBe('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig');
    });

    it('포맷이 없는 URL에서는 기본 포맷을 사용해야 한다', () => {
      // Given: 포맷이 없는 URL
      const url = 'https://pbs.twimg.com/media/ABC123?name=large';

      // When: 원본 URL 생성
      const originalUrl = generateOriginalUrl(url);

      // Then: 기본 포맷(jpg)이 사용되어야 함
      expect(originalUrl).toBe('https://pbs.twimg.com/media/ABC123?format=jpg&name=orig');
    });

    it('무효한 URL에서는 null을 반환해야 한다', () => {
      // Given: 무효한 URL
      const invalidUrl = 'https://example.com/image.jpg';

      // When: 원본 URL 생성 시도
      const originalUrl = generateOriginalUrl(invalidUrl);

      // Then: null이 반환되어야 함
      expect(originalUrl).toBeNull();
    });
  });

  describe('상수 간 일관성', () => {
    it('미디어 타입과 확장자가 일관성 있게 매핑되어야 한다', () => {
      // Given: 미디어 타입별 예상 확장자
      const typeExtensionMap = {
        [MEDIA_TYPES.IMAGE]: [MEDIA_EXTENSIONS.JPEG, MEDIA_EXTENSIONS.PNG, MEDIA_EXTENSIONS.WEBP],
        [MEDIA_TYPES.VIDEO]: [MEDIA_EXTENSIONS.MP4],
        [MEDIA_TYPES.GIF]: [MEDIA_EXTENSIONS.GIF],
      };

      // Then: 매핑이 논리적으로 일관성이 있어야 함
      expect(typeExtensionMap[MEDIA_TYPES.IMAGE]).toContain(MEDIA_EXTENSIONS.JPEG);
      expect(typeExtensionMap[MEDIA_TYPES.VIDEO]).toContain(MEDIA_EXTENSIONS.MP4);
      expect(typeExtensionMap[MEDIA_TYPES.GIF]).toContain(MEDIA_EXTENSIONS.GIF);
    });

    it('모든 품질 옵션이 유효한 문자열이어야 한다', () => {
      // Given: 모든 품질 옵션
      const qualities = Object.values(MEDIA_QUALITY);

      // Then: 모든 품질이 유효한 문자열이어야 함
      for (const quality of qualities) {
        expect(typeof quality).toBe('string');
        expect(quality.length).toBeGreaterThan(0);
        expect(quality).not.toContain(' '); // 공백 없음
        expect(quality).toBe(quality.toLowerCase()); // 소문자
      }
    });
  });
});
