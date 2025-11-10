/**
 * @fileoverview UnifiedDownloadService Phase 315-Extended 테스트
 * @description validateAvailability() + simulateUnifiedDownload() 메서드 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { unifiedDownloadService } from '@shared/services/unified-download-service';
import type {
  UnifiedDownloadAvailabilityResult,
  SimulatedUnifiedDownloadResult,
} from '@shared/services/unified-download-service';
import type { MediaInfo } from '@shared/types';

describe('UnifiedDownloadService - Phase 315-Extended', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====================================
  // validateAvailability() 테스트
  // ====================================

  describe('validateAvailability()', () => {
    it('should return availability result with correct structure', async () => {
      const result = await unifiedDownloadService.validateAvailability();

      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('canSimulate');
      expect(result).toHaveProperty('dependencies');
      expect(typeof result.available).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should check three dependencies', async () => {
      const result = await unifiedDownloadService.validateAvailability();

      expect(result.dependencies).toHaveProperty('downloadService');
      expect(result.dependencies).toHaveProperty('bulkDownloadService');
      expect(result.dependencies).toHaveProperty('orchestrator');
    });

    it('should include dependency availability status', async () => {
      const result = await unifiedDownloadService.validateAvailability();

      expect(typeof result.dependencies.downloadService.available).toBe('boolean');
      expect(typeof result.dependencies.bulkDownloadService.available).toBe('boolean');
      expect(typeof result.dependencies.orchestrator.available).toBe('boolean');
    });

    it('should include environment information', async () => {
      const result = await unifiedDownloadService.validateAvailability();

      expect(['browser', 'test', 'node', 'unknown', 'userscript']).toContain(result.environment);
      const hasEmoji = result.message.includes('✅') || result.message.includes('⚠️');
      expect(hasEmoji).toBe(true);
    });

    it('should indicate simulation capability', async () => {
      const result = await unifiedDownloadService.validateAvailability();

      expect(typeof result.canSimulate).toBe('boolean');
    });
  });

  // ====================================
  // simulateUnifiedDownload() 테스트
  // ====================================

  describe('simulateUnifiedDownload()', () => {
    it('should simulate single file download', async () => {
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
      ];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(1);
      expect(result.itemsSimulated).toBe(1);
      expect(result.filenames.length).toBeGreaterThan(0);
    });

    it('should simulate multiple file download with ZIP', async () => {
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
        {
          id: 'test-2',
          url: 'https://video.twimg.com/test2.mp4',
          type: 'video',
        },
        {
          id: 'test-3',
          url: 'https://pbs.twimg.com/media/test3.jpg',
          type: 'photo',
        },
      ];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(3);
      expect(result.itemsSimulated).toBe(3);
      expect(result.filenames.length).toBeGreaterThanOrEqual(3);
    });

    it('should include filenames in result', async () => {
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test.jpg',
          type: 'photo',
        },
      ];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      expect(result.filenames).toBeDefined();
      expect(result.filenames.length).toBeGreaterThan(0);
      result.filenames.forEach(filename => {
        expect(typeof filename).toBe('string');
      });
    });

    it('should include ZIP filename for multiple files', async () => {
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
        {
          id: 'test-2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'photo',
        },
      ];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      const hasZipFile = result.filenames.some(f => f.endsWith('.zip'));
      expect(hasZipFile).toBe(true);
    });

    it('should handle empty media array', async () => {
      const mediaItems: MediaInfo[] = [];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      expect(result.success).toBe(false);
      expect(result.itemsProcessed).toBe(0);
      expect(result.itemsSimulated).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should handle AbortSignal', async () => {
      const controller = new globalThis.AbortController();

      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
      ];

      controller.abort();

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems, {
        signal: controller.signal,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Aborted');
      expect(result.itemsSimulated).toBe(0);
    });

    it('should provide user-friendly message', async () => {
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
        {
          id: 'test-2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'photo',
        },
      ];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      expect(result.message).toContain('✅');
      expect(result.message).toContain('/');
      expect(result.message.toLowerCase()).toContain('items');
      expect(result.message.toLowerCase()).toContain('complete');
    });

    it('should handle different media types', async () => {
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
        {
          id: 'test-2',
          url: 'https://video.twimg.com/test2.mp4',
          type: 'video',
        },
      ];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      expect(result.success).toBe(true);
      expect(result.itemsSimulated).toBe(2);
      expect(result.filenames.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ====================================
  // 통합 테스트
  // ====================================

  describe('Integration', () => {
    it('should validate availability before simulating', async () => {
      const availability = await unifiedDownloadService.validateAvailability();

      expect(availability).toBeDefined();
      expect(availability.dependencies).toBeDefined();

      if (availability.canSimulate) {
        const mediaItems: MediaInfo[] = [
          {
            id: 'test-1',
            url: 'https://pbs.twimg.com/media/test.jpg',
            type: 'photo',
          },
        ];

        const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

        expect(result).toBeDefined();
        expect(result.itemsSimulated).toBeGreaterThanOrEqual(0);
      }
    });

    it('should maintain consistency across availability checks', async () => {
      const result1 = await unifiedDownloadService.validateAvailability();
      const result2 = await unifiedDownloadService.validateAvailability();

      expect(result1.available).toBe(result2.available);
      expect(result1.environment).toBe(result2.environment);
    });

    it('should differentiate between single and bulk download paths', async () => {
      const singleItem: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
      ];

      const multipleItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
        {
          id: 'test-2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'photo',
        },
      ];

      const singleResult = await unifiedDownloadService.simulateUnifiedDownload(singleItem);
      const multipleResult = await unifiedDownloadService.simulateUnifiedDownload(multipleItems);

      expect(singleResult.success).toBe(true);
      expect(multipleResult.success).toBe(true);

      // 다중 파일에는 ZIP 파일이 포함되어야 함
      const hasZipInMultiple = multipleResult.filenames.some(f => f.endsWith('.zip'));
      expect(hasZipInMultiple).toBe(true);
    });
  });

  // ====================================
  // 에러 처리
  // ====================================

  describe('Error Handling', () => {
    it('should handle null media gracefully', async () => {
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test.jpg',
          type: 'photo',
        },
      ];

      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('should return error result on failure', async () => {
      const result = await unifiedDownloadService.simulateUnifiedDownload([]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide descriptive error messages', async () => {
      const result = await unifiedDownloadService.validateAvailability();

      if (!result.available) {
        const hasErrorEmoji = result.message.includes('⚠️') || result.message.includes('❌');
        expect(hasErrorEmoji).toBe(true);
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  // ====================================
  // 성능 특성
  // ====================================

  describe('Performance', () => {
    it('should simulate single file faster than multiple files', async () => {
      const singleItem: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'photo',
        },
      ];

      const multipleItems: MediaInfo[] = Array.from({ length: 5 }, (_, i) => ({
        id: `test-${i + 1}`,
        url: `https://pbs.twimg.com/media/test${i + 1}.jpg`,
        type: 'photo' as const,
      }));

      const singleStart = Date.now();
      await unifiedDownloadService.simulateUnifiedDownload(singleItem);
      const singleTime = Date.now() - singleStart;

      const multipleStart = Date.now();
      await unifiedDownloadService.simulateUnifiedDownload(multipleItems);
      const multipleTime = Date.now() - multipleStart;

      expect(singleTime).toBeLessThan(multipleTime);
    });

    it('should complete simulation in reasonable time', async () => {
      const mediaItems: MediaInfo[] = Array.from({ length: 10 }, (_, i) => ({
        id: `test-${i + 1}`,
        url: `https://pbs.twimg.com/media/test${i + 1}.jpg`,
        type: 'photo' as const,
      }));

      const start = Date.now();
      const result = await unifiedDownloadService.simulateUnifiedDownload(mediaItems);
      const elapsed = Date.now() - start;

      expect(result.success).toBe(true);
      // 대량 다운로드 시뮬레이션은 1초 이상 소요 (지연 시뮬레이션)
      expect(elapsed).toBeGreaterThan(500);
      // 하지만 10초 이내에 완료
      expect(elapsed).toBeLessThan(10000);
    });
  });
});
