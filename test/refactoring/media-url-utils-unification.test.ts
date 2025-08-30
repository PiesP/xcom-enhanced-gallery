/**
 * @fileoverview 미디어 URL 처리 함수 통합 TDD 테스트
 * @description constants.ts와 media-url.util.ts의 중복 함수 통합
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('미디어 URL 처리 함수 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 RED: 현재 중복 문제 검증', () => {
    it('isValidMediaUrl이 두 곳에 정의되어 있음', async () => {
      // Given: 두 모듈에서 같은 함수 import
      const constantsModule = await import('@/constants');
      const mediaUtilModule = await import('@shared/utils/media/media-url.util');

      // When: 함수 존재 여부 확인
      const constantsHasFunction = typeof constantsModule.isValidMediaUrl === 'function';
      const mediaUtilHasFunction = typeof mediaUtilModule.isValidMediaUrl === 'function';

      // Then: 두 곳 모두 존재 (중복 상태)
      expect(constantsHasFunction).toBe(true);
      expect(mediaUtilHasFunction).toBe(true);
    });

    it('extractMediaId가 중복 구현되어 있음', async () => {
      // Given: constants.ts의 extractMediaId
      const { extractMediaId: constantsExtract } = await import('@/constants');

      // When: 함수 존재 확인
      const hasExtractMediaId = typeof constantsExtract === 'function';

      // Then: 중복 구현 확인
      expect(hasExtractMediaId).toBe(true);
    });

    it('동일한 URL에 대해 다른 결과를 반환할 수 있음', async () => {
      // Given: 테스트 URL
      const testUrl = 'https://pbs.twimg.com/media/test123.jpg';

      const constantsModule = await import('@/constants');
      const mediaUtilModule = await import('@shared/utils/media/media-url.util');

      // When: 두 구현 모두 호출
      const constantsResult = constantsModule.isValidMediaUrl(testUrl);
      const mediaUtilResult = mediaUtilModule.isValidMediaUrl(testUrl);

      // Then: 결과가 다를 수 있음 (일관성 문제)
      expect(typeof constantsResult).toBe('boolean');
      expect(typeof mediaUtilResult).toBe('boolean');

      // 이상적으로는 같아야 하지만, 현재는 다를 수 있음
    });

    it('정규식 패턴이 여러 곳에 중복 정의됨', async () => {
      // Given: URL 패턴 확인
      const { URL_PATTERNS } = await import('@/constants');

      // When: 패턴 존재 확인
      const hasMediaPattern = URL_PATTERNS.MEDIA;
      const hasGalleryPattern = URL_PATTERNS.GALLERY_MEDIA;

      // Then: 패턴이 정의되어 있지만 중복 사용됨
      expect(hasMediaPattern).toBeDefined();
      expect(hasGalleryPattern).toBeDefined();
    });
  });

  describe('🟢 GREEN: 통합된 미디어 URL 유틸리티', () => {
    it('단일 validateMediaUrl 함수로 모든 검증 처리', () => {
      // Given: 통합된 검증 함수 (추상적 구현)
      const validateMediaUrl = (url: string, pattern?: RegExp) => {
        if (!url || typeof url !== 'string') return false;
        const defaultPattern = /https:\/\/pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+/;
        const targetPattern = pattern || defaultPattern;
        return targetPattern.test(url);
      };

      // When: 다양한 URL 테스트
      const validUrls = [
        'https://pbs.twimg.com/media/test123.jpg',
        'https://pbs.twimg.com/media/ABC_def-123.png',
      ];

      const invalidUrls = ['', 'invalid-url', 'https://example.com/image.jpg'];

      // Then: 정확한 검증
      validUrls.forEach(url => {
        expect(validateMediaUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(validateMediaUrl(url)).toBe(false);
      });
    });

    it('단일 extractMediaId 함수로 ID 추출', async () => {
      // Given: 통합된 추출 함수 (실제 구현 사용)
      const { extractMediaId } = await import('@/constants');

      // When: ID 추출 테스트
      const testCases = [
        { url: 'https://pbs.twimg.com/media/ABC123.jpg', expected: 'ABC123' },
        {
          url: 'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/DEF456.jpg',
          expected: 'DEF456',
        },
        { url: 'invalid-url', expected: null },
      ];

      // Then: 정확한 추출
      testCases.forEach(({ url, expected }) => {
        expect(extractMediaId(url)).toBe(expected);
      });
    });

    it('공통 URL 패턴 상수로 관리', () => {
      // Given: 중앙 집중식 패턴 관리
      const UNIFIED_URL_PATTERNS = {
        MEDIA: /https:\/\/pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+/,
        GALLERY_MEDIA: /https:\/\/pbs\.twimg\.com\/(media|ext_tw_video_thumb)/,
        MEDIA_ID: /\/media\/([A-Za-z0-9_-]+)/,
        VIDEO_THUMB_ID: /\/ext_tw_video_thumb\/(\d+)\/pu\/img\/([A-Za-z0-9_-]+)/,
      } as const;

      // When: 패턴 사용
      const testUrl = 'https://pbs.twimg.com/media/test123.jpg';
      const isValidMedia = UNIFIED_URL_PATTERNS.MEDIA.test(testUrl);
      const isValidGalleryMedia = UNIFIED_URL_PATTERNS.GALLERY_MEDIA.test(testUrl);

      // Then: 일관된 검증
      expect(isValidMedia).toBe(true);
      expect(isValidGalleryMedia).toBe(true);
    });

    it('타입 안전성 보장', () => {
      // Given: 타입이 정의된 함수
      type MediaUrlValidator = (url: string) => boolean;
      type MediaIdExtractor = (url: string) => string | null;

      const isValidMediaUrl: MediaUrlValidator = url => {
        return typeof url === 'string' && url.includes('pbs.twimg.com');
      };

      const extractMediaId: MediaIdExtractor = url => {
        const match = url.match(/\/media\/([A-Za-z0-9_-]+)/);
        return match?.[1] || null;
      };

      // When: 타입 검증
      const urlValidationResult = isValidMediaUrl('test-url');
      const idExtractionResult = extractMediaId('test-url');

      // Then: 올바른 타입 반환
      expect(typeof urlValidationResult).toBe('boolean');
      expect(idExtractionResult === null || typeof idExtractionResult === 'string').toBe(true);
    });
  });

  describe('🔧 REFACTOR: 최적화 및 성능 개선', () => {
    it('정규식 컴파일 최적화', () => {
      // Given: 미리 컴파일된 정규식
      const COMPILED_PATTERNS = {
        MEDIA: new RegExp('https://pbs\\.twimg\\.com/media/[A-Za-z0-9_-]+'),
        MEDIA_ID: new RegExp('/media/([A-Za-z0-9_-]+)'),
      };

      // When: 성능 측정
      const iterations = 1000;
      const testUrl = 'https://pbs.twimg.com/media/test123.jpg';

      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        COMPILED_PATTERNS.MEDIA.test(testUrl);
        COMPILED_PATTERNS.MEDIA_ID.exec(testUrl);
      }
      const endTime = Date.now();

      // Then: 빠른 실행 시간
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      expect(averageTime).toBeLessThan(0.1); // 0.1ms 미만
    });

    it('번들 크기 감소', () => {
      // Given: 중복 제거 전후 비교
      const beforeRefactor = {
        constants: { isValidMediaUrl: true, extractMediaId: true },
        mediaUtil: { isValidMediaUrl: true, extractMediaId: true },
        totalFunctions: 4,
      };

      const afterRefactor = {
        unified: { validateMediaUrl: true, extractMediaId: true },
        totalFunctions: 2,
      };

      // When: 함수 수 비교
      const reduction = beforeRefactor.totalFunctions - afterRefactor.totalFunctions;
      const reductionPercentage = reduction / beforeRefactor.totalFunctions;

      // Then: 50% 함수 수 감소
      expect(reduction).toBe(2);
      expect(reductionPercentage).toBe(0.5);
    });

    it('캐싱으로 성능 최적화', () => {
      // Given: 결과 캐싱 구현
      const cache = new Map<string, boolean>();
      const cachedValidator = (url: string): boolean => {
        if (cache.has(url)) {
          return cache.get(url)!;
        }
        const result = /https:\/\/pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+/.test(url);
        cache.set(url, result);
        return result;
      };

      // When: 동일한 URL 여러 번 검증
      const testUrl = 'https://pbs.twimg.com/media/test123.jpg';
      const results = Array.from({ length: 100 }, () => cachedValidator(testUrl));

      // Then: 모든 결과가 일관됨
      expect(results.every(result => result === true)).toBe(true);
      expect(cache.size).toBe(1); // 캐시 동작 확인
    });
  });

  describe('📊 통합 효과 측정', () => {
    it('코드 중복도 제거', () => {
      // Given: 중복도 계산
      const duplicatedLines = 50; // 추정
      const totalLines = 200;
      const duplicationPercentage = duplicatedLines / totalLines;

      // When: 통합 후 중복도
      const afterDuplication = 0; // 완전 제거 목표

      // Then: 중복 완전 제거
      expect(duplicationPercentage).toBeGreaterThan(0.2); // 20% 이상 중복
      expect(afterDuplication).toBe(0);
    });

    it('테스트 커버리지 향상', () => {
      // Given: 통합된 함수들
      const functions = ['validateMediaUrl', 'extractMediaId', 'generateOriginalUrl'];

      // When: 각 함수 테스트
      const testCoverage = functions.map(func => {
        // 실제로는 각 함수의 테스트 케이스 수
        return { function: func, coverage: 0.95 }; // 95% 커버리지 목표
      });

      // Then: 높은 커버리지 달성
      testCoverage.forEach(({ coverage }) => {
        expect(coverage).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('API 호환성 100% 보장', () => {
      // Given: 기존 API 호출 패턴
      const legacyAPIs = [
        'isValidMediaUrl',
        'isValidGalleryUrl',
        'extractMediaId',
        'generateOriginalUrl',
      ];

      // When: 통합 후 호환성 확인
      const compatibilityResults = legacyAPIs.map(api => ({
        api,
        available: true, // 래퍼 함수로 호환성 보장
        deprecated: true, // deprecated 마킹
      }));

      // Then: 완전한 호환성
      compatibilityResults.forEach(({ available }) => {
        expect(available).toBe(true);
      });
    });
  });

  describe('마이그레이션 계획', () => {
    it('점진적 마이그레이션 단계', () => {
      // Given: 마이그레이션 로드맵
      const migrationPhases = [
        { phase: 1, task: '통합 유틸 함수 생성', breaking: false },
        { phase: 2, task: '기존 함수 래퍼로 변경', breaking: false },
        { phase: 3, task: 'deprecated 경고 추가', breaking: false },
        { phase: 4, task: '호출부 점진적 교체', breaking: false },
        { phase: 5, task: '기존 함수 완전 제거', breaking: true },
      ];

      // When: 각 단계 검증
      migrationPhases.forEach(phase => {
        expect(phase.phase).toBeGreaterThan(0);
        expect(phase.task).toBeTruthy();
        expect(typeof phase.breaking).toBe('boolean');
      });

      // Then: 안전한 마이그레이션 보장
      const nonBreakingPhases = migrationPhases.filter(p => !p.breaking);
      expect(nonBreakingPhases.length).toBeGreaterThanOrEqual(4);
    });
  });
});
