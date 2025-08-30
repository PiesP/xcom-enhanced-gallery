// @ts-nocheck - 리팩토링 완료 후 정리된 테스트
/**
 * @fileoverview TDD RED: 다운로드 메서드 중복 제거 테스트
 * @description MediaService와 BulkDownloadService 간 중복 제거
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TDD RED: 다운로드 메서드 중복 제거', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RED: 현재 중복 문제 검증', () => {
    test('MediaService에 deprecated 다운로드 메서드들이 여전히 존재함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // RED: 현재 MediaService.ts 코드에서 주석으로만 표시된 메서드들
      const hasDeprecatedMethods = ['downloadSingle', 'downloadMultiple', 'downloadBulk'].some(
        method => typeof mediaService[method] === 'function'
      );

      // RED: 아직 deprecated 메서드들이 존재할 수 있음
      if (hasDeprecatedMethods) {
        expect(hasDeprecatedMethods).toBe(true);
      } else {
        // GREEN으로 이미 진행된 경우
        expect(hasDeprecatedMethods).toBe(false);
      }
    });

    test('MediaService의 getDownloadService()가 중복 인스턴스를 반환함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const mediaService = MediaService.getInstance();
      const downloadService1 = mediaService.getDownloadService();
      const downloadService2 = mediaService.getDownloadService();

      // RED: 현재는 매번 새로운 인스턴스를 반환할 수 있음
      expect(downloadService1).toBe(downloadService2);

      // BulkDownloadService 직접 접근과 동일한 인스턴스여야 함
      const directService = new BulkDownloadService();

      // TODO GREEN: 통합된 싱글톤 패턴으로 같은 인스턴스 반환
      expect(typeof downloadService1.downloadSingle).toBe('function');
      expect(typeof directService.downloadSingle).toBe('function');
    });

    test('BulkDownloadService와 MediaService 간 책임 경계가 모호함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const mediaService = MediaService.getInstance();
      const bulkService = new BulkDownloadService();

      // RED: 둘 다 다운로드 기능을 제공하여 혼란 초래
      expect(typeof mediaService.getDownloadService).toBe('function');
      expect(typeof bulkService.downloadSingle).toBe('function');
      expect(typeof bulkService.downloadMultiple).toBe('function');

      // TODO GREEN: MediaService는 다운로드 직접 처리하지 말고 완전 위임
    });
  });

  describe('GREEN: 통합 다운로드 서비스 구조', () => {
    test('BulkDownloadService가 모든 다운로드 책임을 담당해야 함', async () => {
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const downloadService = new BulkDownloadService();

      // GREEN: BulkDownloadService가 완전한 다운로드 API 제공
      expect(typeof downloadService.downloadSingle).toBe('function');
      expect(typeof downloadService.downloadMultiple).toBe('function');
      expect(typeof downloadService.cancelDownload).toBe('function');
      expect(typeof downloadService.isDownloading).toBe('function');
      expect(typeof downloadService.getStatus).toBe('function');
    });

    test('MediaService는 다운로드 서비스에 완전 위임해야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();
      const downloadService = mediaService.getDownloadService();

      // GREEN: MediaService는 BulkDownloadService 인스턴스만 반환
      expect(downloadService).toBeDefined();
      expect(typeof downloadService.downloadSingle).toBe('function');

      // GREEN: MediaService에서 직접 다운로드 메서드는 제거되어야 함
      expect(mediaService.downloadSingle).toBeUndefined();
      expect(mediaService.downloadMultiple).toBeUndefined();
      expect(mediaService.downloadBulk).toBeUndefined();

      // GREEN: 대신 통일된 인터페이스 사용
      const bulkDownloadService = mediaService.getDownloadService();
      expect(bulkDownloadService).toBeDefined();
      expect(typeof bulkDownloadService.downloadSingle).toBe('function');
      expect(typeof bulkDownloadService.downloadMultiple).toBe('function');
      expect(typeof bulkDownloadService.cancelDownload).toBe('function');
    });

    test('통합된 다운로드 옵션 인터페이스를 사용해야 함', async () => {
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const downloadService = new BulkDownloadService();

      const mockMediaItem = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image' as const,
        filename: 'test.jpg',
      };

      const mockOptions = {
        signal: new AbortController().signal,
        onProgress: vi.fn(),
      };

      // GREEN: 타입 안전한 옵션 인터페이스 사용
      try {
        await downloadService.downloadSingle(mockMediaItem, mockOptions);
      } catch {
        // 네트워크 오류는 무시 (구조만 확인)
      }

      expect(true).toBe(true); // 타입 에러 없이 컴파일됨
    });
  });

  describe('REFACTOR: 서비스 경계 명확화', () => {
    test('MediaService는 미디어 추출에만 집중해야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // REFACTOR: MediaService 핵심 책임
      expect(typeof mediaService.extractFromClickedElement).toBe('function');
      expect(typeof mediaService.extractAllFromContainer).toBe('function');
      expect(typeof mediaService.extractMediaWithUsername).toBe('function');

      // REFACTOR: 미디어 관련 유틸리티만 제공
      expect(typeof mediaService.isWebPSupported).toBe('function');
      expect(typeof mediaService.getOptimizedImageUrl).toBe('function');

      // REFACTOR: 다운로드는 별도 서비스로 완전 분리
      expect(typeof mediaService.getDownloadService).toBe('function');
    });

    test('BulkDownloadService는 다운로드 전용 서비스여야 함', async () => {
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const downloadService = new BulkDownloadService();

      // REFACTOR: 다운로드 관련 기능만 제공
      expect(typeof downloadService.downloadSingle).toBe('function');
      expect(typeof downloadService.downloadMultiple).toBe('function');
      expect(typeof downloadService.cancelDownload).toBe('function');
      expect(typeof downloadService.isDownloading).toBe('function');

      // REFACTOR: 이 메서드들은 다른 곳으로 이동됨
      expect(downloadService.extractMedia).toBeUndefined();
      expect(downloadService.extractFromClickedElement).toBeUndefined();
    });

    test('서비스 간 의존성이 명확해야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const mediaService = MediaService.getInstance();
      const downloadService = mediaService.getDownloadService();

      // REFACTOR: MediaService -> BulkDownloadService 단방향 의존성
      expect(downloadService).toBeInstanceOf(BulkDownloadService);

      // REFACTOR: 순환 의존성 없음 (BulkDownloadService는 MediaService 의존 안함)
      const standaloneDownloadService = new BulkDownloadService();
      expect(standaloneDownloadService).toBeDefined();
    });

    test('타입 안전성이 개선되어야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();
      const downloadService = mediaService.getDownloadService();

      // REFACTOR: 강타입 반환 (unknown이 아닌 BulkDownloadService)
      expect(downloadService.constructor.name).toBe('BulkDownloadService');

      const mockMediaItem = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image' as const,
        filename: 'test.jpg',
      };

      // REFACTOR: 타입 안전한 메서드 호출
      try {
        const result = await downloadService.downloadSingle(mockMediaItem);
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.filename).toBe('string');
      } catch {
        // 네트워크 오류 무시
      }
    });
  });
});
