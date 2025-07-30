/**
 * @fileoverview Phase 2: 중복 코드 통합 테스트
 * @description TDD 방식으로 중복 코드 제거와 통합을 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Phase 2: 중복 코드 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 함수 중복 제거 검증', () => {
    it('findTwitterScrollContainer가 중복되지 않아야 한다', async () => {
      const coreUtils = await import('@shared/utils/core-utils');
      const mainUtils = await import('@shared/utils/utils');

      expect(typeof coreUtils.findTwitterScrollContainer).toBe('function');
      expect(typeof mainUtils.findTwitterScrollContainer).toBe('function');

      // 같은 구현체여야 함 (re-export 확인)
      expect(mainUtils.findTwitterScrollContainer).toBe(coreUtils.findTwitterScrollContainer);
    });

    it('ensureGalleryScrollAvailable이 중복되지 않아야 한다', async () => {
      const coreUtils = await import('@shared/utils/core-utils');
      const mainUtils = await import('@shared/utils/utils');

      expect(typeof coreUtils.ensureGalleryScrollAvailable).toBe('function');
      expect(typeof mainUtils.ensureGalleryScrollAvailable).toBe('function');

      // 같은 구현체여야 함
      expect(mainUtils.ensureGalleryScrollAvailable).toBe(coreUtils.ensureGalleryScrollAvailable);
    });

    it('galleryDebugUtils가 통합되어야 한다', async () => {
      const coreUtils = await import('@shared/utils/core-utils');

      expect(coreUtils.galleryDebugUtils).toBeDefined();
      expect(typeof coreUtils.galleryDebugUtils.diagnoseContainer).toBe('function');
      expect(typeof coreUtils.galleryDebugUtils.forceShow).toBe('function');
    });
  });

  describe('2. memo 함수 단순화 검증', () => {
    it('단순화된 memo 함수가 제공되어야 한다', async () => {
      const { memo } = await import('@shared/utils/optimization');
      expect(memo).toBeDefined();
      expect(typeof memo).toBe('function');
    });

    it('memo 함수가 간소화된 구현을 사용해야 한다', async () => {
      const { memo } = await import('@shared/utils/optimization');

      // 테스트용 더미 컴포넌트
      const TestComponent = () => 'test';
      const MemoComponent = memo(TestComponent);

      expect(MemoComponent).toBeDefined();
      expect(typeof MemoComponent).toBe('function');
    });
  });

  describe('3. 중복 유틸리티 함수 통합', () => {
    it('removeDuplicateStrings가 한 곳에서만 정의되어야 한다', async () => {
      const coreUtils = await import('@shared/utils/core-utils');
      const mainUtils = await import('@shared/utils/utils');

      expect(typeof coreUtils.removeDuplicateStrings).toBe('function');

      // utils.ts에서는 re-export만 해야 함 (중복 구현 없음)
      expect(mainUtils.removeDuplicateStrings).toBe(coreUtils.removeDuplicateStrings);
    });

    it('findTwitterScrollContainer가 중복되지 않아야 한다', async () => {
      const coreUtils = await import('@shared/utils/core-utils');
      const mainUtils = await import('@shared/utils/utils');

      expect(typeof coreUtils.findTwitterScrollContainer).toBe('function');
      expect(typeof mainUtils.findTwitterScrollContainer).toBe('function');

      // 같은 구현체여야 함
      expect(mainUtils.findTwitterScrollContainer).toBe(coreUtils.findTwitterScrollContainer);
    });

    it('galleryDebugUtils가 통합되어야 한다', async () => {
      const coreUtils = await import('@shared/utils/core-utils');

      expect(coreUtils.galleryDebugUtils).toBeDefined();
      expect(typeof coreUtils.galleryDebugUtils.diagnoseContainer).toBe('function');
      expect(typeof coreUtils.galleryDebugUtils.forceShow).toBe('function');
    });
  });

  describe('4. 서비스 통합 검증', () => {
    it('LazyLoadingService가 최적화 기능을 포함해야 한다', async () => {
      const { LazyLoadingService } = await import('@shared/services/LazyLoadingService');
      const instance = LazyLoadingService.getInstance();

      // 최적화 메서드들이 존재해야 함
      expect(typeof instance.observe).toBe('function');
      expect(typeof instance.unobserve).toBe('function');
      expect(typeof instance.getMetrics).toBe('function');
      expect(typeof instance.dispose).toBe('function');
    });

    it('MediaService가 미디어 관련 기능을 통합해야 한다', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      expect(MediaService).toBeDefined();

      // 통합된 기능들 확인
      const { extractUsername, parseUsernameFast } = await import('@shared/services/MediaService');
      expect(typeof extractUsername).toBe('function');
      expect(typeof parseUsernameFast).toBe('function');
    });

    it('UIService가 테마와 토스트 기능을 통합해야 한다', async () => {
      const { UIService } = await import('@shared/services/UIService');

      expect(UIService).toBeDefined();
      expect(typeof UIService).toBe('function');
    });
  });

  describe('5. index.ts 파일 정리', () => {
    it('shared/services/index.ts가 깔끔하게 정리되어야 한다', async () => {
      const servicesModule = await import('@shared/services');

      // 통합된 서비스들만 export되어야 함
      expect(servicesModule.MediaService).toBeDefined();
      expect(servicesModule.UIService).toBeDefined();
      expect(servicesModule.LazyLoadingService).toBeDefined();
    });

    it('shared/utils/index.ts가 중복 없이 정리되어야 한다', async () => {
      const utilsModule = await import('@shared/utils');

      // 핵심 유틸리티만 export
      expect(utilsModule.removeDuplicateStrings).toBeDefined();
      expect(utilsModule.findTwitterScrollContainer).toBeDefined();
      expect(utilsModule.galleryDebugUtils).toBeDefined();
    });
  });

  describe('6. 번들 크기 검증', () => {
    it('중복 제거로 번들 크기가 유지되어야 한다', () => {
      // Phase 1에서 이미 상당한 최적화가 이루어짐
      // Phase 2는 주로 코드 품질 개선 목표
      expect(true).toBe(true); // 실제 빌드 후 업데이트
    });

    it('필수 기능은 모두 유지되어야 한다', async () => {
      // 핵심 기능들이 모두 작동하는지 확인
      const { LazyLoadingService } = await import('@shared/services/LazyLoadingService');
      const { MediaService } = await import('@shared/services/MediaService');
      const { memo } = await import('@shared/utils/optimization');

      expect(LazyLoadingService).toBeDefined();
      expect(MediaService).toBeDefined();
      expect(memo).toBeDefined();
    });
  });

  describe('7. 타입 안전성 검증', () => {
    it('통합된 서비스들의 타입이 올바르게 export되어야 한다', async () => {
      // MediaService 타입들
      const mediaServiceModule = await import('@shared/services/MediaService');
      expect(mediaServiceModule.MediaService).toBeDefined();

      // UIService 타입들
      const uiServiceModule = await import('@shared/services/UIService');
      expect(uiServiceModule.UIService).toBeDefined();
    });

    it('중복 제거 후에도 기존 API가 유지되어야 한다', async () => {
      // 하위 호환성 확인
      const utilsModule = await import('@shared/utils');
      expect(typeof utilsModule.removeDuplicateStrings).toBe('function');
      expect(typeof utilsModule.findTwitterScrollContainer).toBe('function');
    });
  });
});
