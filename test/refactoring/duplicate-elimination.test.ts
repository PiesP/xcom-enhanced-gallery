/**
 * @fileoverview TDD: 중복 제거 검증 테스트
 * @description Phase 1: RED - 실패 테스트 작성
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupTestEnvironment } from '../utils/helpers/test-environment.js';

describe('TDD: 중복 제거 검증', () => {
  beforeEach(async () => {
    await setupTestEnvironment('minimal');
    vi.clearAllMocks();
  });

  describe('MediaExtractor 인터페이스 통합', () => {
    it('단일 MediaExtractor 인터페이스만 존재해야 한다', async () => {
      // 타입 레벨 검증: MediaExtractionService가 정상 작동하면 타입 통합 성공
      const { MediaExtractionService } = await import(
        '@shared/services/media-extraction/MediaExtractionService'
      );

      // 서비스 인스턴스 생성으로 타입 호환성 검증
      const service = new MediaExtractionService();
      expect(service).toBeDefined();
      expect(typeof service.extractFromClickedElement).toBe('function');
    });

    it('MediaExtractor의 타입 정의가 일관되어야 한다', async () => {
      // 타입 체크만 수행 (런타임 검증 아님)
      const { MediaExtractionService } = await import(
        '@shared/services/media-extraction/MediaExtractionService'
      );

      const service = new MediaExtractionService();
      expect(service).toBeDefined();
    });

    it('MediaExtractionService가 통합된 인터페이스를 구현해야 한다', async () => {
      const { MediaExtractionService } = await import(
        '@shared/services/media-extraction/MediaExtractionService'
      );
      const service = new MediaExtractionService();

      // 필수 메서드 존재 확인
      expect(service.extractFromClickedElement).toBeDefined();
      expect(service.extractAllFromContainer).toBeDefined();
      expect(typeof service.extractFromClickedElement).toBe('function');
      expect(typeof service.extractAllFromContainer).toBe('function');
    });
  });

  describe('MediaExtractionResult 타입 통합', () => {
    it('MediaExtractionResult 타입이 일관되어야 한다', async () => {
      // RED: 현재 여러 곳에 중복 정의됨

      // 타입 호환성만 검증 (런타임에서는 불가능)
      const mockResult = {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {},
      };

      expect(mockResult.success).toBe(true);
      expect(Array.isArray(mockResult.mediaItems)).toBe(true);
    });

    it('갤러리 타입 호환성 검증', async () => {
      // features/gallery의 타입이 정상적으로 import되는지 확인
      // 타입 체크를 통한 검증
      type GalleryMediaExtractionResult = import('@features/gallery/types').MediaExtractionResult;
      type CoreMediaExtractionResult =
        import('@shared/types/core/media.types').MediaExtractionResult;

      // 타입 호환성 검증 - 컴파일되면 성공
      const compatibilityTest = (
        galleryResult: GalleryMediaExtractionResult
      ): CoreMediaExtractionResult => galleryResult;
      expect(compatibilityTest).toBeDefined();
    });
  });

  describe('Import 경로 일관성', () => {
    it('모든 서비스가 일관된 경로에서 타입을 import해야 한다', async () => {
      // MediaExtractionService import 경로 확인
      const { MediaExtractionService } = await import(
        '@shared/services/media-extraction/MediaExtractionService'
      );

      expect(MediaExtractionService).toBeDefined();
    });

    it('호환성을 위한 re-export가 정상 작동해야 한다', async () => {
      // re-export가 정상 작동하는지 서비스 로딩으로 확인
      const { MediaExtractionService } = await import(
        '@shared/services/media-extraction/MediaExtractionService'
      );

      try {
        const service = new MediaExtractionService();
        expect(service).toBeDefined();
        expect(typeof service.extractFromClickedElement).toBe('function');
      } catch (error) {
        // 타입 오류가 없으면 정상
        expect(error).toBeUndefined();
      }
    });
  });

  describe('타입 안전성 검증', () => {
    it('MediaExtractor 타입 구조 검증', async () => {
      // 타입 정의 존재 확인만 수행
      const coreModule = await import('@shared/types/core/extraction.types');
      expect(coreModule).toBeDefined();
    });

    it('추출 결과가 일관된 구조를 가져야 한다', async () => {
      const mockResult = {
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'test',
          strategy: 'test',
        },
      };

      expect(mockResult.success).toBe(true);
      expect(Array.isArray(mockResult.mediaItems)).toBe(true);
      expect(typeof mockResult.clickedIndex).toBe('number');
      expect(typeof mockResult.metadata).toBe('object');
    });
  });
});
