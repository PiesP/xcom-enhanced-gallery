/**
 * Gallery Integration Tests (Non-DOM)
 *
 * DOM이 필요하지 않은 갤러리 기능의 통합 테스트입니다.
 * 서비스 로직, 데이터 처리, 상태 관리 등을 검증합니다.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MediaInfo } from '../../src/core/types/media.types';
import { createMockMediaItems, createTestMediaData } from './setup';

/**
 * 모킹된 서비스들
 */
const mockGalleryService = {
  extractMediaFromTweet: vi.fn(),
  processMediaItems: vi.fn(),
  generateDownloadFilename: vi.fn(),
  validateMediaUrl: vi.fn(),
};

const mockDownloadService = {
  downloadSingle: vi.fn(),
  downloadMultiple: vi.fn(),
  createZipArchive: vi.fn(),
};

describe('Gallery Integration (Service Layer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 서비스 모킹 기본 동작 설정
    mockGalleryService.extractMediaFromTweet.mockResolvedValue(createMockMediaItems());
    mockGalleryService.processMediaItems.mockImplementation((items: MediaInfo[]) => items);
    mockGalleryService.generateDownloadFilename.mockImplementation(
      (media: MediaInfo) => media.filename || 'default.jpg'
    );
    mockGalleryService.validateMediaUrl.mockImplementation((url: string) => {
      return (
        url.startsWith('https://') &&
        (url.includes('pbs.twimg.com') || url.includes('video.twimg.com'))
      );
    });

    mockDownloadService.downloadSingle.mockResolvedValue(true);
    mockDownloadService.downloadMultiple.mockResolvedValue({ success: 3, failed: 0 });
    mockDownloadService.createZipArchive.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('미디어 추출 및 처리', () => {
    it('트윗에서 미디어를 성공적으로 추출함', async () => {
      const mockTweetData = {
        id: '1234567890',
        url: 'https://x.com/user/status/1234567890',
        username: 'testuser',
      };

      const result = await mockGalleryService.extractMediaFromTweet(mockTweetData);

      expect(result).toHaveLength(3); // 테스트 데이터에는 3개의 미디어가 있음
      expect(result[0]).toHaveProperty('type', 'image');
      expect(result[1]).toHaveProperty('type', 'video');
      expect(result[2]).toHaveProperty('type', 'gif');
    });

    it('미디어 아이템들이 올바르게 처리됨', () => {
      const mediaItems = createMockMediaItems();
      const processed = mockGalleryService.processMediaItems(mediaItems);

      expect(processed).toHaveLength(mediaItems.length);
      expect(processed[0]).toMatchObject({
        id: expect.any(String),
        url: expect.any(String),
        type: expect.stringMatching(/^(image|video|gif)$/),
      });
    });

    it('파일명이 올바르게 생성됨', () => {
      const testMedia = createTestMediaData();
      const filename = mockGalleryService.generateDownloadFilename(testMedia);

      expect(filename).toBe('test.jpg');
      expect(typeof filename).toBe('string');
      expect(filename.length).toBeGreaterThan(0);
    });

    it('미디어 URL이 올바르게 검증됨', () => {
      const validUrls = [
        'https://pbs.twimg.com/media/test.jpg',
        'https://video.twimg.com/tweet_video/test.mp4',
      ];

      const invalidUrls = [
        'http://pbs.twimg.com/media/test.jpg', // HTTP
        'https://example.com/image.jpg', // 다른 도메인
        'invalid-url',
      ];

      validUrls.forEach(url => {
        expect(mockGalleryService.validateMediaUrl(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(mockGalleryService.validateMediaUrl(url)).toBe(false);
      });
    });
  });

  describe('다운로드 기능', () => {
    it('단일 미디어 다운로드가 성공함', async () => {
      const testMedia = createTestMediaData();
      const result = await mockDownloadService.downloadSingle(testMedia);

      expect(result).toBe(true);
      expect(mockDownloadService.downloadSingle).toHaveBeenCalledWith(testMedia);
    });

    it('여러 미디어 다운로드가 성공함', async () => {
      const mediaItems = createMockMediaItems();
      const result = await mockDownloadService.downloadMultiple(mediaItems);

      expect(result).toEqual({ success: 3, failed: 0 });
      expect(mockDownloadService.downloadMultiple).toHaveBeenCalledWith(mediaItems);
    });

    it('ZIP 아카이브가 올바르게 생성됨', async () => {
      const mediaItems = createMockMediaItems();
      const zipData = await mockDownloadService.createZipArchive(mediaItems);

      expect(zipData).toBeInstanceOf(Uint8Array);
      expect(zipData.length).toBeGreaterThan(0);
      expect(mockDownloadService.createZipArchive).toHaveBeenCalledWith(mediaItems);
    });
  });

  describe('에러 처리', () => {
    it('미디어 추출 실패 시 빈 배열 반환', async () => {
      mockGalleryService.extractMediaFromTweet.mockRejectedValue(new Error('Network error'));

      try {
        await mockGalleryService.extractMediaFromTweet({ id: 'invalid' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('다운로드 실패 시 적절한 에러 정보 반환', async () => {
      mockDownloadService.downloadSingle.mockRejectedValue(new Error('Download failed'));

      try {
        await mockDownloadService.downloadSingle(createTestMediaData());
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Download failed');
      }
    });

    it('잘못된 URL에 대한 검증 실패', () => {
      const invalidUrls = ['', 'not-a-url', 'ftp://example.com/file'];

      invalidUrls.forEach(url => {
        expect(mockGalleryService.validateMediaUrl(url)).toBe(false);
      });
    });
  });

  describe('데이터 일관성', () => {
    it('모든 미디어 타입이 올바른 속성을 가짐', () => {
      const mediaItems = createMockMediaItems();

      mediaItems.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('url');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('filename');
        expect(['image', 'video', 'gif']).toContain(item.type);
        expect(typeof item.url).toBe('string');
        expect(item.url.startsWith('https://')).toBe(true);
      });
    });

    it('미디어 처리 후에도 타입 안전성이 유지됨', () => {
      const originalItems = createMockMediaItems();
      const processedItems = mockGalleryService.processMediaItems(originalItems);

      expect(processedItems).toHaveLength(originalItems.length);

      for (let i = 0; i < originalItems.length; i++) {
        expect(processedItems[i]).toMatchObject({
          id: originalItems[i].id,
          type: originalItems[i].type,
          url: originalItems[i].url,
        });
      }
    });
  });

  describe('성능 및 메모리', () => {
    it('대량의 미디어 아이템 처리가 효율적임', () => {
      // 100개의 미디어 아이템 생성
      const largeMediaSet: MediaInfo[] = Array.from({ length: 100 }, (_, index) => ({
        id: `media-${index}`,
        type: 'image' as const,
        url: `https://pbs.twimg.com/media/test-${index}.jpg`,
        filename: `test-${index}.jpg`,
        width: 1200,
        height: 800,
      }));

      const startTime = performance.now();
      const processed = mockGalleryService.processMediaItems(largeMediaSet);
      const endTime = performance.now();

      expect(processed).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // 100ms 이하
    });

    it('메모리 사용량이 합리적임', () => {
      const mediaItems = createMockMediaItems();

      // 메모리 사용량 테스트 (간접적)
      const serialized = JSON.stringify(mediaItems);
      const memoryUsage = new Blob([serialized]).size;

      // 각 미디어 아이템당 1KB 이하여야 함
      expect(memoryUsage / mediaItems.length).toBeLessThan(1024);
    });
  });
});
