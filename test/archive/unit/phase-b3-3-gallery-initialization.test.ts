import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestHarness } from '@/shared/container';
import { SERVICE_KEYS } from '@/constants';

describe('Phase B3.3-1: Gallery 초기화 흐름 통합 (1단계 - 기본)', () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness();
  });

  afterEach(() => {
    harness.reset();
  });

  describe('1-1. 핵심 서비스 초기화 (3개)', () => {
    it('should initialize MediaService, BulkDownloadService, and Toast', async () => {
      await harness.initCoreServices();

      expect(harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE)).toBeDefined();
      expect(harness.get<unknown>(SERVICE_KEYS.BULK_DOWNLOAD)).toBeDefined();
      expect(harness.get<unknown>(SERVICE_KEYS.TOAST)).toBeDefined();
    });

    it('should initialize ThemeService and other UI services', async () => {
      await harness.initCoreServices();

      expect(harness.get<unknown>(SERVICE_KEYS.THEME)).toBeDefined();
      expect(harness.get<unknown>(SERVICE_KEYS.TOAST)).toBeDefined();
    });

    it('should maintain singleton instances across multiple access', async () => {
      await harness.initCoreServices();

      const service1 = harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
      const service2 = harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);

      expect(service1).toBe(service2);
    });
  });

  describe('1-2. 에러 처리 및 복구 (3개)', () => {
    it('should handle reset and maintain service registry consistency', async () => {
      await harness.initCoreServices();

      // After reset, all services should be cleared
      harness.reset();
      const afterReset = harness.tryGet<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
      expect(afterReset).toBeNull();

      // After re-initialization, services should be available again
      await harness.initCoreServices();
      const reinitialized = harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
      expect(reinitialized).toBeDefined();
    });

    it('should return null for unregistered services after reset', async () => {
      await harness.initCoreServices();
      harness.reset();

      expect(harness.tryGet<unknown>(SERVICE_KEYS.MEDIA_SERVICE)).toBeNull();
    });

    it('should allow safe access to non-existent services without throwing', async () => {
      await harness.initCoreServices();

      expect(() => {
        harness.tryGet<unknown>('non.existent.key');
      }).not.toThrow();
    });
  });

  describe('1-3. 서비스 간 상태 동기화 (2개)', () => {
    it('should have all services available simultaneously after init', async () => {
      await harness.initCoreServices();

      const media = harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE);
      const toast = harness.get<unknown>(SERVICE_KEYS.TOAST);
      const theme = harness.get<unknown>(SERVICE_KEYS.THEME);

      expect(media).toBeDefined();
      expect(toast).toBeDefined();
      expect(theme).toBeDefined();
    });

    it('should maintain service registry state between accesses', async () => {
      await harness.initCoreServices();

      const before = harness.get<unknown>(SERVICE_KEYS.TOAST);
      const after = harness.get<unknown>(SERVICE_KEYS.TOAST);

      expect(before).toBe(after);
    });
  });

  describe('1-4. 메모리 관리 (2개)', () => {
    it('should clean up services on reset', async () => {
      await harness.initCoreServices();
      expect(harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE)).toBeDefined();

      harness.reset();
      expect(harness.tryGet<unknown>(SERVICE_KEYS.MEDIA_SERVICE)).toBeNull();
    });

    it('should allow clean reinitialize after reset', async () => {
      await harness.initCoreServices();
      harness.reset();

      // Should not throw during reinitialization
      await harness.initCoreServices();

      expect(harness.get<unknown>(SERVICE_KEYS.MEDIA_SERVICE)).toBeDefined();
    });
  });
});
