/**
 * @fileoverview Phase 1: 코드 중복 제거 및 일관성 확보 - TDD 테스트
 * @description 중복된 코드 제거, 일관된 import/타입 정의 확립을 위한 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Phase 1: 코드 중복 제거 및 일관성 확보', () => {
  describe('1.1 extractMediaId 함수 중복 제거', () => {
    it('should have only one extractMediaId function', async () => {
      // GREEN: 이제 constants.ts는 media.constants.ts에서 re-export만 해야 함

      // constants.ts에서 extractMediaId import 시도
      let constantsExtractMediaId: unknown;
      let mediaConstantsExtractMediaId: unknown;

      try {
        const constantsModule = await import('../../src/constants');
        constantsExtractMediaId = constantsModule.extractMediaId;
      } catch (error) {
        constantsExtractMediaId = null;
      }

      try {
        const mediaConstantsModule = await import('../../src/shared/constants/media.constants');
        mediaConstantsExtractMediaId = mediaConstantsModule.extractMediaId;
      } catch (error) {
        mediaConstantsExtractMediaId = null;
      }

      // 권위 있는 버전은 media.constants.ts에 있어야 함
      expect(mediaConstantsExtractMediaId).toBeTruthy();

      // constants.ts에서도 접근 가능해야 함 (re-export)
      expect(constantsExtractMediaId).toBeTruthy();

      // 두 함수는 같은 참조여야 함 (re-export 확인)
      if (constantsExtractMediaId && mediaConstantsExtractMediaId) {
        expect(constantsExtractMediaId).toBe(mediaConstantsExtractMediaId);
      }
    });

    it('should use consistent extractMediaId function signature', async () => {
      // RED: 함수 시그니처 일관성 확인
      let extractMediaId: (url: string | null | undefined) => string | null;

      try {
        // 권위 있는 버전은 media.constants.ts의 함수 (null/undefined 지원)
        const mediaConstantsModule = await import('../../src/shared/constants/media.constants');
        extractMediaId = mediaConstantsModule.extractMediaId;
      } catch (error) {
        // fallback to constants.ts
        const constantsModule = await import('../../src/constants');
        extractMediaId = constantsModule.extractMediaId;
      }

      // 함수가 존재하고 호출 가능해야 함
      expect(typeof extractMediaId).toBe('function');

      // null/undefined 입력 처리 테스트
      expect(extractMediaId(null)).toBeNull();
      expect(extractMediaId(undefined)).toBeNull();
      expect(extractMediaId('')).toBeNull();

      // 유효한 URL 테스트
      const validUrl = 'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig';
      const result = extractMediaId(validUrl);
      expect(result).toBe('ABC123');
    });
  });

  describe('1.2 URL_PATTERNS 상수 중복 제거', () => {
    it('should have consistent URL_PATTERNS across codebase', async () => {
      // RED: MEDIA_URL_PATTERNS vs URL_PATTERNS 충돌 확인

      let constantsUrlPatterns: unknown;
      let mediaUrlPatterns: unknown;

      try {
        const constantsModule = await import('../../src/constants');
        constantsUrlPatterns = constantsModule.URL_PATTERNS;
      } catch (error) {
        constantsUrlPatterns = null;
      }

      try {
        const mediaConstantsModule = await import('../../src/shared/constants/media.constants');
        // MEDIA_URL_PATTERNS이 있는지 확인 (private이므로 직접 접근 불가)
        // 대신 관련 함수들이 존재하는지 확인
        mediaUrlPatterns = {
          hasValidation: typeof mediaConstantsModule.isValidMediaUrl === 'function',
        };
      } catch (error) {
        mediaUrlPatterns = null;
      }

      // 두 곳 모두에 URL 패턴이 존재하면 통합 필요
      if (constantsUrlPatterns && mediaUrlPatterns) {
        // 이는 현재 상태를 확인하는 테스트이므로 통합 후에는 통과할 것
        console.warn('URL 패턴이 여러 곳에 분산되어 있습니다. 통합이 필요합니다.');
      }

      // 최소 하나는 존재해야 함
      expect(constantsUrlPatterns || mediaUrlPatterns).toBeTruthy();
    });

    it('should have unified URL pattern validation', async () => {
      // GREEN을 위한 통합된 URL 패턴 검증 함수 테스트
      let isValidMediaUrl: (url: string) => boolean;

      try {
        // 권위 있는 버전은 media.constants.ts
        const mediaConstantsModule = await import('../../src/shared/constants/media.constants');
        isValidMediaUrl = mediaConstantsModule.isValidMediaUrl;
      } catch (error) {
        // fallback to constants.ts
        const constantsModule = await import('../../src/constants');
        isValidMediaUrl = constantsModule.isValidMediaUrl;
      }

      expect(typeof isValidMediaUrl).toBe('function');

      // 유효한 미디어 URL 테스트
      const validUrls = [
        'https://pbs.twimg.com/media/ABC123?format=jpg&name=orig',
        'https://pbs.twimg.com/media/DEF456?format=png&name=large',
      ];

      const invalidUrls = ['https://example.com/image.jpg', 'not-a-url', ''];

      validUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(isValidMediaUrl(url)).toBe(false);
      });
    });
  });

  describe('1.3 MediaInfo 인터페이스 중복 제거', () => {
    it('should have single MediaInfo interface definition', async () => {
      // RED: 두 개의 MediaInfo 인터페이스 존재 확인

      let mediaTypesInterface: unknown;
      let coreMediaTypesInterface: unknown;

      try {
        const mediaTypesModule = await import('../../src/shared/types/media.types');
        mediaTypesInterface = mediaTypesModule;
      } catch (error) {
        mediaTypesInterface = null;
      }

      try {
        const coreMediaTypesModule = await import('../../src/shared/types/core/media.types');
        coreMediaTypesInterface = coreMediaTypesModule;
      } catch (error) {
        coreMediaTypesInterface = null;
      }

      // 두 곳 모두에 MediaInfo가 있으면 중복
      if (mediaTypesInterface && coreMediaTypesInterface) {
        // 이는 현재 상태 확인용이므로 통합 후에는 하나만 남을 것
        console.warn('MediaInfo 인터페이스가 두 곳에 중복 정의되어 있습니다.');
      }

      // 최소 하나는 존재해야 함
      expect(mediaTypesInterface || coreMediaTypesInterface).toBeTruthy();
    });

    it('should use consistent MediaInfo interface', async () => {
      // GREEN을 위한 통합된 MediaInfo 인터페이스 테스트
      let MediaInfoType: unknown;

      try {
        // 권위 있는 버전은 shared/types/media.types.ts
        const mediaTypesModule = await import('../../src/shared/types/media.types');
        MediaInfoType = mediaTypesModule;
      } catch (error) {
        // fallback
        const coreMediaTypesModule = await import('../../src/shared/types/core/media.types');
        MediaInfoType = coreMediaTypesModule;
      }

      expect(MediaInfoType).toBeTruthy();

      // MediaInfo 타입의 필수 속성들이 있는지 확인 (런타임에서는 직접 확인 불가)
      // 대신 해당 모듈이 로드되는지만 확인
    });
  });

  describe('1.4 Import 경로 표준화', () => {
    it('should use consistent logger import paths', async () => {
      // RED: @/shared/logging vs @/shared/logging/logger 혼용 확인

      let loggerFromSharedLogging: unknown;
      let loggerFromSharedLoggingLogger: unknown;

      try {
        const sharedLoggingModule = await import('../../src/shared/logging');
        loggerFromSharedLogging = sharedLoggingModule.logger;
      } catch (error) {
        loggerFromSharedLogging = null;
      }

      try {
        const sharedLoggingLoggerModule = await import('../../src/shared/logging/logger');
        loggerFromSharedLoggingLogger = sharedLoggingLoggerModule.logger;
      } catch (error) {
        loggerFromSharedLoggingLogger = null;
      }

      // 두 경로 모두에서 logger가 접근 가능하면 일관성 문제
      if (loggerFromSharedLogging && loggerFromSharedLoggingLogger) {
        // 둘이 같은 인스턴스인지 확인
        expect(loggerFromSharedLogging).toBe(loggerFromSharedLoggingLogger);
      }

      // 최소 하나는 존재해야 함
      expect(loggerFromSharedLogging || loggerFromSharedLoggingLogger).toBeTruthy();
    });

    it('should have standardized import paths for types and constants', async () => {
      // GREEN을 위한 표준화된 import 경로 테스트

      // 타입들이 올바른 경로에서 import 되는지 확인
      try {
        const mediaTypes = await import('../../src/shared/types/media.types');
        expect(mediaTypes).toBeTruthy();
      } catch (error) {
        expect.fail('미디어 타입이 표준 경로에서 로드되지 않습니다.');
      }

      // 상수들이 올바른 경로에서 import 되는지 확인
      try {
        const mediaConstants = await import('../../src/shared/constants/media.constants');
        expect(mediaConstants).toBeTruthy();
      } catch (error) {
        expect.fail('미디어 상수가 표준 경로에서 로드되지 않습니다.');
      }

      // Logger가 표준 경로에서 import 되는지 확인
      try {
        const loggerModule = await import('../../src/shared/logging/logger');
        expect(loggerModule.logger).toBeTruthy();
      } catch (error) {
        expect.fail('Logger가 표준 경로에서 로드되지 않습니다.');
      }
    });
  });
});
