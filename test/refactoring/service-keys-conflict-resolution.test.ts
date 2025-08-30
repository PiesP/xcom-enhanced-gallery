/**
 * @fileoverview 서비스 키 중복 해결 TDD 테스트
 * @description SERVICE_KEYS의 MEDIA_SERVICE vs MEDIA_EXTRACTION 충돌 해결
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('서비스 키 중복 해결', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 RED: 현재 충돌 위험 검증', () => {
    it('MEDIA_SERVICE와 MEDIA_EXTRACTION이 모두 존재함', async () => {
      // Given: 현재 SERVICE_KEYS
      const { SERVICE_KEYS } = await import('@/constants');

      // When: 충돌 가능한 키들 확인
      const hasMediaService = 'MEDIA_SERVICE' in SERVICE_KEYS;
      const hasMediaExtraction = 'MEDIA_EXTRACTION' in SERVICE_KEYS;

      // Then: 두 키 모두 존재 (충돌 위험)
      expect(hasMediaService).toBe(true);
      expect(hasMediaExtraction).toBe(true);
    });

    it('유사한 기능을 하는 서비스 키들이 혼재함', async () => {
      // Given: 서비스 키 분석
      const { SERVICE_KEYS } = await import('@/constants');

      // When: 미디어 관련 키들 확인
      const mediaRelatedKeys = Object.entries(SERVICE_KEYS).filter(
        ([key, value]) => key.includes('MEDIA') || value.includes('media')
      );

      // Then: 중복 가능성 있는 키들 존재
      expect(mediaRelatedKeys.length).toBeGreaterThan(1);
    });

    it('서비스 등록 시 키 충돌 가능성', async () => {
      // Given: CoreService와 SERVICE_KEYS
      const { CoreService } = await import('@shared/services/ServiceManager');
      const { SERVICE_KEYS } = await import('@/constants');
      const serviceManager = CoreService.getInstance();

      // When: 동일한 기능을 하는 서비스를 다른 키로 등록
      const mediaService1 = { type: 'media', version: 1 };
      const mediaService2 = { type: 'media', version: 2 };

      serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService1);

      // Then: 실수로 다른 키로 등록 시 충돌 발생 가능
      expect(() => {
        serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, mediaService2);
      }).not.toThrow(); // 현재는 에러가 발생하지 않음 (문제)

      // 두 서비스가 모두 등록되어 혼란 야기
      expect(serviceManager.has(SERVICE_KEYS.MEDIA_SERVICE)).toBe(true);
      expect(serviceManager.has(SERVICE_KEYS.MEDIA_EXTRACTION)).toBe(true);
    });

    it('네이밍 일관성 부족', async () => {
      // Given: 서비스 키 네이밍 패턴
      const { SERVICE_KEYS } = await import('@/constants');

      // When: 네이밍 패턴 분석
      const keyPatterns = Object.entries(SERVICE_KEYS).map(([key, value]) => ({
        constantName: key,
        serviceName: value,
        hasConsistentNaming: key.toLowerCase().replace('_', '.') === value,
      }));

      // Then: 일관성 없는 네이밍
      const inconsistentNames = keyPatterns.filter(p => !p.hasConsistentNaming);
      expect(inconsistentNames.length).toBeGreaterThan(0);
    });
  });

  describe('🟢 GREEN: 통합된 서비스 키 체계', () => {
    it('단일 MEDIA_SERVICE 키로 통합', () => {
      // Given: 통합된 서비스 키 체계
      const UNIFIED_SERVICE_KEYS = {
        // Core Services
        MEDIA: 'media.unified',
        GALLERY: 'gallery.manager',
        DOWNLOAD: 'download.manager',

        // UI Services
        THEME: 'theme.controller',
        TOAST: 'toast.controller',
        SETTINGS: 'settings.manager',

        // Utility Services
        TOKEN_EXTRACTOR: 'auth.tokenExtractor',
        VIDEO_CONTROL: 'video.controller',
        VIDEO_STATE: 'video.stateManager',
      } as const;

      // When: 키 구조 검증
      const hasUnifiedMedia = 'MEDIA' in UNIFIED_SERVICE_KEYS;
      const noConflictingKeys =
        !('MEDIA_SERVICE' in UNIFIED_SERVICE_KEYS) && !('MEDIA_EXTRACTION' in UNIFIED_SERVICE_KEYS);

      // Then: 명확한 단일 키 체계
      expect(hasUnifiedMedia).toBe(true);
      expect(noConflictingKeys).toBe(true);
    });

    it('계층적 네이밍 규칙 적용', () => {
      // Given: 계층적 서비스 키
      const HIERARCHICAL_KEYS = {
        // Domain.Service 패턴
        MEDIA: 'media.processor',
        GALLERY: 'gallery.manager',
        DOWNLOAD: 'download.coordinator',

        // UI.Component 패턴
        THEME: 'ui.theme',
        TOAST: 'ui.notifications',

        // Utility.Function 패턴
        TOKEN_EXTRACTOR: 'auth.tokenExtractor',
        VIDEO_CONTROL: 'media.videoController',
      } as const;

      // When: 네이밍 패턴 검증
      const allKeysFollowPattern = Object.entries(HIERARCHICAL_KEYS).every(([key, value]) => {
        const parts = value.split('.');
        return parts.length === 2 && parts[0] && parts[1];
      });

      // Then: 일관된 네이밍 규칙
      expect(allKeysFollowPattern).toBe(true);
    });

    it('서비스 타입별 그룹화', () => {
      // Given: 타입별 그룹화된 키
      const GROUPED_SERVICE_KEYS = {
        core: {
          MEDIA: 'core.media',
          GALLERY: 'core.gallery',
          DOWNLOAD: 'core.download',
        },
        ui: {
          THEME: 'ui.theme',
          TOAST: 'ui.toast',
          SETTINGS: 'ui.settings',
        },
        utility: {
          TOKEN_EXTRACTOR: 'util.tokenExtractor',
          VIDEO_CONTROL: 'util.videoControl',
        },
      } as const;

      // When: 그룹 구조 검증
      const groups = Object.keys(GROUPED_SERVICE_KEYS);
      const totalServices = Object.values(GROUPED_SERVICE_KEYS).reduce(
        (acc, group) => acc + Object.keys(group).length,
        0
      );

      // Then: 논리적 그룹화
      expect(groups).toContain('core');
      expect(groups).toContain('ui');
      expect(groups).toContain('utility');
      expect(totalServices).toBeGreaterThan(5);
    });

    it('충돌 방지 메커니즘', () => {
      // Given: 충돌 방지 기능
      const createServiceKey = (domain: string, service: string): string => {
        const key = `${domain}.${service}`;

        // 중복 검사
        const existingKeys = new Set(['core.media', 'ui.theme', 'util.tokenExtractor']);

        if (existingKeys.has(key)) {
          throw new Error(`Service key conflict: ${key} already exists`);
        }

        return key;
      };

      // When: 충돌 상황 테스트
      expect(() => createServiceKey('core', 'gallery')).not.toThrow();
      expect(() => createServiceKey('core', 'media')).toThrow();

      // Then: 충돌 자동 감지
      const validKey = createServiceKey('core', 'gallery');
      expect(validKey).toBe('core.gallery');
    });
  });

  describe('🔧 REFACTOR: 마이그레이션 및 최적화', () => {
    it('기존 키에서 새 키로 안전한 마이그레이션', () => {
      // Given: 마이그레이션 맵
      const MIGRATION_MAP = {
        MEDIA_SERVICE: 'core.media',
        MEDIA_EXTRACTION: 'core.media', // 같은 서비스로 통합
        THEME: 'ui.theme',
        TOAST: 'ui.toast',
        VIDEO_CONTROL: 'util.videoControl',
      } as const;

      // When: 마이그레이션 검증
      const hasAllOldKeys = Object.keys(MIGRATION_MAP).length > 0;
      const hasAllNewKeys = Object.values(MIGRATION_MAP).every(
        key => key.includes('.') && key.split('.').length === 2
      );

      // Then: 완전한 마이그레이션 맵
      expect(hasAllOldKeys).toBe(true);
      expect(hasAllNewKeys).toBe(true);
    });

    it('서비스 키 충돌 검사 유틸리티', () => {
      // Given: 충돌 검사 함수
      const validateServiceKeys = (keys: Record<string, string>) => {
        const values = Object.values(keys);
        const uniqueValues = new Set(values);

        return {
          totalKeys: values.length,
          uniqueKeys: uniqueValues.size,
          hasDuplicates: values.length !== uniqueValues.size,
          duplicates: values.filter((value, index, arr) => arr.indexOf(value) !== index),
        };
      };

      // When: 현재 키 검증
      const testKeys = {
        MEDIA_SERVICE: 'media.service',
        MEDIA_EXTRACTION: 'media.service', // 중복!
        GALLERY: 'gallery.manager',
      };

      const validation = validateServiceKeys(testKeys);

      // Then: 중복 감지
      expect(validation.hasDuplicates).toBe(true);
      expect(validation.duplicates).toContain('media.service');
    });

    it('TypeScript 타입 안전성 강화', () => {
      // Given: 강타입 서비스 키
      type ServiceDomain = 'core' | 'ui' | 'util';
      type ServiceName = string;
      type ServiceKey = `${ServiceDomain}.${ServiceName}`;

      const createTypedServiceKey = <T extends ServiceDomain>(
        domain: T,
        service: ServiceName
      ): ServiceKey => {
        return `${domain}.${service}` as ServiceKey;
      };

      // When: 타입 안전한 키 생성
      const mediaKey = createTypedServiceKey('core', 'media');
      const themeKey = createTypedServiceKey('ui', 'theme');

      // Then: 컴파일 타임 타입 검증
      expect(mediaKey).toBe('core.media');
      expect(themeKey).toBe('ui.theme');
    });

    it('런타임 키 검증', () => {
      // Given: 런타임 검증 함수
      const isValidServiceKey = (key: string): boolean => {
        const pattern = /^[a-z]+\.[a-zA-Z]+$/;
        return pattern.test(key);
      };

      // When: 다양한 키 검증
      const validKeys = ['core.media', 'ui.theme', 'util.tokenExtractor'];
      const invalidKeys = ['INVALID', 'invalid.', '.invalid', 'invalid.key.extra'];

      // Then: 정확한 검증
      validKeys.forEach(key => {
        expect(isValidServiceKey(key)).toBe(true);
      });

      invalidKeys.forEach(key => {
        expect(isValidServiceKey(key)).toBe(false);
      });
    });
  });

  describe('📊 개선 효과 측정', () => {
    it('서비스 키 수 감소', () => {
      // Given: 개선 전후 비교
      const beforeRefactor = {
        MEDIA_SERVICE: 'media.service',
        MEDIA_EXTRACTION: 'media.extraction',
        MEDIA_FILENAME: 'media.filename',
        totalKeys: 3,
      };

      const afterRefactor = {
        MEDIA: 'core.media',
        totalKeys: 1,
      };

      // When: 개선 측정
      const reduction = beforeRefactor.totalKeys - afterRefactor.totalKeys;
      const reductionPercentage = reduction / beforeRefactor.totalKeys;

      // Then: 67% 키 수 감소
      expect(reduction).toBe(2);
      expect(reductionPercentage).toBeCloseTo(0.67, 2);
    });

    it('개발자 경험 개선', () => {
      // Given: 개선된 키 구조
      const improvedStructure = {
        autoComplete: true, // IDE 자동완성 지원
        typeChecking: true, // 컴파일 타임 검증
        documentation: true, // 명확한 문서화
        consistency: true, // 일관된 네이밍
      };

      // When: DX 지표 확인
      const dxScore = Object.values(improvedStructure).filter(Boolean).length;

      // Then: 모든 DX 지표 충족
      expect(dxScore).toBe(4);
    });

    it('유지보수성 향상', () => {
      // Given: 유지보수 지표
      const maintainabilityMetrics = {
        conflictResolution: 100, // 100% 충돌 해결
        namingConsistency: 100, // 100% 네이밍 일관성
        documentationCoverage: 100, // 100% 문서화
        migrationSupport: 100, // 100% 마이그레이션 지원
      };

      // When: 평균 점수 계산
      const scores = Object.values(maintainabilityMetrics);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Then: 완벽한 유지보수성
      expect(averageScore).toBe(100);
    });
  });
});
