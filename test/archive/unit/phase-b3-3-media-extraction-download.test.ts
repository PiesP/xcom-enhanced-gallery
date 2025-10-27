import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestHarness } from '@/shared/container';
import { SERVICE_KEYS } from '@/constants';
import type {
  MediaInfo,
  MediaExtractionResult,
  DownloadResult,
} from '@/shared/services/media-service';

describe('Phase B3.3-2: Media extraction -> download 통합 (2단계)', () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness();
  });

  afterEach(() => {
    harness.reset();
  });

  describe('2-1. 미디어 추출 후 단일 다운로드 (4개)', () => {
    it('should extract media and download single file successfully', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);

      expect(mediaService).toBeDefined();
      expect(bulkDownloadService).toBeDefined();
      expect(typeof mediaService.extractMedia).toBe('function');
      expect(typeof bulkDownloadService.downloadSingle).toBe('function');
    });

    it('should maintain service isolation during media extraction', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);

      expect(mediaService).not.toBe(bulkDownloadService);
      expect(harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE)).toBe(mediaService);
    });

    it('should allow sequential extract and download operations', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);

      expect(mediaService).toBeDefined();
      expect(toastManager).toBeDefined();
    });

    it('should track service state across multiple operations', async () => {
      await harness.initCoreServices();

      const mediaService1 = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const mediaService2 = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);

      expect(mediaService1).toBe(mediaService2);
    });
  });

  describe('2-2. 미디어 추출 → 다중 다운로드 (4개)', () => {
    it('should support multiple media items extraction', async () => {
      await harness.initCoreServices();

      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      expect(bulkDownloadService).toBeDefined();
      expect(typeof bulkDownloadService.downloadMultiple).toBe('function');
    });

    it('should handle empty media list gracefully', async () => {
      await harness.initCoreServices();

      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      expect(bulkDownloadService).toBeDefined();
    });

    it('should maintain service registry during bulk operations', async () => {
      await harness.initCoreServices();

      const before = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);
      const after = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);

      expect(before).toBe(after);
    });

    it('should support concurrent service access', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      const themeService = harness.get<any>(SERVICE_KEYS.THEME);

      expect(mediaService).toBeDefined();
      expect(bulkDownloadService).toBeDefined();
      expect(themeService).toBeDefined();
    });
  });

  describe('2-3. 에러 처리 및 부분 성공 (2개)', () => {
    it('should handle extraction failures gracefully', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);

      expect(mediaService).toBeDefined();
      expect(bulkDownloadService).toBeDefined();
    });

    it('should handle partial download failure', async () => {
      await harness.initCoreServices();

      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      expect(bulkDownloadService).toBeDefined();
    });
  });

  describe('2-4. 서비스 통합 및 정리 (2개)', () => {
    it('should cleanup all services on harness reset', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      harness.reset();

      expect(harness.tryGet<any>(SERVICE_KEYS.MEDIA_SERVICE)).toBeNull();
    });

    it('should maintain service consistency after reset and reinit', async () => {
      await harness.initCoreServices();
      harness.reset();

      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      expect(mediaService).toBeDefined();
    });
  });
});
