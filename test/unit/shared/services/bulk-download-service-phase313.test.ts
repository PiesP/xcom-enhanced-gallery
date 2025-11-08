/**
 * BulkDownloadService - Phase 313 Test Mode & Simulation
 * Tests for validateAvailability() and simulateBulkDownload() methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import type { BulkDownloadService } from '../../../../src/shared/services/bulk-download-service.js';
import { HttpRequestService } from '../../../../src/shared/services/http-request-service.js';

describe('BulkDownloadService - Phase 313 Availability & Simulation', () => {
  // Setup global test isolation to prevent state leakage
  setupGlobalTestIsolation();

  let service: BulkDownloadService;
  let mockHttpService: any;

  beforeEach(async () => {
    // Mock HttpRequestService
    mockHttpService = {
      validateAvailability: vi.fn().mockResolvedValue({
        available: true,
        environment: 'Test',
        message: 'HTTP service available',
        canFallback: false,
      }),
    };

    vi.spyOn(HttpRequestService, 'getInstance').mockReturnValue(mockHttpService);

    const { bulkDownloadService } = await import(
      '../../../../src/shared/services/bulk-download-service.js'
    );
    service = bulkDownloadService as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as any).GM_download;
  });

  describe('validateAvailability() - Phase 313', () => {
    it('should validate service availability with all dependencies', async () => {
      const result = await service.validateAvailability();

      expect(result).toBeDefined();
      expect(result.available).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.message).toBeTruthy();
      expect(result.canSimulate).toBeDefined();
    });

    it('should include dependency status for HttpService', async () => {
      const result = await service.validateAvailability();

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.httpService).toBeDefined();
      expect(result.dependencies.httpService.available).toBeDefined();
    });

    it('should include dependency status for DownloadService', async () => {
      const result = await service.validateAvailability();

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.downloadService).toBeDefined();
      expect(result.dependencies.downloadService.available).toBeDefined();
    });

    it('should detect test mode when GM_download unavailable', async () => {
      delete (globalThis as any).GM_download;

      const result = await service.validateAvailability();

      expect(result.canSimulate).toBe(true);
      expect(result.message).toContain(result.environment);
    });

    it('should return environment string in result', async () => {
      const result = await service.validateAvailability();

      expect(result.environment).toBeTruthy();
      // Environment string can be 'Test', 'Tampermonkey', 'Extension', or 'Console'
      expect(['Tampermonkey', 'Test', 'test', 'Extension', 'Console']).toContain(
        result.environment
      );
    });
  });

  describe('simulateBulkDownload() - Phase 313', () => {
    const mockMediaItems = [
      {
        id: 'media-001',
        url: 'https://example.com/image1.jpg',
        type: 'image' as const,
        tweetId: '1234567890',
        tweetUsername: 'alice',
      },
      {
        id: 'media-002',
        url: 'https://example.com/video.mp4',
        type: 'video' as const,
        tweetId: '9876543210',
        tweetUsername: 'bob',
      },
    ];

    it('should simulate bulk download successfully', async () => {
      const result = await (service as any).simulateBulkDownload(mockMediaItems);

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(2);
      expect(result.filesSimulated).toBe(2);
      expect(result.filenames).toHaveLength(2);
    });

    it('should generate valid filenames for each media item', async () => {
      const result = await (service as any).simulateBulkDownload(mockMediaItems);

      expect(result.filenames).toHaveLength(2);
      expect(result.filenames[0]).toContain('alice');
      expect(result.filenames[0]).toContain('1234567890');
      expect(result.filenames[1]).toContain('bob');
      expect(result.filenames[1]).toContain('9876543210');
    });

    it('should simulate network delay (100-300ms)', async () => {
      const startTime = Date.now();
      const result = await (service as any).simulateBulkDownload([mockMediaItems[0]]);
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(500);
    });

    it('should handle single media item', async () => {
      const singleItem = [mockMediaItems[0]];
      const result = await (service as any).simulateBulkDownload(singleItem);

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(1);
      expect(result.filesSimulated).toBe(1);
      expect(result.filenames).toHaveLength(1);
    });
  });

  describe('Integration: Availability & Simulation - Phase 313', () => {
    const mockMediaItems = [
      {
        id: 'integration-001',
        url: 'https://example.com/image1.jpg',
        type: 'image' as const,
        tweetId: '1111111111',
        tweetUsername: 'user1',
      },
      {
        id: 'integration-002',
        url: 'https://example.com/image2.jpg',
        type: 'image' as const,
        tweetId: '2222222222',
        tweetUsername: 'user2',
      },
      {
        id: 'integration-003',
        url: 'https://example.com/video.mp4',
        type: 'video' as const,
        tweetId: '3333333333',
        tweetUsername: 'user3',
      },
    ];

    it('should confirm availability then simulate bulk download', async () => {
      delete (globalThis as any).GM_download;

      const availability = await service.validateAvailability();
      expect(availability.canSimulate).toBe(true);

      const result = await (service as any).simulateBulkDownload(mockMediaItems);
      expect(result.success).toBe(true);
      expect(result.filesSimulated).toBe(3);
    });

    it('should handle multiple media items independently', async () => {
      const result = await (service as any).simulateBulkDownload(mockMediaItems);

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(3);
      expect(result.filesSimulated).toBe(3);
      expect(result.filenames).toHaveLength(3);

      // Each filename should be unique
      const uniqueFilenames = new Set(result.filenames);
      expect(uniqueFilenames.size).toBe(3);
    });

    it('should include environment info in availability message', async () => {
      const availability = await service.validateAvailability();

      expect(availability.message).toContain(availability.environment);
      expect(availability.message).toBeTruthy();
    });
  });

  describe('Error Handling - Phase 313', () => {
    it('should handle empty media items array', async () => {
      const result = await (service as any).simulateBulkDownload([]);

      expect(result.filesProcessed).toBe(0);
      expect(result.filesSimulated).toBe(0);
      expect(result.filenames).toHaveLength(0);
    });

    it('should provide consistent result structure', async () => {
      const result = await (service as any).simulateBulkDownload([
        {
          id: 'error-test',
          url: 'https://example.com/image.jpg',
          type: 'image' as const,
        },
      ]);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('filesProcessed');
      expect(result).toHaveProperty('filesSimulated');
      expect(result).toHaveProperty('filenames');
      expect(result).toHaveProperty('message');
      expect(typeof result.success === 'boolean').toBe(true);
    });

    it('should handle abort signal in simulateBulkDownload', async () => {
      const controller = new (globalThis.AbortController as any)();
      controller.abort();

      const result = await (service as any).simulateBulkDownload(
        [
          {
            id: 'abort-test',
            url: 'https://example.com/image.jpg',
            type: 'image' as const,
          },
        ],
        { signal: controller.signal }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('취소');
    });

    it('should validate availability with HTTP service mock', async () => {
      mockHttpService.validateAvailability.mockResolvedValueOnce({
        available: false,
        environment: 'Console',
        message: 'HTTP service not available',
      });

      const result = await service.validateAvailability();

      expect(result.available).toBe(false);
    });
  });

  describe('Filename Generation - Phase 313', () => {
    it('should generate filenames with tweet information when available', async () => {
      const mediaWithTweet = [
        {
          id: 'tweet-001',
          url: 'https://example.com/image.jpg',
          type: 'image' as const,
          tweetId: '9876543210',
          tweetUsername: 'testuser',
        },
      ];

      const result = await (service as any).simulateBulkDownload(mediaWithTweet);

      expect(result.filenames[0]).toContain('testuser');
      expect(result.filenames[0]).toContain('9876543210');
    });

    it('should generate filenames without tweet information when unavailable', async () => {
      const mediaWithoutTweet = [
        {
          id: 'simple-001',
          url: 'https://example.com/image.jpg',
          type: 'image' as const,
        },
      ];

      const result = await (service as any).simulateBulkDownload(mediaWithoutTweet);

      expect(result.success).toBe(true);
      expect(result.filenames[0]).toBeTruthy();
    });
  });
});
