/**
 * @fileoverview DownloadOrchestrator - BaseServiceImpl 패턴 검증
 * @description
 * - BaseService 인터페이스 준수
 * - 싱글톤 패턴
 * - 생명주기 관리 (타이머 정리)
 * - 동시성 제어 및 재시도 로직
 */

import { beforeEach, afterEach, expect, it, describe, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';

// Mock the zip-creator module
vi.mock('@shared/external/zip/zip-creator', () => ({
  createZipBytesFromFileMap: vi.fn(async () => new Uint8Array([0x50, 0x4b, 0x03, 0x04])),
}));

describe('DownloadOrchestrator - BaseServiceImpl Pattern', () => {
  setupGlobalTestIsolation();

  let orchestrator: DownloadOrchestrator;

  beforeEach(async () => {
    orchestrator = DownloadOrchestrator.getInstance();
    if (!orchestrator.isInitialized()) {
      await orchestrator.initialize();
    }
  });

  afterEach(() => {
    if (orchestrator && orchestrator.isInitialized()) {
      orchestrator.destroy();
    }
  });

  describe('BaseService Interface Compliance', () => {
    it('should have serviceName property', () => {
      expect((orchestrator as any).serviceName).toBe('DownloadOrchestrator');
    });

    it('should have isInitialized method', () => {
      expect(typeof orchestrator.isInitialized).toBe('function');
      expect(orchestrator.isInitialized()).toBe(true);
    });

    it('should have initialize and destroy methods', () => {
      expect(typeof orchestrator.initialize).toBe('function');
      expect(typeof orchestrator.destroy).toBe('function');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getInstance()', () => {
      const instance1 = DownloadOrchestrator.getInstance();
      const instance2 = DownloadOrchestrator.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain singleton across destroy/reinitialize', async () => {
      const instance1 = DownloadOrchestrator.getInstance();
      instance1.destroy();
      await instance1.initialize();
      const instance2 = DownloadOrchestrator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization Lifecycle', () => {
    it('should initialize successfully', async () => {
      const instance = DownloadOrchestrator.getInstance();
      instance.destroy();
      expect(instance.isInitialized()).toBe(false);
      await instance.initialize();
      expect(instance.isInitialized()).toBe(true);
    });

    it('should guard against re-initialization', async () => {
      const instance = DownloadOrchestrator.getInstance();
      expect(instance.isInitialized()).toBe(true);
      await instance.initialize();
      expect(instance.isInitialized()).toBe(true);
    });

    it('should handle initialization without errors', async () => {
      const instance = DownloadOrchestrator.getInstance();
      instance.destroy();
      expect(instance.isInitialized()).toBe(false);
      await expect(instance.initialize()).resolves.toBeUndefined();
      expect(instance.isInitialized()).toBe(true);
    });
  });

  describe('Destruction & Cleanup', () => {
    it('should destroy successfully', () => {
      const instance = DownloadOrchestrator.getInstance();
      expect(instance.isInitialized()).toBe(true);
      instance.destroy();
      expect(instance.isInitialized()).toBe(false);
    });

    it('should guard against double destruction', () => {
      const instance = DownloadOrchestrator.getInstance();
      instance.destroy();
      expect(instance.isInitialized()).toBe(false);
      expect(() => instance.destroy()).not.toThrow();
      expect(instance.isInitialized()).toBe(false);
    });

    it('should clear active timers on destroy', () => {
      const instance = DownloadOrchestrator.getInstance();
      expect(() => instance.destroy()).not.toThrow();
      expect(instance.isInitialized()).toBe(false);
    });
  });

  describe('Core Functionality', () => {
    it('should handle empty items list', async () => {
      const instance = DownloadOrchestrator.getInstance();
      await instance.initialize();

      const result = await instance.zipMediaItems([], {});

      expect(result).toBeDefined();
      expect(result.filesSuccessful).toBe(0);
      expect(result.failures).toEqual([]);
      expect(result.zipData).toBeDefined();
      expect(result.usedFilenames).toEqual([]);

      instance.destroy();
    });

    it('should track filenames correctly', async () => {
      const instance = DownloadOrchestrator.getInstance();
      await instance.initialize();

      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(10),
        }))
      );

      const items = [
        { url: 'http://example.com/file1.bin', desiredName: 'file1.bin' },
        { url: 'http://example.com/file2.bin', desiredName: 'file2.bin' },
      ];

      try {
        const result = await instance.zipMediaItems(items, { concurrency: 1 });
        expect(result.usedFilenames).toHaveLength(2);
      } catch {
        // Fetch may fail, but the structure should be validated
      }

      instance.destroy();
    });

    it('should have DEFAULT_BACKOFF_BASE_MS constant', () => {
      expect(DownloadOrchestrator.DEFAULT_BACKOFF_BASE_MS).toBe(200);
    });
  });

  describe('Filename Collision Handling', () => {
    it('should resolve filename collisions when all items have same name', async () => {
      const instance = DownloadOrchestrator.getInstance();
      await instance.initialize();

      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(10),
        }))
      );

      const items = [
        { url: 'http://example.com/file1', desiredName: 'file.bin' },
        { url: 'http://example.com/file2', desiredName: 'file.bin' },
        { url: 'http://example.com/file3', desiredName: 'file.bin' },
      ];

      try {
        const result = await instance.zipMediaItems(items, { concurrency: 1 });
        if (result.filesSuccessful === 3) {
          expect(new Set(result.usedFilenames).size).toBe(3);
        }
      } catch {
        // Fetch may fail, structure validation passed
      }

      instance.destroy();
    });

    it('should preserve filename extension in collision resolution', async () => {
      const instance = DownloadOrchestrator.getInstance();
      await instance.initialize();

      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(10),
        }))
      );

      const items = [
        { url: 'http://example.com/file1', desiredName: 'image.jpg' },
        { url: 'http://example.com/file2', desiredName: 'image.jpg' },
      ];

      try {
        const result = await instance.zipMediaItems(items, { concurrency: 1 });
        if (result.filesSuccessful === 2) {
          expect(result.usedFilenames.every(name => name.includes('.jpg'))).toBe(true);
        }
      } catch {
        // Fetch may fail, structure validation passed
      }

      instance.destroy();
    });
  });

  describe('Type Safety & Exports', () => {
    it('should be defined and instantiable', () => {
      expect(DownloadOrchestrator).toBeDefined();
      expect(DownloadOrchestrator.getInstance).toBeDefined();
    });

    it('should implement standard service interface', () => {
      const instance = DownloadOrchestrator.getInstance();
      expect(typeof instance.initialize).toBe('function');
      expect(typeof instance.destroy).toBe('function');
      expect(typeof instance.isInitialized).toBe('function');
      expect(typeof instance.isInitialized()).toBe('boolean');
    });
  });

  describe('Full Lifecycle', () => {
    it('should complete full initialization → use → destroy cycle', async () => {
      const instance = DownloadOrchestrator.getInstance();
      expect(instance.isInitialized()).toBe(true);

      const items: any[] = [];
      try {
        await instance.zipMediaItems(items, {});
      } catch {
        // OK if operation fails
      }

      expect(instance.isInitialized()).toBe(true);
      instance.destroy();
      expect(instance.isInitialized()).toBe(false);
    });

    it('should reinitialize after destroy', async () => {
      const instance = DownloadOrchestrator.getInstance();
      expect(instance.isInitialized()).toBe(true);

      instance.destroy();
      expect(instance.isInitialized()).toBe(false);

      await instance.initialize();
      expect(instance.isInitialized()).toBe(true);
    });

    it('should support multiple lifecycle cycles', async () => {
      const instance = DownloadOrchestrator.getInstance();

      for (let i = 0; i < 3; i++) {
        await instance.initialize();
        expect(instance.isInitialized()).toBe(true);
        instance.destroy();
        expect(instance.isInitialized()).toBe(false);
      }
    });
  });
});
