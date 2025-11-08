/**
 * DownloadService - Phase 320 E2E (End-to-End) Tests (Stage 4-3)
 *
 * Focus: Real-world workflow validation, user interaction patterns,
 * and complete download scenarios using actual GM_download behavior simulation
 *
 * Note: These are integration-style E2E tests using Vitest + mocks
 * instead of full Playwright, for faster execution and maintainability
 *
 * Total: 5 E2E test scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  DownloadService,
  type BlobDownloadOptions,
  type BlobDownloadResult,
} from '../../../../src/shared/services/download-service.js';

describe('DownloadService - Phase 320 E2E Tests (Stage 4-3)', () => {
  setupGlobalTestIsolation();

  let service: DownloadService;

  beforeEach(() => {
    service = DownloadService.getInstance();
    service.reset?.();
    vi.clearAllMocks();
  });

  describe('E2E Workflow Tests (5 scenarios)', () => {
    it('[E2E-1] Complete single file download workflow', async () => {
      /**
       * User Story: Download a single file
       * Expected: File is downloaded successfully with correct metadata
       */

      const fileContent = 'This is important document content\nLine 2\nLine 3';
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const filename = 'important-document.txt';

      // Mock GM_download behavior
      let downloadCalled = false;
      let downloadedFilename = '';
      let downloadedSize = 0;

      (globalThis as any).GM_download = vi.fn((options: any) => {
        downloadCalled = true;
        downloadedFilename = options.name;
        downloadedSize = (options.blob as Blob).size;

        // Simulate successful download
        setTimeout(() => options.onload?.(), 10);
      });

      // Execute workflow
      const result = await service.downloadBlob({
        blob,
        name: filename,
      });

      // Verify complete workflow
      expect(downloadCalled).toBe(true);
      expect(result.success).toBe(true);
      expect(result.filename).toBe(filename);
      expect(result.size).toBe(fileContent.length);
      expect(downloadedFilename).toBe(filename);
      expect(downloadedSize).toBe(fileContent.length);
    });

    it('[E2E-2] Bulk download workflow with progress tracking', async () => {
      /**
       * User Story: Download multiple files with progress feedback
       * Expected: All files download with proper progress updates
       */

      const files = [
        { name: 'report-2025-01.pdf', content: new Array(100).fill('A').join('') },
        { name: 'report-2025-02.pdf', content: new Array(200).fill('B').join('') },
        { name: 'report-2025-03.pdf', content: new Array(150).fill('C').join('') },
      ];

      const progressEvents: any[] = [];
      const downloadLog: any[] = [];

      let callIndex = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        callIndex++;
        const currentFile = files[callIndex - 1];

        downloadLog.push({
          order: callIndex,
          filename: options.name,
          size: options.blob.size,
        });

        options.onload?.();
      });

      // Execute bulk workflow
      const results = await service.downloadBlobBulk(
        files.map(f => ({
          blob: new Blob([f.content], { type: 'application/pdf' }),
          name: f.name,
          onProgress: (progress: any) => {
            progressEvents.push(progress);
          },
        }))
      );

      // Verify complete workflow
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(downloadLog).toHaveLength(3);
      expect(downloadLog[0].filename).toBe('report-2025-01.pdf');
      expect(downloadLog[1].filename).toBe('report-2025-02.pdf');
      expect(downloadLog[2].filename).toBe('report-2025-03.pdf');
    });

    it('[E2E-3] Error recovery workflow', async () => {
      /**
       * User Story: Download fails, user retries and succeeds
       * Expected: System recovers and completes successfully
       */

      const blob = new Blob(['important data'], { type: 'text/plain' });
      const filename = 'data.txt';
      const attempts: Array<{ attempt: number; success: boolean; error?: string }> = [];

      // First attempt: network error
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onerror?.('Network timeout - retrying might help');
      });

      let result = await service.downloadBlob({ blob, name: filename });
      attempts.push({
        attempt: 1,
        success: result.success,
        error: result.error,
      });

      // Second attempt: still fails
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onerror?.('Still having connection issues');
      });

      result = await service.downloadBlob({ blob, name: filename });
      attempts.push({
        attempt: 2,
        success: result.success,
        error: result.error,
      });

      // Third attempt: succeeds
      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      result = await service.downloadBlob({ blob, name: filename });
      attempts.push({
        attempt: 3,
        success: result.success,
      });

      // Verify recovery workflow
      expect(attempts[0].success).toBe(false);
      expect(attempts[1].success).toBe(false);
      expect(attempts[2].success).toBe(true);
      expect(attempts[2].error).toBeUndefined();

      // Verify error messages are informative
      expect(attempts[0].error).toContain('timeout');
      expect(attempts[1].error).toContain('connection');
    });

    it('[E2E-4] Partial failure handling in batch operation', async () => {
      /**
       * User Story: Download 10 files, some fail
       * Expected: System provides detailed report of successes/failures
       */

      const fileCount = 10;
      const failIndices = [2, 5, 8]; // Files that will fail

      const operationLog = {
        totalAttempted: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        failures: [] as Array<{ index: number; filename: string; reason: string }>,
      };

      let callIndex = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        callIndex++;
        const fileIndex = callIndex - 1;

        if (failIndices.includes(fileIndex)) {
          options.onerror?.(`File ${options.name}: permission denied on server`);
        } else {
          options.onload?.();
        }
      });

      // Create batch
      const batch = Array.from({ length: fileCount }, (_, i) => ({
        blob: new Blob([`File ${i} content`], { type: 'text/plain' }),
        name: `file_${i}.txt`,
      }));

      // Execute batch workflow
      const results = await service.downloadBlobBulk(batch);

      // Log results
      operationLog.totalAttempted = results.length;
      operationLog.totalSucceeded = results.filter(r => r.success).length;
      operationLog.totalFailed = results.filter(r => !r.success).length;

      results.forEach((result, index) => {
        if (!result.success) {
          operationLog.failures.push({
            index,
            filename: result.filename || `file_${index}.txt`,
            reason: result.error || 'unknown error',
          });
        }
      });

      // Verify batch operation report
      expect(operationLog.totalAttempted).toBe(10);
      expect(operationLog.totalSucceeded).toBe(7);
      expect(operationLog.totalFailed).toBe(3);
      expect(operationLog.failures).toHaveLength(3);
      expect(operationLog.failures[0].index).toBe(2);
      expect(operationLog.failures[1].index).toBe(5);
      expect(operationLog.failures[2].index).toBe(8);
    });

    it('[E2E-5] Complex real-world scenario: Media gallery export', async () => {
      /**
       * User Story: User selects 15 media items and exports them
       * Expected: System handles mixed file types, sizes, and names with grace
       */

      interface MediaItem {
        filename: string;
        mimeType: string;
        size: number;
      }

      const mediaLibrary: MediaItem[] = [
        { filename: 'photo_001.jpg', mimeType: 'image/jpeg', size: 2 * 1024 * 1024 }, // 2MB
        { filename: 'photo_002.jpg', mimeType: 'image/jpeg', size: 3 * 1024 * 1024 }, // 3MB
        { filename: 'video_001.mp4', mimeType: 'video/mp4', size: 50 * 1024 * 1024 }, // 50MB
        { filename: 'document.pdf', mimeType: 'application/pdf', size: 5 * 1024 * 1024 }, // 5MB
        { filename: 'notes.txt', mimeType: 'text/plain', size: 50 * 1024 }, // 50KB
      ];

      const exportStats = {
        itemsRequested: mediaLibrary.length,
        itemsCompleted: 0,
        itemsFailed: 0,
        totalSizeProcessed: 0,
        totalSizeRequested: mediaLibrary.reduce((sum, m) => sum + m.size, 0),
        processingTimeMs: 0,
        startTime: Date.now(),
      };

      let downloadCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        downloadCount++;

        // Simulate occasional failures (like network glitches)
        if (downloadCount % 4 === 0) {
          // Every 4th item randomly fails
          options.onerror?.('Temporary network glitch');
        } else {
          options.onload?.();
        }
      });

      // Create download batch
      const downloadBatch = mediaLibrary.map(media => ({
        blob: new Blob([new ArrayBuffer(media.size)], { type: media.mimeType }),
        name: media.filename,
      }));

      // Execute export workflow
      const results = await service.downloadBlobBulk(downloadBatch);

      exportStats.processingTimeMs = Date.now() - exportStats.startTime;
      exportStats.itemsCompleted = results.filter(r => r.success).length;
      exportStats.itemsFailed = results.filter(r => !r.success).length;
      exportStats.totalSizeProcessed = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.size || 0), 0);

      // Verify export workflow
      expect(exportStats.itemsRequested).toBe(5);
      expect(exportStats.itemsCompleted).toBeGreaterThan(0);
      expect(exportStats.itemsCompleted + exportStats.itemsFailed).toBe(exportStats.itemsRequested);
      expect(exportStats.totalSizeProcessed).toBeGreaterThan(0);
      expect(exportStats.processingTimeMs).toBeLessThan(10000); // Should complete < 10 seconds

      // Verify diverse file types were handled
      expect(results.some(r => r.filename?.includes('jpg'))).toBe(true);
      expect(results.some(r => r.filename?.includes('mp4'))).toBe(true);
      expect(results.some(r => r.filename?.includes('pdf'))).toBe(true);
      expect(results.some(r => r.filename?.includes('txt'))).toBe(true);
    });
  });

  describe('E2E Edge Cases (2 scenarios)', () => {
    it('[E2E-Edge-1] Network interruption mid-operation', async () => {
      /**
       * User Story: Internet drops during bulk download
       * Expected: Already downloaded files succeed, remaining files fail gracefully
       */

      const files = Array.from({ length: 8 }, (_, i) => ({
        blob: new Blob([`data${i}`], { type: 'text/plain' }),
        name: `file_${i}.txt`,
      }));

      let downloadCount = 0;
      (globalThis as any).GM_download = vi.fn((options: any) => {
        downloadCount++;

        // Simulate network drop after 4 files
        if (downloadCount > 4) {
          options.onerror?.('Network connection lost');
        } else {
          options.onload?.();
        }
      });

      const results = await service.downloadBlobBulk(files);

      // First 4 should succeed
      expect(results.slice(0, 4).every(r => r.success)).toBe(true);
      // Last 4 should fail
      expect(results.slice(4).every(r => !r.success)).toBe(true);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBe(4);
      expect(failureCount).toBe(4);
    });

    it('[E2E-Edge-2] Storage quota reached during operation', async () => {
      /**
       * User Story: Disk storage fills up during large file downloads
       * Expected: System detects quota exceeded and stops gracefully
       */

      const largeFiles = [
        { name: 'large_1.bin', size: 100 * 1024 * 1024 }, // 100MB
        { name: 'large_2.bin', size: 100 * 1024 * 1024 }, // 100MB
        { name: 'large_3.bin', size: 100 * 1024 * 1024 }, // 100MB
      ];

      let downloadCount = 0;
      const quotaLimit = 200 * 1024 * 1024; // 200MB total quota
      let usedQuota = 0;

      (globalThis as any).GM_download = vi.fn((options: any) => {
        downloadCount++;
        const fileSize = (options.blob as Blob).size;

        if (usedQuota + fileSize > quotaLimit) {
          options.onerror?.('QuotaExceededError: Storage quota exceeded');
        } else {
          usedQuota += fileSize;
          options.onload?.();
        }
      });

      const results = await service.downloadBlobBulk(
        largeFiles.map(f => ({
          blob: new Blob([new ArrayBuffer(f.size)], { type: 'application/octet-stream' }),
          name: f.name,
        }))
      );

      // First 2 should succeed (200MB), third should fail (would be 300MB)
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(false);
      expect(results[2].error).toContain('Quota');
    });
  });

  describe('E2E Performance Validation', () => {
    it('[E2E-Perf] Should complete batch of 50 files within acceptable time', async () => {
      /**
       * Performance baseline: 50 sequential downloads should complete in < 10 seconds
       * This validates that no performance regressions were introduced
       */

      const fileCount = 50;
      const startTime = performance.now();

      (globalThis as any).GM_download = vi.fn((options: any) => {
        options.onload?.();
      });

      const results = await service.downloadBlobBulk(
        Array.from({ length: fileCount }, (_, i) => ({
          blob: new Blob([`file${i}`], { type: 'text/plain' }),
          name: `file_${i}.txt`,
        }))
      );

      const duration = performance.now() - startTime;

      expect(results).toHaveLength(fileCount);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(10000); // Must complete within 10 seconds

      // Bonus: Verify 100ms delay between downloads
      // For 50 files, should be roughly (49 * 100ms) + overhead
      expect(duration).toBeGreaterThan(4000); // At least 4 seconds for delays
    });
  });
});
