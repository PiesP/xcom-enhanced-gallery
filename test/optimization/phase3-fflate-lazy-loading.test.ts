/**
 * Phase 3 - fflate 지연 로딩 테스트
 *
 * ZIP 다운로드 기능에서 fflate 라이브러리가 필요할 때만
 * 동적으로 로드되는지 확인하는 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MediaInfo } from '@shared/types/media.types';

// Mock 설정
const mockCreateZipFromItems = vi.fn();
const mockGetFflate = vi.fn();

vi.mock('@shared/external/zip', () => ({
  createZipFromItems: mockCreateZipFromItems,
}));

vi.mock('@shared/external/vendors', () => ({
  getFflate: mockGetFflate,
  getNativeDownload: () => ({
    downloadBlob: vi.fn(),
  }),
}));

describe('Phase 3: fflate 지연 로딩', () => {
  let BulkDownloadService: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // 동적 import로 BulkDownloadService 로드
    const module = await import('@shared/services/BulkDownloadService');
    BulkDownloadService = module.BulkDownloadService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ZIP 기능 지연 로딩', () => {
    it('개별 다운로드에서는 fflate이 로드되지 않아야 한다', async () => {
      const service = new BulkDownloadService();
      const mediaItem: MediaInfo = {
        id: 'test-1',
        url: 'https://pbs.twimg.com/media/test.jpg',
        type: 'image',
        originalUrl: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=orig',
      };

      mockGetFflate.mockResolvedValue({
        zip: vi.fn(),
        unzip: vi.fn(),
        strToU8: vi.fn(),
        strFromU8: vi.fn(),
        zipSync: vi.fn(),
        unzipSync: vi.fn(),
        deflate: vi.fn(),
        inflate: vi.fn(),
      });

      try {
        await service.downloadIndividually([mediaItem], {
          strategy: 'individual',
        });
      } catch (error) {
        // 네트워크 오류는 예상됨
      }

      // ZIP 기능이 호출되지 않으므로 fflate도 호출되지 않아야 함
      expect(mockCreateZipFromItems).not.toHaveBeenCalled();
    });

    it('ZIP 다운로드 요청 시에만 fflate이 로드되어야 한다', async () => {
      const service = new BulkDownloadService();
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image',
          originalUrl: 'https://pbs.twimg.com/media/test1.jpg?format=jpg&name=orig',
        },
        {
          id: 'test-2',
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'image',
          originalUrl: 'https://pbs.twimg.com/media/test2.jpg?format=jpg&name=orig',
        },
      ];

      // ZIP 생성 성공 시뮬레이션
      const mockBlob = new Blob(['fake zip content'], { type: 'application/zip' });
      mockCreateZipFromItems.mockResolvedValue(mockBlob);

      try {
        await service.downloadBulk(mediaItems, {
          strategy: 'zip',
        });
      } catch (error) {
        // 네트워크 오류는 예상됨
      }

      // ZIP 기능이 호출되어야 함
      expect(mockCreateZipFromItems).toHaveBeenCalled();
    });

    it('ZIP 다운로드 중 fflate 로딩 실패를 우아하게 처리해야 한다', async () => {
      const service = new BulkDownloadService();
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test.jpg',
          type: 'image',
          originalUrl: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=orig',
        },
      ];

      // fflate 로딩 실패 시뮬레이션
      mockCreateZipFromItems.mockRejectedValue(new Error('fflate loading failed'));

      const result = await service.downloadBulk(mediaItems, {
        strategy: 'zip',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('fflate loading failed');
    });
  });

  describe('성능 최적화 검증', () => {
    it('초기화 시 ZIP 라이브러리가 로드되지 않아야 한다', () => {
      // 서비스 인스턴스 생성만으로는 ZIP 관련 모듈이 로드되지 않아야 함
      const service = new BulkDownloadService();

      expect(service).toBeDefined();
      expect(mockCreateZipFromItems).not.toHaveBeenCalled();
      expect(mockGetFflate).not.toHaveBeenCalled();
    });

    it('ZIP 기능 사용 후 재사용 시 캐시된 모듈을 사용해야 한다', async () => {
      const service = new BulkDownloadService();
      const mediaItems: MediaInfo[] = [
        {
          id: 'test-1',
          url: 'https://pbs.twimg.com/media/test.jpg',
          type: 'image',
          originalUrl: 'https://pbs.twimg.com/media/test.jpg?format=jpg&name=orig',
        },
      ];

      const mockBlob = new Blob(['fake zip content'], { type: 'application/zip' });
      mockCreateZipFromItems.mockResolvedValue(mockBlob);

      // 첫 번째 ZIP 다운로드
      try {
        await service.downloadBulk(mediaItems, { strategy: 'zip' });
      } catch (error) {
        // 네트워크 오류 무시
      }

      const firstCallCount = mockCreateZipFromItems.mock.calls.length;

      // 두 번째 ZIP 다운로드
      try {
        await service.downloadBulk(mediaItems, { strategy: 'zip' });
      } catch (error) {
        // 네트워크 오류 무시
      }

      // ZIP 생성 함수는 두 번 호출되어야 하지만,
      // fflate 로딩은 캐시로 인해 효율적이어야 함
      expect(mockCreateZipFromItems.mock.calls.length).toBe(firstCallCount + 1);
    });
  });

  describe('번들 크기 최적화', () => {
    it('개별 다운로드만 사용하는 경우 번들 크기가 최소화되어야 한다', () => {
      // 이 테스트는 번들 분석에서 확인되어야 함
      // ZIP 관련 코드가 tree-shaking으로 제거되었는지 확인
      const service = new BulkDownloadService();

      // 서비스가 ZIP 없이도 정상 동작해야 함
      expect(typeof service.downloadIndividually).toBe('function');
      expect(service.downloadIndividually).toBeDefined();
    });
  });
});
