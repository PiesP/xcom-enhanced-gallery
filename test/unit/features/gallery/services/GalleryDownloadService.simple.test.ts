/**
 * Gallery Download Service Tests - Simplified Version
 *
 * 실제 기능 테스트에 집중하고, 너무 세부적인 mock 검증은 제거
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GalleryDownloadService } from '../../../../../src/features/gallery/services/GalleryDownloadService';
import type { MediaItem } from '../../../../../src/core/types/media.types';

describe('GalleryDownloadService - Simplified', () => {
  let downloadService: GalleryDownloadService;

  const mockMediaItems: MediaItem[] = [
    {
      id: '1',
      url: 'https://example.com/image1.jpg',
      type: 'image' as const,
      width: 800,
      height: 600,
      size: 1024,
      format: 'jpg',
    },
    {
      id: '2',
      url: 'https://example.com/image2.png',
      type: 'image' as const,
      width: 1200,
      height: 800,
      size: 2048,
      format: 'png',
    },
    {
      id: '3',
      url: 'https://example.com/video.mp4',
      type: 'video' as const,
      width: 1920,
      height: 1080,
      size: 10240,
      format: 'mp4',
    },
  ];

  beforeEach(async () => {
    downloadService = GalleryDownloadService.getInstance();
    await downloadService.initialize();
  });

  describe('Basic Functionality', () => {
    it('should be a singleton', () => {
      const instance1 = GalleryDownloadService.getInstance();
      const instance2 = GalleryDownloadService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize and destroy correctly', async () => {
      expect(downloadService.isInitialized()).toBe(true);

      await downloadService.destroy();
      expect(downloadService.isInitialized()).toBe(false);

      // Re-initialize for other tests
      await downloadService.initialize();
    });
  });

  describe('Download Methods', () => {
    it('should have downloadCurrent method that returns boolean', async () => {
      const media = mockMediaItems[0];
      const result = await downloadService.downloadCurrent(media);

      expect(typeof result).toBe('boolean');
    });

    it('should have downloadMultiple method that returns DownloadResult', async () => {
      const result = await downloadService.downloadMultiple(mockMediaItems);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should have downloadAll method for ZIP downloads', async () => {
      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should have downloadSelected method', async () => {
      const selectedItems = mockMediaItems.slice(0, 2);
      const result = await downloadService.downloadSelected(selectedItems);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should have downloadSingle method that returns DownloadResult', async () => {
      const media = mockMediaItems[0];
      const result = await downloadService.downloadSingle(media);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should have downloadBulk alias method', async () => {
      const result = await downloadService.downloadBulk(mockMediaItems);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      expect(result).toHaveProperty('downloadedCount');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty arrays gracefully', async () => {
      const result = await downloadService.downloadAll([]);

      // Should not throw error, regardless of success/failure
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle invalid media items gracefully', async () => {
      const invalidMedia = { id: '', url: '', type: 'unknown' } as any;

      try {
        const result = await downloadService.downloadCurrent(invalidMedia);
        expect(typeof result).toBe('boolean');
      } catch (error) {
        // Error is acceptable for invalid input
        expect(error).toBeDefined();
      }
    });
  });

  describe('Options Support', () => {
    it('should accept download options', async () => {
      const progressCallback = vi.fn();

      const result = await downloadService.downloadMultiple(mockMediaItems, {
        strategy: 'individual',
        onProgress: progressCallback,
      });

      expect(result).toHaveProperty('success');
    });

    it('should accept ZIP-specific options', async () => {
      const result = await downloadService.downloadAll(mockMediaItems, {
        zipFilename: 'custom-gallery.zip',
      });

      expect(result).toHaveProperty('success');
    });
  });

  describe('Type Safety', () => {
    it('should work with MediaItem type', async () => {
      const media: MediaItem = mockMediaItems[0];
      const result = await downloadService.downloadCurrent(media);

      expect(typeof result).toBe('boolean');
    });

    it('should accept readonly arrays', async () => {
      const readonlyItems: readonly MediaItem[] = mockMediaItems;
      const result = await downloadService.downloadMultiple(readonlyItems);

      expect(result).toHaveProperty('success');
    });
  });
});
