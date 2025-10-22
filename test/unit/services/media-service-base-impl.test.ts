/**
 * @fileoverview MediaService BaseServiceImpl 패턴 적용 테스트
 * @description Phase A5.5 Step 1: MediaService BaseServiceImpl 패턴 마이그레이션 검증
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MediaService } from '../../../src/shared/services/media-service';
import { logger } from '../../../src/shared/logging/logger';

describe('MediaService - BaseServiceImpl 패턴', () => {
  let service: MediaService;

  beforeEach(() => {
    service = new MediaService();
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BaseService 인터페이스 준수', () => {
    it('should inherit from BaseServiceImpl', () => {
      expect(service).toHaveProperty('initialize');
      expect(service).toHaveProperty('destroy');
      expect(service).toHaveProperty('isInitialized');
    });

    it('should initialize successfully', async () => {
      expect(service.isInitialized()).toBe(false);
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('MediaService initializing...');
      expect(logger.info).toHaveBeenCalledWith('MediaService initialized');
    });

    it('should not reinitialize if already initialized', async () => {
      await service.initialize();
      const initialCallCount = (logger.info as any).mock.calls.length;

      await service.initialize();

      // Should not log again
      expect((logger.info as any).mock.calls.length).toBe(initialCallCount);
    });

    it('should destroy service', async () => {
      await service.initialize();
      vi.clearAllMocks();

      service.destroy();
      expect(logger.info).toHaveBeenCalledWith('MediaService destroying...');
      expect(logger.info).toHaveBeenCalledWith('MediaService destroyed');
    });

    it('should clean up resources on destroy', async () => {
      await service.initialize();
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });

    it('should not destroy if not initialized', () => {
      service.destroy();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return correct service name', async () => {
      await service.initialize();
      expect(logger.info).toHaveBeenCalledWith('MediaService initializing...');
    });

    it('should have initialized flag after initialize', async () => {
      expect(service.isInitialized()).toBe(false);
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should have initialized flag false after destroy', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);

      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('미디어 기능 보존', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should have cancelDownload method', () => {
      expect(service).toHaveProperty('cancelDownload');
      expect(typeof service.cancelDownload).toBe('function');
    });

    it('should have isDownloading method', () => {
      expect(service).toHaveProperty('isDownloading');
      expect(typeof service.isDownloading).toBe('function');
    });

    it('should not be downloading initially', () => {
      expect(service.isDownloading()).toBe(false);
    });
  });

  describe('싱글톤 패턴', () => {
    it('should return same instance from getInstance', () => {
      const instance1 = MediaService.getInstance();
      const instance2 = MediaService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton even after destruction', async () => {
      const instance1 = MediaService.getInstance();
      await instance1.initialize();
      instance1.destroy();

      const instance2 = MediaService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('초기화 에러 처리', () => {
    it('should handle initialization gracefully', async () => {
      const newService = new MediaService();
      await newService.initialize();
      expect(newService.isInitialized()).toBe(true);
    });

    it('should handle destroy gracefully', () => {
      const newService = new MediaService();
      expect(() => newService.destroy()).not.toThrow();
      expect(newService.isInitialized()).toBe(false);
    });
  });

  describe('라이프사이클 시나리오', () => {
    it('should handle multiple initialize/destroy cycles', async () => {
      for (let i = 0; i < 2; i++) {
        expect(service.isInitialized()).toBe(false);

        await service.initialize();
        expect(service.isInitialized()).toBe(true);

        service.destroy();
        expect(service.isInitialized()).toBe(false);
      }
    });

    it('should maintain media functions across lifecycle', async () => {
      await service.initialize();
      expect(typeof service.extractFromClickedElement).toBe('function');

      service.destroy();
      expect(typeof service.extractFromClickedElement).toBe('function');

      await service.initialize();
      expect(typeof service.extractFromClickedElement).toBe('function');
    });
  });

  describe('동시성 안전성', () => {
    it('should handle concurrent initializations safely', async () => {
      const newService = new MediaService();
      await Promise.all([newService.initialize(), newService.initialize()]);
      expect(newService.isInitialized()).toBe(true);
    });

    it('should handle sequential re-initializations safely', async () => {
      await service.initialize();
      const callCount = (logger.info as any).mock.calls.length;

      await service.initialize();

      const newCallCount = (logger.info as any).mock.calls.length;
      expect(newCallCount).toBe(callCount);
    });
  });
});
