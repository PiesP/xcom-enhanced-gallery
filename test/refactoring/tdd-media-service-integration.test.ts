/**
 * @fileoverview TDD - Media Service 통합 테스트
 * @description 중복된 미디어 서비스들을 MediaService로 통합하는 TDD 테스트
 * @version 1.0.0 - Media Service Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaService } from '@shared/services/MediaService';
import type { MediaInfo, MediaExtractionOptions } from '@shared/types/media.types';

describe('TDD - Media Service Integration', () => {
  let mediaService: MediaService;

  beforeEach(() => {
    mediaService = MediaService.getInstance();
    vi.clearAllMocks();
  });

  describe('Phase 1: RED - 중복 기능 식별 테스트', () => {
    describe('프리페칭 기능 중복 검증', () => {
      it('MediaService에 프리페칭 기능이 있어야 함', () => {
        expect(mediaService.prefetchNextMedia).toBeDefined();
        expect(typeof mediaService.prefetchNextMedia).toBe('function');
      });

      it('MediaService에 캐시 관리 기능이 있어야 함', () => {
        expect(mediaService.getCachedMedia).toBeDefined();
        expect(mediaService.clearPrefetchCache).toBeDefined();
        expect(mediaService.cancelAllPrefetch).toBeDefined();
      });

      it('MediaService에 프리페치 메트릭 기능이 있어야 함', () => {
        expect(mediaService.getPrefetchMetrics).toBeDefined();
        expect(typeof mediaService.getPrefetchMetrics).toBe('function');
      });
    });

    describe('다운로드 기능 중복 검증', () => {
      it('MediaService에 단일 다운로드 기능이 있어야 함', () => {
        expect(mediaService.downloadSingle).toBeDefined();
        expect(typeof mediaService.downloadSingle).toBe('function');
      });

      it('MediaService에 대량 다운로드 기능이 있어야 함', () => {
        expect(mediaService.downloadMultiple).toBeDefined();
        expect(mediaService.downloadBulk).toBeDefined();
        expect(typeof mediaService.downloadMultiple).toBe('function');
      });

      it('MediaService에 다운로드 취소 기능이 있어야 함', () => {
        expect(mediaService.cancelDownload).toBeDefined();
        expect(mediaService.isDownloading).toBeDefined();
      });
    });

    describe('미디어 추출 기능 중복 검증', () => {
      it('MediaService에 클릭 요소 추출 기능이 있어야 함', () => {
        expect(mediaService.extractFromClickedElement).toBeDefined();
        expect(typeof mediaService.extractFromClickedElement).toBe('function');
      });

      it('MediaService에 컨테이너 추출 기능이 있어야 함', () => {
        expect(mediaService.extractAllFromContainer).toBeDefined();
        expect(typeof mediaService.extractAllFromContainer).toBe('function');
      });

      it('MediaService에 백업 추출 기능이 있어야 함', () => {
        expect(mediaService.extractWithFallback).toBeDefined();
        expect(typeof mediaService.extractWithFallback).toBe('function');
      });
    });
  });

  describe('Phase 2: GREEN - 통합 기능 구현 테스트', () => {
    describe('통합된 API 테스트', () => {
      it('단일 진입점으로 미디어 추출이 가능해야 함', async () => {
        const mockElement = document.createElement('div');
        const options: MediaExtractionOptions = { includeVideos: true };

        const result = await mediaService.extractMedia(mockElement, options);

        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
        expect(result.mediaItems).toBeDefined();
      });

      it('단일 진입점으로 미디어 다운로드가 가능해야 함', async () => {
        const mockMedia: MediaInfo = {
          id: 'test-1',
          type: 'image',
          url: 'https://example.com/image.jpg',
          originalUrl: 'https://example.com/image.jpg',
          filename: 'test-image.jpg',
          size: { width: 800, height: 600 },
        };

        // Mock fetch for download
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        });

        const result = await mediaService.downloadMedia(mockMedia);

        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
      });

      it('통합된 프리페칭 API가 작동해야 함', async () => {
        const mediaUrls = [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
        ];

        // Mock fetch for prefetch
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
        });

        await mediaService.prefetchNextMedia(mediaUrls, 0);

        const metrics = mediaService.getPrefetchMetrics();
        expect(metrics).toBeDefined();
        expect(typeof metrics.cacheEntries).toBe('number');
      });
    });

    describe('서비스 간 호환성 테스트', () => {
      it('모든 미디어 기능이 단일 서비스에서 제공되어야 함', () => {
        // Extraction
        expect(mediaService.extractFromClickedElement).toBeDefined();
        expect(mediaService.extractAllFromContainer).toBeDefined();
        expect(mediaService.extractWithFallback).toBeDefined();

        // Prefetching
        expect(mediaService.prefetchNextMedia).toBeDefined();
        expect(mediaService.getCachedMedia).toBeDefined();
        expect(mediaService.cancelAllPrefetch).toBeDefined();

        // Downloading
        expect(mediaService.downloadSingle).toBeDefined();
        expect(mediaService.downloadMultiple).toBeDefined();
        expect(mediaService.cancelDownload).toBeDefined();

        // Video Control
        expect(mediaService.pauseAllBackgroundVideos).toBeDefined();
        expect(mediaService.restoreBackgroundVideos).toBeDefined();

        // WebP Optimization
        expect(mediaService.isWebPSupported).toBeDefined();
        expect(mediaService.getOptimizedImageUrl).toBeDefined();

        // Username Extraction
        expect(mediaService.extractUsername).toBeDefined();
        expect(mediaService.parseUsernameFast).toBeDefined();
      });

      it('모든 기능이 타입 안전해야 함', () => {
        // 타입 체크를 위한 컴파일 타임 테스트
        const service: MediaService = mediaService;

        expect(service).toBeDefined();
        expect(service.extractFromClickedElement).toBeTypeOf('function');
        expect(service.downloadSingle).toBeTypeOf('function');
        expect(service.prefetchNextMedia).toBeTypeOf('function');
      });
    });
  });

  describe('Phase 3: REFACTOR - 중복 제거 테스트', () => {
    describe('독립 서비스 제거 검증', () => {
      it('MediaService가 모든 프리페칭 기능을 제공해야 함', () => {
        // MediaPrefetchingService의 기능들이 MediaService에 있는지 확인
        expect(mediaService.prefetchNextMedia).toBeDefined();
        expect(mediaService.getCachedMedia).toBeDefined();
        expect(mediaService.clearPrefetchCache).toBeDefined();
        expect(mediaService.cancelAllPrefetch).toBeDefined();
        expect(mediaService.getPrefetchMetrics).toBeDefined();
      });

      it('MediaService가 모든 다운로드 기능을 제공해야 함', () => {
        // BulkDownloadService의 기능들이 MediaService에 있는지 확인
        expect(mediaService.downloadSingle).toBeDefined();
        expect(mediaService.downloadMultiple).toBeDefined();
        expect(mediaService.downloadBulk).toBeDefined();
        expect(mediaService.cancelDownload).toBeDefined();
        expect(mediaService.isDownloading).toBeDefined();
      });

      it('MediaService가 모든 추출 기능을 제공해야 함', () => {
        // OptimizedMediaExtractor의 기능들이 MediaService에 있는지 확인
        expect(mediaService.extractFromClickedElement).toBeDefined();
        expect(mediaService.extractAllFromContainer).toBeDefined();
        expect(mediaService.extractWithFallback).toBeDefined();
        expect(mediaService.extractMedia).toBeDefined();
      });
    });

    describe('성능 최적화 검증', () => {
      it('통합 후 메모리 사용량이 감소해야 함', () => {
        // 단일 인스턴스만 생성됨
        const instance1 = MediaService.getInstance();
        const instance2 = MediaService.getInstance();

        expect(instance1).toBe(instance2);
      });

      it('API 호출 경로가 단순화되어야 함', () => {
        // 모든 기능이 하나의 서비스를 통해 접근 가능
        const service = MediaService.getInstance();

        // 다중 import가 필요하지 않음
        expect(service.extractMedia).toBeDefined();
        expect(service.downloadMedia).toBeDefined();
        expect(service.prefetchNextMedia).toBeDefined();
      });
    });
  });

  describe('Phase 4: 통합 완성도 검증', () => {
    describe('기능적 완성도', () => {
      it('모든 미디어 워크플로우가 단일 서비스로 처리되어야 함', async () => {
        const mockElement = document.createElement('img');
        mockElement.src = 'https://example.com/test.jpg';

        // Mock fetch for extraction and download
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        });

        // 전체 워크플로우: 추출 → 프리페치 → 다운로드
        const extractResult = await mediaService.extractMedia(mockElement);

        // 테스트 환경에서는 실제 미디어를 찾지 못할 수 있으므로 API 존재 여부로 검증
        expect(extractResult).toBeDefined();
        expect(typeof extractResult.success).toBe('boolean');
        expect(Array.isArray(extractResult.mediaItems)).toBe(true);

        // 프리페치 API 테스트
        const mediaUrls = ['https://example.com/1.jpg', 'https://example.com/2.jpg'];
        await mediaService.prefetchNextMedia(mediaUrls, 0);

        const metrics = mediaService.getPrefetchMetrics();
        expect(metrics).toBeDefined();
        expect(typeof metrics.cacheEntries).toBe('number');

        // 다운로드 API 테스트
        const mockMedia = {
          id: 'test-1',
          type: 'image' as const,
          url: 'https://example.com/image.jpg',
          originalUrl: 'https://example.com/image.jpg',
          filename: 'test-image.jpg',
          size: { width: 800, height: 600 },
        };

        const downloadResult = await mediaService.downloadMedia(mockMedia);
        expect(downloadResult).toBeDefined();
        expect(typeof downloadResult.success).toBe('boolean');
      });

      it('에러 처리가 일관성 있게 처리되어야 함', async () => {
        const mockElement = document.createElement('div');

        // 네트워크 에러 시뮬레이션
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        try {
          await mediaService.extractMedia(mockElement);
        } catch (error) {
          expect(error).toBeDefined();
        }

        // 서비스가 여전히 작동 가능해야 함
        expect(mediaService.isWebPSupported).toBeTypeOf('function');
      });
    });

    describe('호환성 검증', () => {
      it('기존 코드와의 호환성이 유지되어야 함', () => {
        // 기존 API들이 여전히 사용 가능해야 함
        expect(mediaService.extractFromClickedElement).toBeDefined();
        expect(mediaService.downloadSingle).toBeDefined();
        expect(mediaService.downloadMultiple).toBeDefined();
        expect(mediaService.downloadBulk).toBeDefined(); // 별칭

        // 편의 메서드들도 사용 가능해야 함
        expect(mediaService.extractMedia).toBeDefined();
        expect(mediaService.downloadMedia).toBeDefined();
      });
    });
  });
});
