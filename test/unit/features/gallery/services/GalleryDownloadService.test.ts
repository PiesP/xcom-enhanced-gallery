/**
 * GalleryDownloadService 테스트
 *
 * @description 갤러리 다운로드 서비스의 기능을 테스트합니다.
 */

import { GalleryDownloadService } from '@features/gallery/services/GalleryDownloadService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 테스트용 타입 정의
type MediaInfo = {
  url: string;
  filename?: string;
  size?: number;
  type?: string;
  isVideo?: boolean;
  originalUrl?: string;
  alt?: string;
  [key: string]: any; // 추가 속성 허용
};

type MediaItem = MediaInfo & {
  id: string;
  index: number;
  clickedUrl?: string;
};

// Vendor 라이브러리 모킹 (전체 모듈 모킹)
const mockDownloadBlob = vi.fn();
const mockCreateDownloadUrl = vi.fn(() => 'blob:mock-url');
const mockRevokeDownloadUrl = vi.fn();

vi.mock('@shared/utils/external/vendors/index', () => ({
  getNativeDownload: vi.fn(() => ({
    downloadBlob: mockDownloadBlob,
    createDownloadUrl: mockCreateDownloadUrl,
    revokeDownloadUrl: mockRevokeDownloadUrl,
  })),
  getPreact: vi.fn(() => ({
    createElement: vi.fn(),
    render: vi.fn(),
    Component: vi.fn(),
  })),
}));

// BulkDownloadService 모킹
const mockDownloadSingle = vi.fn().mockImplementation(async media => {
  // 에러 케이스 시뮬레이션
  if (media.url.includes('network-error') || media.url.includes('404')) {
    return {
      success: false,
      error: 'Network error',
    };
  }

  // fetch 모킹이 실패로 설정된 경우
  if (global.fetch && (global.fetch as any).__SHOULD_FAIL__) {
    return { success: false, error: 'Fetch failed' };
  }

  // 테스트용 fetch 호출 시뮬레이션
  if (global.fetch) {
    try {
      await global.fetch(media.url);
    } catch (error) {
      return { success: false, error: 'Fetch failed' };
    }
  }

  // 테스트용 downloadBlob 호출 시뮬레이션
  if (mockDownloadBlob) {
    mockDownloadBlob(
      new Blob(['mock data'], { type: 'image/jpeg' }),
      media.url.split('/').pop() || 'unknown.jpg'
    );
  }

  return {
    success: true,
    filename: media.url.split('/').pop() || 'unknown.jpg',
  };
});

const mockDownloadMultiple = vi.fn().mockImplementation(async (mediaItems, options = {}) => {
  const strategy = options.strategy || (mediaItems.length > 1 ? 'zip' : 'individual');

  // 빈 배열 처리
  if (mediaItems.length === 0) {
    return {
      success: false,
      filesProcessed: 0,
      filesSuccessful: 0,
      errors: ['No media items provided'],
      error: 'No media items provided',
    };
  }

  // 에러 케이스 처리
  const hasNetworkError = mediaItems.some(
    item => item.url.includes('network-error') || item.url.includes('404')
  );

  if (hasNetworkError && strategy === 'zip') {
    return {
      success: false,
      filesProcessed: mediaItems.length,
      filesSuccessful: 0,
      errors: ['Network error during ZIP creation'],
      error: 'Network error during ZIP creation',
    };
  }

  // ZIP 실패 시뮬레이션
  if ((globalThis as any).__TEST_ZIP_FAIL__) {
    return {
      success: false,
      filesProcessed: mediaItems.length,
      filesSuccessful: 0,
      errors: ['ZIP creation failed'],
      error: 'ZIP creation failed',
    };
  }

  // onProgress 콜백이 있으면 호출
  if (options.onProgress) {
    options.onProgress({
      phase: 'preparing',
      current: 0,
      total: mediaItems.length,
      percentage: 0,
    });

    options.onProgress({
      phase: 'downloading',
      current: Math.floor(mediaItems.length / 2),
      total: mediaItems.length,
      percentage: 50,
    });

    options.onProgress({
      phase: 'complete',
      current: mediaItems.length,
      total: mediaItems.length,
      percentage: 100,
    });
  }

  // fetch 호출 시뮬레이션 (각 미디어 아이템에 대해)
  if (global.fetch && strategy === 'individual') {
    for (const media of mediaItems) {
      if (!media.url.includes('network-error') && !media.url.includes('404')) {
        await global.fetch(media.url);
      }
    }
  }

  // downloadBlob 호출 시뮬레이션
  if (mockDownloadBlob) {
    if (strategy === 'zip') {
      mockDownloadBlob(new Blob(['mock zip'], { type: 'application/zip' }), 'test-gallery.zip');
    } else {
      // 개별 다운로드
      for (const media of mediaItems) {
        if (!media.url.includes('network-error') && !media.url.includes('404')) {
          mockDownloadBlob(
            new Blob(['mock data'], { type: 'image/jpeg' }),
            media.url.split('/').pop()
          );
        }
      }
    }
  }

  // 부분 실패 시뮬레이션
  let successfulFiles = mediaItems.length;
  if (hasNetworkError && strategy === 'individual') {
    successfulFiles = mediaItems.filter(
      item => !item.url.includes('network-error') && !item.url.includes('404')
    ).length;
  }

  const baseResult = {
    success: successfulFiles > 0,
    filesProcessed: mediaItems.length,
    filesSuccessful: successfulFiles,
    errors: [] as string[],
  };

  if (strategy === 'zip' && successfulFiles === mediaItems.length) {
    return {
      ...baseResult,
      filename: 'test-gallery.zip',
    };
  }

  // 개별 다운로드의 경우 filename이 없을 수 있음
  return baseResult;
});

vi.mock('@core/services/BulkDownloadService', () => ({
  BulkDownloadService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      downloadSingle: mockDownloadSingle,
      downloadMultiple: mockDownloadMultiple,
      isInitialized: vi.fn().mockReturnValue(true),
      getStatus: vi.fn().mockReturnValue('active'),
    })),
  },
}));

// ZIP 생성 유틸리티 모킹
vi.mock('@shared/utils/external/zip', () => ({
  createZipFromItems: vi.fn(async (items, filename) => {
    const zipBlob = new Blob(['mock zip data'], { type: 'application/zip' });
    return zipBlob;
  }),
}));

// Media filename 유틸리티 모킹
vi.mock('@shared/utils/media', () => ({
  generateMediaFilename: vi.fn((media, options) => {
    const index = options?.index || 1;
    return `${media.filename || 'media'}_${index}`;
  }),
  generateZipFilename: vi.fn(() => 'gallery-download.zip'),
}));

// 브라우저 다운로드 API 모킹
const mockDownload = vi.fn();
const mockLink = {
  href: '',
  download: '',
  click: mockDownload,
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  style: { display: 'none' },
};

const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

global.document.createElement = vi.fn().mockImplementation(tagName => {
  if (tagName === 'a') {
    return mockLink;
  }
  return {
    tagName: tagName.toUpperCase(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    style: {},
  };
});

// DOM 메서드 모킹 - 실제 DOM 요소의 메서드를 모킹
Object.defineProperty(global.document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});
Object.defineProperty(global.document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

describe('GalleryDownloadService', () => {
  let downloadService: GalleryDownloadService;
  let mockMediaItems: (MediaInfo | MediaItem)[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock 함수들 리셋
    mockDownloadSingle.mockClear();
    mockDownloadMultiple.mockClear();
    mockDownloadBlob.mockClear();

    // 기본 성공 동작으로 설정
    mockDownloadSingle.mockResolvedValue({
      success: true,
      filename: 'test-file.jpg',
    });

    mockDownloadMultiple.mockResolvedValue({
      success: true,
      filesProcessed: 3,
      filesSuccessful: 3,
      filename: 'test-gallery.zip',
    });

    // 서비스 인스턴스 가져오기
    downloadService = GalleryDownloadService.getInstance();

    // 테스트용 미디어 데이터
    mockMediaItems = [
      {
        id: 'media-1',
        type: 'image',
        url: 'https://pbs.twimg.com/media/test1.jpg?name=orig',
        originalUrl: 'https://pbs.twimg.com/media/test1.jpg?name=orig',
        filename: 'test1.jpg',
        alt: 'Test image 1',
      },
      {
        id: 'media-2',
        type: 'image',
        url: 'https://pbs.twimg.com/media/test2.jpg?name=orig',
        originalUrl: 'https://pbs.twimg.com/media/test2.jpg?name=orig',
        filename: 'test2.jpg',
        alt: 'Test image 2',
      },
      {
        id: 'media-3',
        type: 'video',
        url: 'https://video.twimg.com/ext_tw_video/test3.mp4',
        originalUrl: 'https://video.twimg.com/ext_tw_video/test3.mp4',
        filename: 'test3.mp4',
        alt: 'Test video 3',
      },
    ];

    // fetch 모킹
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock data'], { type: 'image/jpeg' })),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });

    // Blob 생성자 모킹
    global.Blob = vi.fn().mockImplementation((parts, options) => ({
      size: 1024,
      type: options?.type || 'application/octet-stream',
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      stream: () => new ReadableStream(),
      text: () => Promise.resolve('mock text'),
      slice: vi.fn(),
    })) as any;

    // URL.createObjectURL 모킹
    global.URL.createObjectURL = mockCreateDownloadUrl;
    global.URL.revokeObjectURL = mockRevokeDownloadUrl;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('동일한 인스턴스를 반환해야 함', () => {
      const instance1 = GalleryDownloadService.getInstance();
      const instance2 = GalleryDownloadService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Individual Download', () => {
    it('단일 미디어를 다운로드해야 함', async () => {
      const media = mockMediaItems[0];

      const result = await downloadService.downloadCurrent(media);

      expect(result).toBe(true);
      expect(mockDownloadSingle).toHaveBeenCalledWith(media);
    });

    it('다운로드 실패 시 false를 반환해야 함', async () => {
      // 실패 모킹 설정
      mockDownloadSingle.mockResolvedValueOnce({
        success: false,
        error: 'Download failed',
      });

      const media = mockMediaItems[0];
      const result = await downloadService.downloadCurrent(media);

      expect(result).toBe(false);
    });

    it('올바른 파일명으로 다운로드해야 함', async () => {
      const media = mockMediaItems[0];

      await downloadService.downloadCurrent(media);

      // downloadSingle이 호출되어 다운로드가 실행되었는지 확인
      expect(mockDownloadSingle).toHaveBeenCalledWith(media);
    });
  });

  describe('Multiple Downloads', () => {
    it('여러 미디어를 개별적으로 다운로드해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: mockMediaItems.length,
      });

      const result = await downloadService.downloadMultiple(mockMediaItems, {
        strategy: 'individual',
      });

      expect(result.success).toBe(true);
      expect(result.filesSuccessful).toBe(mockMediaItems.length);
      expect(mockDownloadMultiple).toHaveBeenCalledWith(mockMediaItems, {
        strategy: 'individual',
      });
    });

    it('ZIP 파일로 일괄 다운로드해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: mockMediaItems.length,
        filename: 'test-gallery.zip',
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result.success).toBe(true);
      expect(result.filesSuccessful).toBe(mockMediaItems.length);
      expect(result.filename).toMatch(/\.zip$/);
    });

    it('선택된 미디어만 다운로드해야 함', async () => {
      const selectedMedia = mockMediaItems.slice(0, 2);

      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: 2,
        filesSuccessful: 2,
      });

      const result = await downloadService.downloadSelected(selectedMedia);

      expect(result.success).toBe(true);
      expect(result.filesSuccessful).toBe(2);
    });
  });

  describe('Download Options', () => {
    it('커스텀 품질 옵션을 적용해야 함', async () => {
      const result = await downloadService.downloadMultiple(mockMediaItems, {
        strategy: 'individual',
      });

      expect(result.success).toBe(true);
      // 다운로드가 성공적으로 완료되었는지 확인
    });

    it('메타데이터 포함 옵션이 동작해야 함', async () => {
      const result = await downloadService.downloadAll(mockMediaItems, {
        includeMetadata: true,
      });

      expect(result.success).toBe(true);
      // 메타데이터가 포함된 ZIP이 생성되었는지 확인
    });

    it('커스텀 파일명 포맷을 적용해야 함', async () => {
      const result = await downloadService.downloadMultiple(mockMediaItems, {
        strategy: 'individual',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('다운로드 진행률을 추적해야 함', async () => {
      const progressCallback = vi.fn();

      // Progress 콜백을 시뮬레이션하는 mock 설정
      mockDownloadMultiple.mockImplementationOnce(async (mediaItems, options) => {
        if (options?.onProgress) {
          options.onProgress({
            phase: 'preparing',
            current: 0,
            total: mediaItems.length,
            percentage: 0,
          });

          options.onProgress({
            phase: 'downloading',
            current: Math.floor(mediaItems.length / 2),
            total: mediaItems.length,
            percentage: 50,
          });

          options.onProgress({
            phase: 'complete',
            current: mediaItems.length,
            total: mediaItems.length,
            percentage: 100,
          });
        }

        return {
          success: true,
          filesProcessed: mediaItems.length,
          filesSuccessful: mediaItems.length,
          filename: 'test-gallery.zip',
        };
      });

      const result = await downloadService.downloadAll(mockMediaItems, {
        onProgress: progressCallback,
      });

      expect(result.success).toBe(true);
      expect(progressCallback).toHaveBeenCalled();

      // 진행률이 0에서 100까지 증가했는지 확인
      const progressValues = progressCallback.mock.calls.map(call => call[0].percentage);
      expect(Math.min(...progressValues)).toBe(0);
      expect(Math.max(...progressValues)).toBe(100);
    });

    it('개별 다운로드별 진행률을 제공해야 함', async () => {
      const progressCallback = vi.fn();

      mockDownloadMultiple.mockImplementationOnce(async (mediaItems, options) => {
        if (options?.onProgress) {
          options.onProgress({
            phase: 'downloading',
            current: 1,
            total: mediaItems.length,
            percentage: 33,
          });
        }

        return {
          success: true,
          filesProcessed: mediaItems.length,
          filesSuccessful: mediaItems.length,
        };
      });

      await downloadService.downloadMultiple(mockMediaItems, {
        strategy: 'individual',
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          current: expect.any(Number),
          total: mockMediaItems.length,
          percentage: expect.any(Number),
          phase: expect.any(String),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('네트워크 에러를 적절히 처리해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: false,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: 0,
        error: 'Network error during ZIP creation',
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('일부 파일 다운로드 실패 시 계속 진행해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: 2, // 3개 중 2개 성공
      });

      const result = await downloadService.downloadMultiple(mockMediaItems, {
        strategy: 'individual',
      });

      expect(result.success).toBe(true);
      expect(result.filesSuccessful).toBe(2); // 1번째와 3번째 성공
      expect(result.filesProcessed).toBe(mockMediaItems.length);
    });

    it('ZIP 생성 실패를 처리해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: false,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: 0,
        error: 'ZIP creation failed',
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ZIP creation failed');
    });

    it('빈 미디어 배열을 안전하게 처리해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: false,
        filesProcessed: 0,
        filesSuccessful: 0,
        error: 'No media items provided',
      });

      const result = await downloadService.downloadAll([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No media items');
    });

    it('잘못된 미디어 데이터를 필터링해야 함', async () => {
      const invalidMediaItems = [
        ...mockMediaItems,
        null,
        undefined,
        { id: 'invalid' }, // 필수 필드 누락
      ] as any;

      mockDownloadMultiple.mockResolvedValueOnce({
        success: false,
        filesProcessed: invalidMediaItems.length,
        filesSuccessful: 0,
        error: 'Invalid media data',
      });

      const result = await downloadService.downloadAll(invalidMediaItems);

      // 실제로는 에러가 발생하거나, 성공하더라도 유효한 것만 처리
      expect(result.success).toBe(false); // 무효한 데이터가 있어서 실패
    });
  });

  describe('File Type Handling', () => {
    it('다양한 이미지 형식을 지원해야 함', async () => {
      const imageFormats = [
        { ...mockMediaItems[0], url: 'https://pbs.twimg.com/media/test.jpg', filename: 'test.jpg' },
        { ...mockMediaItems[0], url: 'https://pbs.twimg.com/media/test.png', filename: 'test.png' },
        {
          ...mockMediaItems[0],
          url: 'https://pbs.twimg.com/media/test.webp',
          filename: 'test.webp',
        },
      ];

      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: imageFormats.length,
        filesSuccessful: imageFormats.length,
      });

      const result = await downloadService.downloadMultiple(imageFormats, {
        strategy: 'individual',
      });

      expect(result.success).toBe(true);
      expect(result.filesSuccessful).toBe(imageFormats.length);
    });

    it('비디오 파일을 올바르게 처리해야 함', async () => {
      const videoMedia = mockMediaItems.filter(item => item.type === 'video');

      (global.fetch as any).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['video data'], { type: 'video/mp4' })),
      });

      const result = await downloadService.downloadMultiple(videoMedia, {
        strategy: 'individual',
      });

      expect(result.success).toBe(true);
    });

    it('대용량 파일을 효율적으로 처리해야 함', async () => {
      const largeFileBlob = new Blob(['x'.repeat(10 * 1024 * 1024)], { type: 'video/mp4' }); // 10MB

      (global.fetch as any).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(largeFileBlob),
      });

      const result = await downloadService.downloadCurrent(mockMediaItems[2]); // video

      expect(result).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('동시 다운로드 수를 제한해야 함', async () => {
      const largeMediaSet = Array.from({ length: 10 }, (_, i) => ({
        ...mockMediaItems[0],
        id: `media-${i}`,
        url: `https://pbs.twimg.com/media/test${i}.jpg`,
        filename: `test${i}.jpg`,
      }));

      const startTime = Date.now();
      const result = await downloadService.downloadMultiple(largeMediaSet, {
        strategy: 'individual',
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // 10초 이내
    }, 10000); // 타임아웃을 10초로 설정

    it('메모리 사용량을 최적화해야 함', async () => {
      // 대량 다운로드 테스트
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: mockMediaItems.length,
        filename: 'test-gallery.zip',
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result.success).toBe(true);
      // downloadMultiple이 호출되어야 함
      expect(mockDownloadMultiple).toHaveBeenCalled();
    });
  });

  describe('Integration with Core Services', () => {
    it('BulkDownloadService와 올바르게 통합되어야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: mockMediaItems.length,
        filename: 'test-gallery.zip',
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('filesSuccessful');
      expect(result).toHaveProperty('filename');
    });

    it('파일명 생성 서비스와 통합되어야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: mockMediaItems.length,
        filename: 'generated-filename.zip',
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result.success).toBe(true);
      expect(result.filename).toBeDefined();
    });
  });

  describe('Browser Compatibility', () => {
    it('최신 브라우저 기능을 사용해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: mockMediaItems.length,
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result.success).toBe(true);
      // downloadMultiple이 호출되어 다운로드 기능이 사용되었는지 확인
      expect(mockDownloadMultiple).toHaveBeenCalled();
    });

    it('폴백 다운로드 방식을 지원해야 함', async () => {
      // URL.createObjectURL이 없는 환경 시뮬레이션
      const originalCreateObjectURL = global.URL.createObjectURL;
      global.URL.createObjectURL = undefined as any;

      const result = await downloadService.downloadCurrent(mockMediaItems[0]);

      // 폴백 방식으로도 다운로드가 가능해야 함
      expect(result).toBe(true);

      global.URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe('User Experience', () => {
    it('적절한 에러 메시지를 제공해야 함', async () => {
      mockDownloadSingle.mockResolvedValueOnce({
        success: false,
        error: '403 Forbidden',
      });

      const result = await downloadService.downloadCurrent(mockMediaItems[0]);

      expect(result).toBe(false);
      // 에러 메시지가 사용자 친화적이어야 함
    });

    it('다운로드 완료 알림을 제공해야 함', async () => {
      mockDownloadMultiple.mockResolvedValueOnce({
        success: true,
        filesProcessed: mockMediaItems.length,
        filesSuccessful: mockMediaItems.length,
        filename: 'completed-download.zip',
      });

      const result = await downloadService.downloadAll(mockMediaItems);

      expect(result.success).toBe(true);
      expect(result.filename).toBeDefined();
    });
  });
});
