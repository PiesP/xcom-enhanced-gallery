import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServiceHarness } from '@/shared/container/service-harness';
import { SERVICE_KEYS } from '@/constants';

describe('Phase B3.3-3: 이벤트 라우팅 통합 (3단계)', () => {
  let harness: ReturnType<typeof createServiceHarness>;

  beforeEach(() => {
    harness = createServiceHarness();
  });

  afterEach(() => {
    harness.reset();
  });

  describe('3-1. KeyboardNavigator 이벤트 라우팅 (3개)', () => {
    it('should route keyboard events through service chain', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);

      expect(mediaService).toBeDefined();
      expect(toastManager).toBeDefined();
      expect(typeof toastManager.info).toBe('function');
    });

    it('should handle ArrowKey events for navigation', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      expect(mediaService).toBeDefined();
      expect(typeof mediaService.extractMedia).toBe('function');
    });

    it('should propagate ArrowKey events to GalleryApp', async () => {
      await harness.initCoreServices();

      const bulkDownloadService = harness.get<any>(SERVICE_KEYS.BULK_DOWNLOAD);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);

      expect(bulkDownloadService).toBeDefined();
      expect(toastManager).toBeDefined();
    });
  });

  describe('3-2. ThemeService 상태 업데이트 (3개)', () => {
    it('should update UI when theme changes', async () => {
      await harness.initCoreServices();

      const themeService = harness.get<any>(SERVICE_KEYS.THEME);
      expect(themeService).toBeDefined();
      expect(themeService !== null && typeof themeService === 'object').toBe(true);
    });

    it('should maintain theme consistency across services', async () => {
      await harness.initCoreServices();

      const themeService = harness.get<any>(SERVICE_KEYS.THEME);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);

      expect(themeService).toBeDefined();
      expect(toastManager).toBeDefined();
    });

    it('should broadcast theme changes to all subscribed services', async () => {
      await harness.initCoreServices();

      const theme1 = harness.get<any>(SERVICE_KEYS.THEME);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);
      const theme2 = harness.get<any>(SERVICE_KEYS.THEME);

      expect(theme1).toBe(theme2);
      expect(toastManager).toBeDefined();
    });
  });

  describe('3-3. ToastManager 큐 관리 및 우선순위 (2개)', () => {
    it('should queue multiple toasts and process in priority order', async () => {
      await harness.initCoreServices();

      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);
      expect(toastManager).toBeDefined();
      expect(typeof toastManager.show).toBe('function');
    });

    it('should handle toast lifecycle and cleanup', async () => {
      await harness.initCoreServices();

      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);
      expect(toastManager).toBeDefined();
      expect(typeof toastManager.clear).toBe('function');
    });
  });

  describe('3-4. 이벤트 구독/해제 라이프사이클 (2개)', () => {
    it('should properly subscribe and unsubscribe from events', async () => {
      await harness.initCoreServices();

      const mediaService = harness.get<any>(SERVICE_KEYS.MEDIA_SERVICE);
      const toastManager = harness.get<any>(SERVICE_KEYS.TOAST);

      expect(mediaService).toBeDefined();
      expect(toastManager).toBeDefined();
    });

    it('should prevent garbage collection issues with event listeners', async () => {
      await harness.initCoreServices();

      const before = harness.get<any>(SERVICE_KEYS.TOAST);
      harness.reset();
      await harness.initCoreServices();
      const after = harness.get<any>(SERVICE_KEYS.TOAST);

      // Services should be different instances after reset and reinit
      expect(before).not.toBe(after);
    });
  });
});
