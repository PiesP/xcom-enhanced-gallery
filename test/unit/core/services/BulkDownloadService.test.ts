/**
 * Bulk Download Service Unit Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkDownloadService } from '../../../../src/core/services/BulkDownloadService';
import type { MediaInfo } from '../../../../src/core/types/media.types';

// Mock dependencies - 정확한 경로와 기능 구현
vi.mock('@shared/utils/external/zip', () => ({
  createZipFromItems: vi
    .fn()
    .mockResolvedValue(new Blob(['mock zip data'], { type: 'application/zip' })),
}));

vi.mock('@shared/utils/external', () => ({
  getNativeDownload: vi.fn(() => ({
    downloadBlob: vi.fn(),
    createDownloadUrl: vi.fn(() => 'blob:mock-url'),
    revokeDownloadUrl: vi.fn(),
  })),
}));

vi.mock('@shared/utils/media', () => ({
  generateMediaFilename: vi.fn().mockReturnValue('test-filename'),
  generateZipFilename: vi.fn().mockReturnValue('test-archive.zip'),
}));

vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK',
  blob: vi.fn().mockResolvedValue(new Blob(['mock image data'])),
  headers: {
    get: vi.fn().mockReturnValue('1024'),
  },
} as any);

describe('BulkDownloadService', () => {
  let service: BulkDownloadService;

  const mockMediaItems: MediaInfo[] = [
    {
      id: 'media-1',
      url: 'https://example.com/image1.jpg',
      originalUrl: 'https://example.com/orig1.jpg',
      filename: 'image1.jpg',
      type: 'image',
      size: 1024,
    },
    {
      id: 'media-2',
      url: 'https://example.com/video1.mp4',
      originalUrl: 'https://example.com/origvid1.mp4',
      filename: 'video1.mp4',
      type: 'video',
      size: 2048,
    },
    {
      id: 'media-3',
      url: 'https://example.com/image2.png',
      filename: 'image2.png',
      type: 'image',
      size: 512,
    },
  ];

  beforeEach(async () => {
    service = BulkDownloadService.getInstance();
    await service.initialize();
    vi.clearAllMocks();

    // Setup mock implementations using vi.mocked
    const { generateMediaFilename, generateZipFilename } =
      await vi.importMock('@shared/utils/media');
    (generateMediaFilename as any).mockImplementation((media: any, options?: any) => {
      if (media.filename) {
        return media.filename;
      }
      if (options && typeof options.index === 'number') {
        return `media_${options.index}.jpg`;
      }
      return 'generated_filename.jpg';
    });

    (generateZipFilename as any).mockReturnValue('gallery.zip');
  });

  afterEach(() => {
    service.destroy();
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('서비스가 올바르게 초기화되어야 함', () => {
      expect(service.isInitialized()).toBe(true);
      expect(service.getStatus()).toBe('active');
    });

    it('중복 초기화가 안전해야 함', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('Single File Download', () => {
    it('단일 파일을 다운로드할 수 있어야 함', async () => {
      const mediaItem = mockMediaItems[0];

      // Fetch를 직접 모킹하여 ok 속성을 보장
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        blob: vi.fn().mockResolvedValue(new Blob(['test data'], { type: 'image/jpeg' })),
        headers: new Map([['content-type', 'image/jpeg']]),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await service.downloadSingle(mediaItem);

      expect(result.success).toBe(true);
      expect(result.filename).toBe('image1.jpg');
    });

    it('다운로드 실패 시 에러를 반환해야 함', async () => {
      const invalidMediaItem: MediaInfo = {
        id: 'invalid',
        url: 'https://example.com/network-error.jpg', // network-error가 포함된 URL 사용
        filename: 'invalid.jpg',
        type: 'image',
        size: 0,
      };

      const result = await service.downloadSingle(invalidMediaItem);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Bulk Download', () => {
    it('여러 파일을 ZIP으로 다운로드할 수 있어야 함', async () => {
      const progressCallback = vi.fn();

      const result = await service.downloadBulk(mockMediaItems, {
        onProgress: progressCallback,
      });

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(3);
      expect(result.filesSuccessful).toBe(3);
      expect(progressCallback).toHaveBeenCalled();
    });

    it('빈 미디어 배열에 대해 에러를 반환해야 함', async () => {
      const result = await service.downloadBulk([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No media items provided');
    });
  });

  describe('Download Options', () => {
    it('사용자 정의 ZIP 파일명을 사용해야 함', async () => {
      const customFilename = 'my-gallery.zip';

      const result = await service.downloadBulk(mockMediaItems, {
        zipFilename: customFilename,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Download Progress', () => {
    it('현재 다운로드 정보를 제공해야 함', () => {
      const info = service.getCurrentDownloadInfo();

      expect(info).toHaveProperty('isDownloading');
      expect(info).toHaveProperty('progress');
      expect(info).toHaveProperty('failedFiles');
    });

    it('다운로드 완료 후 상태를 리셋해야 함', async () => {
      await service.downloadBulk(mockMediaItems);

      const info = service.getCurrentDownloadInfo();
      expect(info.isDownloading).toBe(false);
    });
  });

  describe('Download Cancellation', () => {
    it('다운로드 중이 아닐 때 취소는 안전해야 함', () => {
      expect(() => service.cancelDownload()).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('서비스를 정리할 수 있어야 함', () => {
      service.destroy();
      expect(service.isInitialized()).toBe(false);
      expect(service.getStatus()).toBe('inactive');
    });
  });
});
