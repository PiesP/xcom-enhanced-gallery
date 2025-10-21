/**
 * @fileoverview MediaService 단위 테스트 (간소화)
 * @description 55.39% → 80%+ 커버리지 목표 (핵심 메서드 집중)
 *
 * 주의: MediaService는 복잡한 의존성을 가지고 있어 전체 테스트는 통합 테스트로 진행
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { MediaService } from '../../../../src/shared/services/media-service.js';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    service = MediaService.getInstance();
  });

  describe('싱글톤 패턴', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = MediaService.getInstance();
      const instance2 = MediaService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('cancelDownload', () => {
    it('should cancel download without errors', () => {
      expect(() => service.cancelDownload()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      service.cancelDownload();
      service.cancelDownload();
      expect(() => service.cancelDownload()).not.toThrow();
    });
  });

  describe('isDownloading', () => {
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
  });

  describe('cleanup', () => {
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
  });

  describe('prepareForGallery', () => {
    it('should prepare for gallery without errors', async () => {
      await expect(service.prepareForGallery()).resolves.not.toThrow();
    });

    it('should be callable multiple times', async () => {
      await service.prepareForGallery();
      await expect(service.prepareForGallery()).resolves.not.toThrow();
    });
  });

  describe('cleanupAfterGallery', () => {
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
  });

  describe('prefetchNextMedia', () => {
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
  });

  describe('라이프사이클', () => {
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
  });
});
