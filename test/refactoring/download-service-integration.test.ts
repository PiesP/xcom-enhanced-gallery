/**
 * @fileoverview 다운로드 서비스 통합 TDD 테스트
 * @version 1.0.0 - GREEN Phase
 */

import { describe, it, expect } from 'vitest';

describe('다운로드 서비스 통합', () => {
  describe('RED Phase: 현재 중복 구현 확인', () => {
    it('MediaService와 BulkDownloadService 둘 다 다운로드 기능 제공', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const mediaService = MediaService.getInstance();
      const downloadService = mediaService.getDownloadService();
      const bulkService = new BulkDownloadService();

      // RED: 둘 다 다운로드 기능을 제공하여 혼란 초래
      expect(typeof downloadService.downloadSingle).toBe('function');
      expect(typeof downloadService.downloadMultiple).toBe('function');
      expect(typeof bulkService.downloadSingle).toBe('function');
      expect(typeof bulkService.downloadMultiple).toBe('function');

      // 현재는 다른 인스턴스일 수 있음
      expect(downloadService).not.toBe(bulkService);
    });

    it('AbortController 사용 패턴이 일관되지 않음', async () => {
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const service = new BulkDownloadService();

      // RED: 현재 AbortController 관리가 서비스마다 다를 수 있음
      expect(service.isDownloading()).toBe(false);

      // Mock media 데이터
      const mockMedia = {
        id: 'test',
        type: 'image',
        url: 'https://example.com/test.jpg',
        originalUrl: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        width: 100,
        height: 100,
        metadata: {},
      };

      // AbortController 생성 및 즉시 중단 시뮬레이션
      const controller = new globalThis.AbortController();
      controller.abort();

      // RED: 중단된 신호로 다운로드 시도 시 일관된 처리가 안 될 수 있음
      const result = await service.downloadSingle(mockMedia, { signal: controller.signal });
      expect(result.success).toBe(false);
    });
  });

  describe('GREEN Phase: 통합 후 기대 결과', () => {
    it('MediaService는 BulkDownloadService를 위임해야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const mediaService = MediaService.getInstance();
      const downloadService = mediaService.getDownloadService();

      // GREEN: MediaService.getDownloadService()는 BulkDownloadService 인스턴스를 반환해야 함
      expect(downloadService).toBeInstanceOf(BulkDownloadService);
      expect(typeof downloadService.downloadSingle).toBe('function');
      expect(typeof downloadService.downloadMultiple).toBe('function');
    });

    it('일관된 AbortController 패턴이 적용되어야 함', async () => {
      const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');

      const service = new BulkDownloadService();

      // GREEN: AbortController가 일관되게 처리되어야 함
      expect(service.isDownloading()).toBe(false);

      // Mock media 데이터
      const mockMedia = {
        id: 'test',
        type: 'image',
        url: 'https://example.com/test.jpg',
        originalUrl: 'https://example.com/test.jpg',
        filename: 'test.jpg',
        width: 100,
        height: 100,
        metadata: {},
      };

      // AbortController 패턴 테스트
      const controller = new globalThis.AbortController();
      controller.abort();

      const result = await service.downloadSingle(mockMedia, { signal: controller.signal });
      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });

    it('중복된 다운로드 로직이 제거되어야 함', async () => {
      const { MediaService } = await import('@shared/services/MediaService');

      const mediaService = MediaService.getInstance();

      // GREEN: MediaService에서 직접 다운로드 메서드가 제거되어야 함
      expect(mediaService.downloadSingle).toBeUndefined();
      expect(mediaService.downloadMultiple).toBeUndefined();

      // 대신 getDownloadService()를 통해서만 접근 가능해야 함
      const downloadService = mediaService.getDownloadService();
      expect(typeof downloadService.downloadSingle).toBe('function');
      expect(typeof downloadService.downloadMultiple).toBe('function');
    });
  });
});
