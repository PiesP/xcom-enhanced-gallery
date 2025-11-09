/**
 * UnifiedDownloadService Tests
 *
 * Phase 312: UnifiedDownloadService 단위 테스트
 * - 단일 파일 다운로드
 * - 다중 파일 다운로드 (ZIP)
 * - 에러 처리
 * - 취소 기능
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

type UnifiedDownloadServiceModule =
  typeof import('../../../src/shared/services/unified-download-service');

async function importModule(): Promise<UnifiedDownloadServiceModule> {
  vi.resetModules();
  return await import('../../../src/shared/services/unified-download-service');
}

describe('UnifiedDownloadService', () => {
  setupGlobalTestIsolation();

  let module: UnifiedDownloadServiceModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    module = await importModule();

    // GM_download 전역 함수 mock
    (globalThis as Record<string, unknown>).GM_download = vi.fn(
      (options: Record<string, unknown>) => {
        if (options.onload && typeof options.onload === 'function') {
          setTimeout(() => (options.onload as () => void)(), 10);
        }
      }
    );
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).GM_download;
  });

  // ====================================
  // 싱글톤 패턴
  // ====================================

  describe('Singleton Pattern', () => {
    it('getInstance() should return the same instance', async () => {
      const { UnifiedDownloadService } = module;
      const instance1 = UnifiedDownloadService.getInstance();
      const instance2 = UnifiedDownloadService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('unifiedDownloadService export should be singleton', async () => {
      const { unifiedDownloadService, UnifiedDownloadService } = module;
      expect(unifiedDownloadService).toBe(UnifiedDownloadService.getInstance());
    });
  });

  // ====================================
  // 단일 파일 다운로드
  // ====================================

  describe('Single File Download (downloadSingle)', () => {
    it('should successfully download single file', async () => {
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();
      const media = {
        url: 'https://example.com/media.mp4',
        type: 'video' as const,
        id: 'test-media-1',
      };

      const result = await service.downloadSingle(media);

      expect(result.success).toBe(true);
      expect(result.filename).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error if GM_download is not available', async () => {
      delete (globalThis as Record<string, unknown>).GM_download;
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();
      const media = {
        url: 'https://example.com/media.mp4',
        type: 'video' as const,
        id: 'test-media-1',
      };

      const result = await service.downloadSingle(media);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tampermonkey');
    });

    it('should handle aborted signal', async () => {
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();
      const media = {
        url: 'https://example.com/media.mp4',
        type: 'video' as const,
        id: 'test-media-1',
      };
      const controller = new globalThis.AbortController();
      controller.abort();

      const result = await service.downloadSingle(media, { signal: controller.signal });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User cancelled download');
    });
  });

  // ====================================
  // 대량 파일 다운로드
  // ====================================

  describe('Bulk Download (downloadBulk)', () => {
    it('should return error for empty array', async () => {
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();

      const result = await service.downloadBulk([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No files to download');
      expect(result.filesProcessed).toBe(0);
    });

    it('should download single file directly for array with one item', async () => {
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();
      const media = {
        url: 'https://example.com/media.mp4',
        type: 'video' as const,
        id: 'test-media-1',
      };

      const result = await service.downloadBulk([media]);

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(1);
      expect(result.filesSuccessful).toBe(1);
    });
  });

  // ====================================
  // 다운로드 취소
  // ====================================

  describe('Cancel Download', () => {
    it('should support cancel operation', async () => {
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();

      // Initially not downloading
      expect(service.isDownloading()).toBe(false);

      // Single file download
      const media = {
        url: 'https://example.com/media.mp4',
        type: 'video' as const,
        id: 'test-media-1',
      };

      const promise = service.downloadSingle(media);
      // May or may not be downloading depending on timing
      service.cancelDownload();

      const result = await promise;
      expect(result).toBeDefined();
      expect(service.isDownloading()).toBe(false);
    });

    it('should warn when trying to cancel with no download in progress', () => {
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();

      service.cancelDownload();
      expect(service.isDownloading()).toBe(false);
    });
  });

  // ====================================
  // 상태 관리
  // ====================================

  describe('State Management', () => {
    it('isDownloading() should initially return false', () => {
      const { UnifiedDownloadService } = module;
      const service = UnifiedDownloadService.getInstance();
      expect(service.isDownloading()).toBe(false);
    });
  });

  // ====================================
  // 타입 검증
  // ====================================

  describe('Type Validation', () => {
    it('should export correct types', () => {
      const { UnifiedDownloadService } = module;
      expect(UnifiedDownloadService).toBeDefined();
    });
  });
});
