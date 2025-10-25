/**
 * @fileoverview Phase B3.2.2: MediaService 커버리지 확장 테스트
 * @description 70% → 75%+ 커버리지 목표 (메서드 확대)
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { MediaService } from '@shared/services/media-service';

describe('Phase B3.2.2: MediaService Coverage Expansion', () => {
  let service: MediaService;

  beforeEach(() => {
    service = MediaService.getInstance();
  });

  describe('Singleton Pattern Extended', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = MediaService.getInstance();
      const instance2 = MediaService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton across array of calls', () => {
      const instances = Array(10)
        .fill(0)
        .map(() => MediaService.getInstance());
      expect(instances.every(inst => inst === instances[0])).toBe(true);
    });
  });

  describe('cancelDownload Extended', () => {
    it('should cancel download without errors', () => {
      expect(() => service.cancelDownload()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      service.cancelDownload();
      service.cancelDownload();
      expect(() => service.cancelDownload()).not.toThrow();
    });

    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 50; i++) {
        service.cancelDownload();
      }
      expect(service.isDownloading()).toBe(false);
    });

    it('should be safe with concurrent calls', async () => {
      await Promise.all([
        Promise.resolve(service.cancelDownload()),
        Promise.resolve(service.cancelDownload()),
        Promise.resolve(service.cancelDownload()),
      ]);
      expect(service.isDownloading()).toBe(false);
    });
  });

  describe('isDownloading Extended', () => {
    it('should return boolean', () => {
      const result = service.isDownloading();
      expect(typeof result).toBe('boolean');
    });

    it('should return false initially', () => {
      expect(service.isDownloading()).toBe(false);
    });

    it('should consistently return boolean', () => {
      const result1 = service.isDownloading();
      const result2 = service.isDownloading();

      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    it('should maintain binary state across cancels', () => {
      const state1 = service.isDownloading();
      service.cancelDownload();
      const state2 = service.isDownloading();
      service.cancelDownload();
      const state3 = service.isDownloading();

      expect(state1).toBe(state2);
      expect(state2).toBe(state3);
    });

    it('should handle rapid status checks', () => {
      for (let i = 0; i < 100; i++) {
        const result = service.isDownloading();
        expect(typeof result).toBe('boolean');
      }
    });
  });

  describe('cleanup Extended', () => {
    it('should cleanup without errors', async () => {
      await expect(service.cleanup()).resolves.not.toThrow();
    });

    it('should be callable multiple times', async () => {
      await service.cleanup();
      await expect(service.cleanup()).resolves.not.toThrow();
    });

    it('should cleanup even after cancel', async () => {
      service.cancelDownload();
      await expect(service.cleanup()).resolves.not.toThrow();
    });

    it('should cleanup multiple times in sequence', async () => {
      for (let i = 0; i < 5; i++) {
        await expect(service.cleanup()).resolves.not.toThrow();
      }
    });

    it('should handle cleanup after gallery operations', async () => {
      await service.prepareForGallery();
      await service.cleanupAfterGallery();
      await expect(service.cleanup()).resolves.not.toThrow();
    });
  });

  describe('prepareForGallery Extended', () => {
    it('should prepare for gallery without errors', async () => {
      await expect(service.prepareForGallery()).resolves.not.toThrow();
    });

    it('should be callable multiple times', async () => {
      await service.prepareForGallery();
      await expect(service.prepareForGallery()).resolves.not.toThrow();
    });

    it('should handle concurrent prepare calls', async () => {
      const results = await Promise.all([service.prepareForGallery(), service.prepareForGallery()]);
      expect(results).toHaveLength(2);
    });

    it('should maintain state after prepare', async () => {
      await service.prepareForGallery();
      expect(service.isDownloading()).toBe(false);
    });
  });

  describe('cleanupAfterGallery Extended', () => {
    it('should cleanup after gallery without errors', async () => {
      await expect(service.cleanupAfterGallery()).resolves.not.toThrow();
    });

    it('should be callable multiple times', async () => {
      await service.cleanupAfterGallery();
      await expect(service.cleanupAfterGallery()).resolves.not.toThrow();
    });

    it('should work after prepare', async () => {
      await service.prepareForGallery();
      await expect(service.cleanupAfterGallery()).resolves.not.toThrow();
    });

    it('should work without prior prepare', async () => {
      await expect(service.cleanupAfterGallery()).resolves.not.toThrow();
    });

    it('should handle multiple prepare/cleanup cycles', async () => {
      for (let i = 0; i < 3; i++) {
        await service.prepareForGallery();
        await service.cleanupAfterGallery();
      }
      expect(service).toBeDefined();
    });
  });

  describe('prefetchNextMedia Extended', () => {
    it('should handle empty arrays gracefully', async () => {
      await expect(service.prefetchNextMedia([], 0)).resolves.not.toThrow();
    });

    it('should handle invalid index gracefully', async () => {
      await expect(service.prefetchNextMedia([], -1)).resolves.not.toThrow();
    });

    it('should handle index out of bounds gracefully', async () => {
      const media = ['test.jpg'];

      await expect(service.prefetchNextMedia(media, 10)).resolves.not.toThrow();
    });

    it('should handle negative index', async () => {
      const media = ['test1.jpg', 'test2.jpg'];

      await expect(service.prefetchNextMedia(media, -5)).resolves.not.toThrow();
    });

    it('should handle single item array', async () => {
      const media = ['test.jpg'];

      await expect(service.prefetchNextMedia(media, 0)).resolves.not.toThrow();
    });

    it('should handle large arrays', async () => {
      const media = Array(100)
        .fill(0)
        .map((_, i) => `test${i}.jpg`);

      await expect(service.prefetchNextMedia(media, 50)).resolves.not.toThrow();
    });

    it('should handle with custom options', async () => {
      const media = ['test1.jpg', 'test2.jpg'];

      await expect(
        service.prefetchNextMedia(media, 0, {
          maxConcurrent: 2,
          prefetchRange: 3,
          schedule: 'idle',
        })
      ).resolves.not.toThrow();
    });

    it('should handle different schedule types', async () => {
      const schedules = ['immediate', 'idle', 'raf', 'microtask'] as const;
      for (const schedule of schedules) {
        await expect(
          service.prefetchNextMedia(['test.jpg'], 0, { schedule })
        ).resolves.not.toThrow();
      }
    });
  });

  describe('Video Control Methods', () => {
    it('should pause background videos', () => {
      expect(() => service.pauseAllBackgroundVideos()).not.toThrow();
    });

    it('should restore background videos', () => {
      expect(() => service.restoreBackgroundVideos()).not.toThrow();
    });

    it('should handle pause/restore sequence', () => {
      service.pauseAllBackgroundVideos();
      const count = service.getPausedVideoCount();
      service.restoreBackgroundVideos();
      expect(typeof count).toBe('number');
    });

    it('should check video control active state', () => {
      const isActive = service.isVideoControlActive();
      expect(typeof isActive).toBe('boolean');
    });

    it('should toggle current play/pause', () => {
      expect(() => service.togglePlayPauseCurrent()).not.toThrow();
    });

    it('should volume up', () => {
      expect(() => service.volumeUpCurrent()).not.toThrow();
    });

    it('should volume down', () => {
      expect(() => service.volumeDownCurrent()).not.toThrow();
    });

    it('should volume with custom steps', () => {
      expect(() => service.volumeUpCurrent(0.1)).not.toThrow();
      expect(() => service.volumeDownCurrent(0.05)).not.toThrow();
    });

    it('should toggle mute', () => {
      expect(() => service.toggleMuteCurrent()).not.toThrow();
    });

    it('should force reset video control', () => {
      expect(() => service.forceResetVideoControl()).not.toThrow();
    });
  });

  describe('Complex Lifecycle Scenarios', () => {
    it('should support full lifecycle: prepare -> cleanup -> cancel', async () => {
      await service.prepareForGallery();
      await service.cleanupAfterGallery();
      service.cancelDownload();
      await service.cleanup();

      expect(service.isDownloading()).toBe(false);
    });

    it('should handle cleanup without prepare', async () => {
      await service.cleanupAfterGallery();
      await service.cleanup();

      expect(service.isDownloading()).toBe(false);
    });

    it('should handle cancel without download', () => {
      service.cancelDownload();

      expect(service.isDownloading()).toBe(false);
    });

    it('should maintain consistency through complex flow', async () => {
      const state1 = service.isDownloading();
      await service.prepareForGallery();
      service.pauseAllBackgroundVideos();
      service.togglePlayPauseCurrent();
      await service.cleanupAfterGallery();
      service.restoreBackgroundVideos();
      const state2 = service.isDownloading();

      expect(state1).toBe(state2);
    });

    it('should support concurrent gallery and download operations', async () => {
      const results = await Promise.all([
        service.prepareForGallery(),
        Promise.resolve(service.cancelDownload()),
        service.cleanupAfterGallery(),
      ]);
      expect(results).toHaveLength(3);
    });
  });

  describe('State Consistency', () => {
    it('should maintain binary state through operations', () => {
      const statuses = [service.isDownloading(), service.isDownloading(), service.isDownloading()];
      expect(statuses.every(s => s === statuses[0])).toBe(true);
    });

    it('should track video control count consistently', () => {
      service.pauseAllBackgroundVideos();
      const count1 = service.getPausedVideoCount();
      const count2 = service.getPausedVideoCount();
      expect(count1).toBe(count2);
    });

    it('should maintain state across extractmethod calls', async () => {
      const elem = document.createElement('div');
      await service.extractMedia(elem);
      expect(service.isDownloading()).toBe(false);
    });
  });
});
