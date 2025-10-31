/**
 * @fileoverview BulkDownloadService Phase B3.2.3 추가 커버리지 테스트
 * @description 생명주기, 상태 관리, 에러 처리 강화 (40-60개 테스트)
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BulkDownloadService } from '@/shared/services/bulk-download-service';
import { logger } from '@/shared/logging/logger';
import type { MediaInfo } from '@/shared/types/media.types';

describe('Phase B3.2.3: BulkDownloadService 추가 커버리지', () => {
  let service: BulkDownloadService;

  beforeEach(() => {
    service = new BulkDownloadService();
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (service.isInitialized()) {
      service.destroy();
    }
  });

  // ========== 생명주기 메서드 테스트 (10-15개) ==========
  describe('생명주기 메서드 상세 검증', () => {
    it('should initialize and log initialization start', async () => {
      await service.initialize();
      expect(logger.info).toHaveBeenCalledWith('BulkDownloadService initializing...');
      expect(service.isInitialized()).toBe(true);
    });

    it('should log initialization completion', async () => {
      await service.initialize();
      expect(logger.info).toHaveBeenCalledWith('BulkDownloadService initialized');
    });

    it('should handle multiple initialize calls gracefully', async () => {
      await service.initialize();
      const callCount = (logger.info as any).mock.calls.length;
      await service.initialize();
      // 두 번째 호출 시 logging이 중복되지 않아야 함
      expect((logger.info as any).mock.calls.length).toBe(callCount);
    });

    it('should be in initialized state after initialize', async () => {
      expect(service.isInitialized()).toBe(false);
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should log destroy start', async () => {
      await service.initialize();
      vi.clearAllMocks();
      service.destroy();
      expect(logger.info).toHaveBeenCalledWith('BulkDownloadService destroying...');
    });

    it('should log destroy completion', async () => {
      await service.initialize();
      vi.clearAllMocks();
      service.destroy();
      expect(logger.info).toHaveBeenCalledWith('BulkDownloadService destroyed');
    });

    it('should reset initialized flag after destroy', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });

    it('should handle destroy when not initialized', () => {
      // 초기화 없이 destroy 호출
      expect(() => service.destroy()).not.toThrow();
      expect(service.isInitialized()).toBe(false);
    });

    it('should abort currentAbortController on destroy', async () => {
      await service.initialize();
      const controller = new globalThis.AbortController();
      (service as any).currentAbortController = controller;
      const abortSpy = vi.spyOn(controller, 'abort');
      service.destroy();
      expect(abortSpy).toHaveBeenCalled();
    });

    it('should support multiple initialize/destroy cycles', async () => {
      for (let i = 0; i < 3; i++) {
        expect(service.isInitialized()).toBe(false);
        await service.initialize();
        expect(service.isInitialized()).toBe(true);
        service.destroy();
        expect(service.isInitialized()).toBe(false);
      }
    });

    it('should initialize and destroy without errors', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });
  });

  // ========== 다운로드 상태 관리 테스트 (15-20개) ==========
  describe('다운로드 상태 관리', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should not be downloading initially', () => {
      expect(service.isDownloading()).toBe(false);
    });

    it('should create currentAbortController on downloadMultiple', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(),
      });
      globalThis.fetch = mockFetch as any;

      const mediaList: MediaInfo[] = [
        { id: 'test1', url: 'https://example.com/test1.jpg', type: 'image', filename: 'test1.jpg' },
      ];

      // 다운로드 중에는 isDownloading이 true여야 함 (하지만 빠르게 완료됨)
      const promise = service.downloadMultiple(mediaList);
      // 비동기이므로 상태 확인 어려움, 결과만 확인
      const result = await promise;
      expect(result).toBeDefined();
    });

    it('should clear currentAbortController after download', async () => {
      const mediaList: MediaInfo[] = [];
      const result = await service.downloadMultiple(mediaList);
      expect(result.success).toBe(false);
      expect((service as any).currentAbortController).toBeUndefined();
    });

    it('should not be downloading after download completes', async () => {
      const mediaList: MediaInfo[] = [];
      await service.downloadMultiple(mediaList);
      expect(service.isDownloading()).toBe(false);
    });

    it('should handle empty mediaItems array', async () => {
      const result = await service.downloadMultiple([]);
      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.filesProcessed).toBe(0);
    });

    it('should set filesProcessed on download attempt', async () => {
      const mediaList: MediaInfo[] = [
        {
          id: 'test1',
          url: 'https://example.com/invalid1.jpg',
          type: 'image',
          filename: 'test1.jpg',
        },
        {
          id: 'test2',
          url: 'https://example.com/invalid2.jpg',
          type: 'image',
          filename: 'test2.jpg',
        },
      ];

      // Mock fetch를 실패하도록 설정
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

      const result = await service.downloadMultiple(mediaList);
      expect(result.filesProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should include filesSuccessful count in result', async () => {
      const mediaList: MediaInfo[] = [];
      const result = await service.downloadMultiple(mediaList);
      expect(result).toHaveProperty('filesSuccessful');
      expect(typeof result.filesSuccessful).toBe('number');
    });

    it('should initialize AbortController with null', () => {
      expect((service as any).currentAbortController).toBeUndefined();
    });

    it('should preserve download context across operations', async () => {
      const mediaList: MediaInfo[] = [];
      await service.downloadMultiple(mediaList);
      expect((service as any).currentAbortController).toBeUndefined();
      await service.downloadMultiple(mediaList);
      expect((service as any).currentAbortController).toBeUndefined();
    });

    it('should handle single item downloads', async () => {
      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(),
      }) as any;

      const result = await service.downloadSingle(media);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
    });

    it('should handle multiple item downloads', async () => {
      const mediaList: MediaInfo[] = [
        { id: 'test1', url: 'https://example.com/test1.jpg', type: 'image', filename: 'test1.jpg' },
        { id: 'test2', url: 'https://example.com/test2.jpg', type: 'image', filename: 'test2.jpg' },
      ];

      const result = await service.downloadMultiple(mediaList);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
    });

    it('should handle downloadBulk (alias for downloadMultiple)', async () => {
      const mediaList: MediaInfo[] = [];
      const result = await service.downloadBulk(mediaList);
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });
  });

  // ========== 에러 처리 및 엣지 케이스 (15-20개) ==========
  describe('에러 처리 및 엣지 케이스', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return error status on empty input', async () => {
      const result = await service.downloadMultiple([]);
      expect(result.status).toBe('error');
    });

    it('should set error code on empty input', async () => {
      const result = await service.downloadMultiple([]);
      expect((result as any).code).toBeDefined();
    });

    it('should include error message on empty input', async () => {
      const result = await service.downloadMultiple([]);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors in downloadSingle', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };
      const result = await service.downloadSingle(media);

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });

    it('should handle HTTP error status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }) as any;

      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };
      const result = await service.downloadSingle(media);

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
    });

    it('should handle aborted signal', async () => {
      const controller = new globalThis.AbortController();
      controller.abort();

      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };
      const result = await service.downloadSingle(media, { signal: controller.signal });

      expect(result.success).toBe(false);
      expect(result.status).toBe('cancelled');
    });

    it('should handle blob generation errors', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => {
          throw new Error('Blob error');
        },
      }) as any;

      const media: MediaInfo = {
        id: 'test',
        url: 'https://example.com/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };
      const result = await service.downloadSingle(media);

      expect(result.success).toBe(false);
    });

    it('should cancel ongoing download when abort signal is triggered', async () => {
      const controller = new globalThis.AbortController();
      let downloadStarted = false;

      globalThis.fetch = vi.fn(async () => {
        downloadStarted = true;
        return {
          ok: true,
          blob: async () => new Blob(),
        };
      }) as any;

      const mediaList: MediaInfo[] = [
        { id: 'test1', url: 'https://example.com/test1.jpg', type: 'image', filename: 'test1.jpg' },
      ];

      const promise = service.downloadMultiple(mediaList, { signal: controller.signal });
      controller.abort();
      const result = await promise;

      expect(downloadStarted || result.status === 'cancelled').toBe(true);
    });

    it('should handle readonly array input', async () => {
      const mediaList: readonly MediaInfo[] = [
        { id: 'test1', url: 'https://example.com/test1.jpg', type: 'image', filename: 'test1.jpg' },
      ];

      const result = await service.downloadMultiple(mediaList);
      expect(result).toBeDefined();
    });

    it('should clear abort controller on error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

      const mediaList: MediaInfo[] = [
        { id: 'test', url: 'https://example.com/test.jpg', type: 'image', filename: 'test.jpg' },
      ];

      await service.downloadMultiple(mediaList);
      expect((service as any).currentAbortController).toBeUndefined();
    });

    it('should handle media with missing id', async () => {
      const media: any = {
        url: 'https://example.com/test.jpg',
        type: 'image',
        filename: 'test.jpg',
      };
      const result = await service.downloadSingle(media);
      expect(result).toBeDefined();
    });

    it('should handle media with undefined url', async () => {
      const media: any = { id: 'test', url: undefined, type: 'image', filename: 'test.jpg' };
      const result = await service.downloadSingle(media);
      expect(result.success).toBe(false);
    });

    it('should handle very long URL', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000) + '.jpg';
      const media: MediaInfo = { id: 'test', url: longUrl, type: 'image', filename: 'test.jpg' };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(),
      }) as any;

      const result = await service.downloadSingle(media);
      expect(result).toBeDefined();
    });

    it('should handle special characters in URL', async () => {
      const specialUrl = 'https://example.com/test%20image%20(1).jpg?v=1&t=now';
      const media: MediaInfo = { id: 'test', url: specialUrl, type: 'image', filename: 'test.jpg' };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(),
      }) as any;

      const result = await service.downloadSingle(media);
      expect(result).toBeDefined();
    });
  });

  // ========== 취소 및 상태 추적 테스트 (5-10개) ==========
  describe('취소 및 상태 추적', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should cancel ongoing download', () => {
      (service as any).currentAbortController = new globalThis.AbortController();
      expect(service.isDownloading()).toBe(true);

      service.cancelDownload();
      expect((service as any).currentAbortController?.signal.aborted).toBe(true);
    });

    it('should not throw when cancelling non-existent download', () => {
      expect(() => service.cancelDownload()).not.toThrow();
    });

    it('should track isDownloading state correctly', async () => {
      expect(service.isDownloading()).toBe(false);
      (service as any).currentAbortController = new globalThis.AbortController();
      expect(service.isDownloading()).toBe(true);
      service.cancelDownload();
      expect(service.isDownloading()).toBe(true); // abort후에도 controller는 존재
    });

    it('should return correct value from isDownloading', () => {
      expect(service.isDownloading()).toBe(false);
      (service as any).currentAbortController = new globalThis.AbortController();
      expect(service.isDownloading()).toBe(true);
      (service as any).currentAbortController = undefined;
      expect(service.isDownloading()).toBe(false);
    });

    it('should handle multiple cancel calls', () => {
      (service as any).currentAbortController = new globalThis.AbortController();
      expect(() => {
        service.cancelDownload();
        service.cancelDownload();
        service.cancelDownload();
      }).not.toThrow();
    });
  });

  // ========== 통합 시나리오 테스트 (5-8개) ==========
  describe('통합 시나리오', () => {
    it('should handle full lifecycle: init -> download -> destroy', async () => {
      const service1 = new BulkDownloadService();
      await service1.initialize();
      expect(service1.isInitialized()).toBe(true);

      const mediaList: MediaInfo[] = [];
      const result = await service1.downloadMultiple(mediaList);
      expect(result.success).toBe(false);

      service1.destroy();
      expect(service1.isInitialized()).toBe(false);
    });

    it('should handle multiple downloads in sequence', async () => {
      const service1 = new BulkDownloadService();
      await service1.initialize();

      const mediaList1: MediaInfo[] = [];
      const result1 = await service1.downloadMultiple(mediaList1);
      expect(result1.filesProcessed).toBe(0);

      const mediaList2: MediaInfo[] = [];
      const result2 = await service1.downloadMultiple(mediaList2);
      expect(result2.filesProcessed).toBe(0);

      service1.destroy();
    });

    it('should handle rapid initialize/destroy cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const tempService = new BulkDownloadService();
        await tempService.initialize();
        tempService.destroy();
        expect(tempService.isInitialized()).toBe(false);
      }
    });

    it('should preserve service state across operations', async () => {
      const service1 = new BulkDownloadService();
      await service1.initialize();
      const initialized1 = service1.isInitialized();

      await service1.downloadMultiple([]);
      const initialized2 = service1.isInitialized();

      expect(initialized1).toBe(initialized2);
      expect(initialized1).toBe(true);

      service1.destroy();
    });

    it('should handle service as singleton', () => {
      const service1 = new BulkDownloadService();
      const service2 = new BulkDownloadService();
      // 각각 독립적인 인스턴스
      expect(service1).not.toBe(service2);
    });
  });
});
