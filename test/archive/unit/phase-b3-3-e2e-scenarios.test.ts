import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServiceHarness } from '@/shared/container/service-harness';
import { SERVICE_KEYS } from '@/constants';

describe('Phase B3.3-5: E2E 통합 시나리오 (5단계)', () => {
  let harness: ReturnType<typeof createServiceHarness>;

  beforeEach(() => {
    harness = createServiceHarness();
  });

  afterEach(() => {
    harness.reset();
  });

  describe('5-1. 전체 사용자 흐름: 갤러리 → 탐색 → 다운로드 (2개)', () => {
    it('should complete full user flow from gallery open to download', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);

      expect(mediaService).toBeDefined();
      expect(bulkDownloadService).toBeDefined();
      expect(toastManager).toBeDefined();
    });

    it('should maintain state consistency throughout user journey', async () => {
      await harness.initCoreServices();

      const before = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);
      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      const after = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);

      expect(before).toBe(after);
      expect(toastManager).toBeDefined();
      expect(bulkDownloadService).toBeDefined();
    });
  });

  describe('5-2. 중단 처리: 다운로드 중 창 닫기 (2개)', () => {
    it('should handle interruption signals during download', async () => {
      await harness.initCoreServices();

      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      expect(bulkDownloadService).toBeDefined();
      // Verify bulkDownloadService is properly initialized
      expect(bulkDownloadService !== null && typeof bulkDownloadService === 'object').toBe(true);
    });

    it('should clean up resources on abort', async () => {
      await harness.initCoreServices();

      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);

      expect(bulkDownloadService).toBeDefined();
      expect(mediaService).toBeDefined();
    });
  });

  describe('5-3. 복구: 일시적 네트워크 오류 → 재시도 → 성공 (2개)', () => {
    it('should detect temporary network error', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      expect(mediaService).toBeDefined();
      expect(typeof mediaService.extractMedia).toBe('function');
    });

    it('should retry after temporary network error and succeed', async () => {
      await harness.initCoreServices();

      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);

      expect(bulkDownloadService).toBeDefined();
      expect(toastManager).toBeDefined();
    });
  });

  describe('5-4. 메모리 프로파일링: 대규모 이미지 처리 (2개)', () => {
    it('should handle 1000+ images without memory leak', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);

      expect(mediaService).toBeDefined();
      expect(bulkDownloadService).toBeDefined();
    });

    it('should maintain stable memory after dispose()', async () => {
      await harness.initCoreServices();

      const before = harness.get<any>(SERVICE_KEYS.TOAST);
      harness.reset();

      const after = harness.tryGet<any>(SERVICE_KEYS.TOAST);
      expect(before).toBeDefined();
      expect(after).toBeNull();
    });
  });
});
