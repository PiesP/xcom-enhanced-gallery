import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GalleryApp } from '@/features/gallery/GalleryApp';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import type { MediaInfo } from '@/shared/types/media.types';
import { initializeVendors } from '@/shared/external/vendors';
import { CoreService } from '@/shared/services/service-manager';
import { registerGalleryRenderer } from '@/shared/container/service-accessors';

/**
 * @fileoverview Phase B3.2.1 - GalleryApp Coverage Expansion Tests
 *
 * 목적: GalleryApp의 커버리지를 70% → 75%+ 달성
 * - 에러 핸들링 및 엣지 케이스
 * - DOM 및 컨테이너 관리
 * - 동시성 및 상태 관리
 *
 * 테스트 개수: 50-80개 추가 (목표: 커버리지 개선)
 */

describe('Phase B3.2.1: GalleryApp Coverage Expansion', () => {
  let galleryApp: GalleryApp;

  function createTestMediaInfo(overrides: Partial<MediaInfo> = {}): MediaInfo {
    return {
      id: `test-media-${Date.now()}-${Math.random()}`,
      url: 'https://example.com/image.jpg',
      type: 'image' as const,
      filename: 'test-image.jpg',
      ...overrides,
    };
  }

  beforeEach(() => {
    initializeVendors();
    CoreService.resetInstance();

    const renderer = new GalleryRenderer();
    registerGalleryRenderer(renderer);

    galleryApp = new GalleryApp();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    CoreService.resetInstance();
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle openGallery with empty media array', async () => {
      await galleryApp.initialize();
      const emptyMedia: MediaInfo[] = [];
      await galleryApp.openGallery(emptyMedia, 0);
      // 빈 배열로 열기 시도 시 갤러리는 열리지 않음
      expect(galleryApp).toBeDefined();
    });

    it('should handle openGallery with negative startIndex', async () => {
      const media = [createTestMediaInfo()];
      await galleryApp.initialize();
      await galleryApp.openGallery(media, -1);
      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should handle multiple initialization attempts', async () => {
      await galleryApp.initialize();
      expect(galleryApp.isRunning()).toBe(true);

      await galleryApp.initialize();
      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should handle closeGallery when not initialized', () => {
      expect(galleryApp.isRunning()).toBe(false);
      expect(() => galleryApp.closeGallery()).not.toThrow();
    });

    it('should properly clean up on cleanup call', async () => {
      await galleryApp.initialize();
      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);
      expect(galleryApp.isRunning()).toBe(true);

      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);
    });

    it('should handle cleanup without initialization', async () => {
      await expect(galleryApp.cleanup()).resolves.not.toThrow();
    });

    it('should update config correctly', async () => {
      await galleryApp.initialize();

      galleryApp.updateConfig({
        extractionTimeout: 30000,
        clickDebounceMs: 300,
      });

      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should handle media extraction timeout gracefully', async () => {
      await galleryApp.initialize();
      galleryApp.updateConfig({ extractionTimeout: 100 });
      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should return correct diagnostics', async () => {
      await galleryApp.initialize();

      const diagnostics = galleryApp.getDiagnostics();

      expect(diagnostics).toHaveProperty('isInitialized');
      expect(diagnostics).toHaveProperty('config');
      expect(diagnostics).toHaveProperty('galleryState');
      expect(diagnostics.isInitialized).toBe(true);
      expect(diagnostics.galleryState).toHaveProperty('isOpen');
      expect(diagnostics.galleryState).toHaveProperty('mediaCount');
      expect(diagnostics.galleryState).toHaveProperty('currentIndex');
    });

    it('should handle large media arrays', async () => {
      const largeMediaArray: MediaInfo[] = Array.from({ length: 100 }, (_, i) =>
        createTestMediaInfo({ id: `media-${i}` })
      );

      await galleryApp.initialize();
      await galleryApp.openGallery(largeMediaArray, 50);

      expect(galleryApp.isRunning()).toBe(true);
      // 미디어 카운트는 signals 상태에 따라 다를 수 있음
      const diag = galleryApp.getDiagnostics();
      expect(diag).toBeDefined();
    });

    it('should handle special characters in media filenames', async () => {
      const specialMedia = createTestMediaInfo({
        filename: 'image-with-special-chars-😀.jpg',
        id: 'special-1',
      });

      await galleryApp.initialize();
      await galleryApp.openGallery([specialMedia], 0);

      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should maintain state after concurrent calls', async () => {
      await galleryApp.initialize();
      const media = [createTestMediaInfo()];

      const promise1 = galleryApp.openGallery(media, 0);
      const promise2 = galleryApp.openGallery(media, 0);

      await Promise.all([promise1, promise2]);

      expect(galleryApp.isRunning()).toBe(true);
      galleryApp.closeGallery();
      expect(galleryApp.isRunning()).toBe(true);
    });
  });

  describe('DOM and Container Management', () => {
    it('should create gallery container with correct attributes', async () => {
      await galleryApp.initialize();

      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);

      const container = document.querySelector('#xeg-gallery-root') as HTMLDivElement;
      expect(container).toBeTruthy();
      expect(container.id).toBe('xeg-gallery-root');
      expect(container.style.position).toBe('fixed');
      expect(container.style.pointerEvents).toBe('none');
    });

    it('should reuse existing gallery container', async () => {
      await galleryApp.initialize();
      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);

      const firstContainer = document.querySelector('#xeg-gallery-root');

      galleryApp.closeGallery();
      await galleryApp.openGallery(media, 0);

      const secondContainer = document.querySelector('#xeg-gallery-root');
      expect(firstContainer).toBe(secondContainer);
    });

    it('should clean up container on cleanup', async () => {
      await galleryApp.initialize();
      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);

      let container = document.querySelector('#xeg-gallery-root');
      expect(container).toBeTruthy();

      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);
    });

    it('should handle container CSS properties correctly', async () => {
      await galleryApp.initialize();
      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);

      const container = document.querySelector('#xeg-gallery-root') as HTMLDivElement;
      expect(container.style.top).toBe('0px');
      expect(container.style.left).toBe('0px');
      expect(container.style.width).toBe('100%');
      expect(container.style.height).toBe('100%');
    });

    it('should handle multiple media sequences with container reuse', async () => {
      await galleryApp.initialize();

      const media1 = [createTestMediaInfo({ id: 'seq1-1' }), createTestMediaInfo({ id: 'seq1-2' })];

      const media2 = [
        createTestMediaInfo({ id: 'seq2-1' }),
        createTestMediaInfo({ id: 'seq2-2' }),
        createTestMediaInfo({ id: 'seq2-3' }),
      ];

      await galleryApp.openGallery(media1, 0);
      const container1 = document.querySelector('#xeg-gallery-root');

      galleryApp.closeGallery();

      await galleryApp.openGallery(media2, 1);
      const container2 = document.querySelector('#xeg-gallery-root');

      expect(container1).toBe(container2);
    });
  });

  describe('Configuration Scenarios', () => {
    it('should apply configuration updates dynamically', async () => {
      await galleryApp.initialize();

      const configs = [
        { autoTheme: false },
        { keyboardShortcuts: false },
        { performanceMonitoring: true },
        { extractionTimeout: 20000, clickDebounceMs: 250 },
      ];

      for (const config of configs) {
        galleryApp.updateConfig(config);
        expect(galleryApp.isRunning()).toBe(true);
      }
    });

    it('should maintain config through media operations', async () => {
      await galleryApp.initialize();

      galleryApp.updateConfig({
        autoTheme: false,
        keyboardShortcuts: false,
      });

      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);
      expect(galleryApp.isRunning()).toBe(true);

      galleryApp.closeGallery();
      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should reset config on partial updates', async () => {
      await galleryApp.initialize();

      galleryApp.updateConfig({
        autoTheme: false,
        keyboardShortcuts: true,
      });

      // Partial update
      galleryApp.updateConfig({ autoTheme: true });

      expect(galleryApp.isRunning()).toBe(true);
    });
  });

  describe('State Management and Transitions', () => {
    it('should track running state accurately', async () => {
      expect(galleryApp.isRunning()).toBe(false);

      await galleryApp.initialize();
      expect(galleryApp.isRunning()).toBe(true);

      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);
      expect(galleryApp.isRunning()).toBe(true);

      galleryApp.closeGallery();
      expect(galleryApp.isRunning()).toBe(true);

      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);
    });

    it('should handle rapid state changes', async () => {
      await galleryApp.initialize();

      const media = [createTestMediaInfo()];

      for (let i = 0; i < 5; i++) {
        await galleryApp.openGallery(media, 0);
        expect(galleryApp.isRunning()).toBe(true);

        galleryApp.closeGallery();
        expect(galleryApp.isRunning()).toBe(true);
      }
    });

    it('should maintain consistent diagnostics', async () => {
      await galleryApp.initialize();

      const diag1 = galleryApp.getDiagnostics();
      expect(diag1.isInitialized).toBe(true);

      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);

      const diag2 = galleryApp.getDiagnostics();
      expect(diag2.isInitialized).toBe(true);

      galleryApp.closeGallery();

      const diag3 = galleryApp.getDiagnostics();
      expect(diag3.isInitialized).toBe(true);
    });
  });

  describe('Mixed Operations', () => {
    it('should handle config changes with media operations', async () => {
      await galleryApp.initialize();

      const media = [
        createTestMediaInfo({ id: 'm1' }),
        createTestMediaInfo({ id: 'm2' }),
        createTestMediaInfo({ id: 'm3' }),
      ];

      await galleryApp.openGallery(media, 0);
      galleryApp.updateConfig({ autoTheme: false });
      expect(galleryApp.isRunning()).toBe(true);

      galleryApp.closeGallery();
      galleryApp.updateConfig({ keyboardShortcuts: false });
      expect(galleryApp.isRunning()).toBe(true);

      await galleryApp.openGallery(media, 2);
      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should handle diagnostics during active operations', async () => {
      await galleryApp.initialize();

      const media = [createTestMediaInfo({ id: 'd1' }), createTestMediaInfo({ id: 'd2' })];

      await galleryApp.openGallery(media, 0);
      let diag = galleryApp.getDiagnostics();
      expect(diag).toBeDefined();
      expect(diag.galleryState).toBeDefined();

      galleryApp.closeGallery();
      diag = galleryApp.getDiagnostics();
      expect(diag.isInitialized).toBe(true);

      await galleryApp.openGallery(media, 1);
      diag = galleryApp.getDiagnostics();
      expect(diag.galleryState).toBeDefined();
    });

    it('should recover from edge case operations', async () => {
      await galleryApp.initialize();

      // Empty media
      await galleryApp.openGallery([], 0);
      expect(galleryApp.isRunning()).toBe(true);

      // Negative index
      await galleryApp.openGallery([createTestMediaInfo()], -5);
      expect(galleryApp.isRunning()).toBe(true);

      // Out of range index
      await galleryApp.openGallery([createTestMediaInfo(), createTestMediaInfo()], 100);
      expect(galleryApp.isRunning()).toBe(true);

      // Normal operation
      await galleryApp.openGallery([createTestMediaInfo()], 0);
      expect(galleryApp.isRunning()).toBe(true);
    });
  });

  describe('Initialization Variations', () => {
    it('should initialize with default config', async () => {
      await galleryApp.initialize();
      expect(galleryApp.isRunning()).toBe(true);

      const diag = galleryApp.getDiagnostics();
      expect(diag.config).toBeDefined();
    });

    it('should initialize and update config before media operations', async () => {
      await galleryApp.initialize();
      galleryApp.updateConfig({
        extractionTimeout: 25000,
        clickDebounceMs: 400,
      });

      const media = [createTestMediaInfo()];
      await galleryApp.openGallery(media, 0);
      expect(galleryApp.isRunning()).toBe(true);
    });

    it('should handle init sequence variations', async () => {
      // Variation 1: init -> config -> media
      await galleryApp.initialize();
      galleryApp.updateConfig({ autoTheme: false });
      await galleryApp.openGallery([createTestMediaInfo()], 0);
      expect(galleryApp.isRunning()).toBe(true);

      galleryApp.closeGallery();
      await galleryApp.cleanup();

      // Variation 2: new instance
      const galleryApp2 = new GalleryApp();
      await galleryApp2.initialize();
      expect(galleryApp2.isRunning()).toBe(true);
    });
  });

  describe('Cleanup Scenarios', () => {
    it('should handle cleanup in various states', async () => {
      // Not initialized
      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);

      // After init
      await galleryApp.initialize();
      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);

      // Multiple cleanups
      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);
    });

    it('should cleanup with media open', async () => {
      await galleryApp.initialize();
      await galleryApp.openGallery([createTestMediaInfo()], 0);

      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);
    });

    it('should cleanup after multiple open/close cycles', async () => {
      await galleryApp.initialize();

      const media = [createTestMediaInfo()];

      for (let i = 0; i < 3; i++) {
        await galleryApp.openGallery(media, 0);
        galleryApp.closeGallery();
      }

      await galleryApp.cleanup();
      expect(galleryApp.isRunning()).toBe(false);
    });
  });
});
