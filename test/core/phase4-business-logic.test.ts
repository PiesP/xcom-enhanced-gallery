/**
 * Phase 4: 핵심 비즈니스 로직 검증 및 최적화
 *
 * TDD 기반으로 미디어 추출의 핵심 알고리즘을 검증:
 * 1. URL 패턴 필터링
 * 2. 클릭된 인덱스 계산
 * 3. 신뢰도 점수 계산
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 모든 의존성 mock 처리
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
  },
}));

vi.mock('@shared/utils/media/MediaClickDetector', () => ({
  MediaClickDetector: {
    isProcessableMedia: vi.fn(() => true),
    getInstance: vi.fn(() => ({})),
  },
}));

vi.mock('@shared/dom', () => ({
  cachedQuerySelector: vi.fn(),
}));

vi.mock('@/constants', () => ({
  SELECTORS: {},
}));

describe('Phase 4: 핵심 비즈니스 로직 검증', () => {
  let mockContainer: Element;
  let mockTweetContainer: Element;

  beforeEach(() => {
    // Mock tweet container with article structure
    mockTweetContainer = {
      closest: vi.fn(selector => {
        if (selector === 'article' || selector === '[data-testid="tweet"]') {
          return mockTweetContainer;
        }
        return null;
      }),
      querySelector: vi.fn(() => ({
        href: 'https://x.com/user/status/1234567890',
      })),
      querySelectorAll: vi.fn(() => []),
    } as any;

    mockContainer = {
      querySelectorAll: vi.fn(() => []),
      closest: vi.fn(() => mockTweetContainer),
    } as any;

    const mockDocument = {
      querySelector: vi.fn(() => mockContainer),
      querySelectorAll: vi.fn(() => []),
      body: mockContainer,
    };

    vi.stubGlobal('document', mockDocument);
  });

  describe('Red: 실패하는 테스트 먼저 작성', () => {
    it('Twitter 미디어 URL 필터링 - 로컬 파일 제외 실패', async () => {
      const { OptimizedMediaExtractor } = await import(
        '../../../src/shared/services/OptimizedMediaExtractor'
      );
      const extractor = new OptimizedMediaExtractor();

      // 다양한 URL 패턴들
      const mockImages = [
        { src: 'https://pbs.twimg.com/media/valid_twitter_image.jpg' },
        { src: './bookmark_page_files/local_image.jpg' },
        { src: '../relative/photo.png' },
        { src: 'data/picture.gif' },
        { src: 'https://example.com/external_image.jpg' },
        { src: 'https://video.twimg.com/video.mp4' },
      ];

      mockContainer.querySelectorAll = vi.fn(() => mockImages);

      const results = await extractor.extractImagesFromDOM();

      // Twitter 미디어만 추출되어야 함 (2개)
      expect(results.length).toBe(2);
      expect(results).toContain('https://pbs.twimg.com/media/valid_twitter_image.jpg');
      expect(results).toContain('https://video.twimg.com/video.mp4');

      // 로컬/외부 파일들은 제외되어야 함
      expect(results).not.toContain('./bookmark_page_files/local_image.jpg');
      expect(results).not.toContain('../relative/photo.png');
      expect(results).not.toContain('data/picture.gif');
      expect(results).not.toContain('https://example.com/external_image.jpg');
    });

    it('미디어 추출 with 신뢰도 점수 계산', async () => {
      const { OptimizedMediaExtractor } = await import(
        '../../../src/shared/services/OptimizedMediaExtractor'
      );
      const extractor = new OptimizedMediaExtractor();

      // Mock DOM element for extraction
      const mockElement = {
        querySelector: vi.fn(() => ({
          src: 'https://pbs.twimg.com/media/clicked_image.jpg',
        })),
        closest: vi.fn(() => mockTweetContainer),
      } as any;

      const mockImages = [
        { src: 'https://pbs.twimg.com/media/image1.jpg' },
        { src: 'https://pbs.twimg.com/media/clicked_image.jpg' },
        { src: 'https://pbs.twimg.com/media/image3.jpg' },
      ];

      mockContainer.querySelectorAll = vi.fn(() => mockImages);

      const result = await extractor.extractMediaFromElement(mockElement);

      // 추출 성공해야 함
      expect(result.success).toBe(true);
      expect(result.mediaItems.length).toBe(3);

      // 클릭된 인덱스는 1이어야 함 (두 번째 이미지)
      expect(result.clickedIndex).toBe(1);

      // 트윗 정보 추출되어야 함
      expect(result.tweetInfo).toBeDefined();
      expect(result.tweetInfo?.tweetId).toBe('1234567890');
      expect(result.tweetInfo?.confidence).toBeGreaterThan(0.8);
    });

    it('빈 페이지에서 안전한 처리', async () => {
      const { OptimizedMediaExtractor } = await import(
        '../../../src/shared/services/OptimizedMediaExtractor'
      );
      const extractor = new OptimizedMediaExtractor();

      // 빈 컨테이너
      mockContainer.querySelectorAll = vi.fn(() => []);

      const mockElement = {
        querySelector: vi.fn(() => null),
        closest: vi.fn(() => null),
      } as any;

      const result = await extractor.extractMediaFromElement(mockElement);

      // 실패해야 하지만 에러는 발생하지 않아야 함
      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.clickedIndex).toBe(-1);
      expect(result.tweetInfo).toBeNull();
    });
  });

  describe('Green: 최소 구현으로 테스트 통과', () => {
    it('URL 패턴 검증 로직 테스트', async () => {
      const { OptimizedMediaExtractor } = await import(
        '../../../src/shared/services/OptimizedMediaExtractor'
      );

      // private 메서드 테스트를 위한 reflection
      const extractor = new OptimizedMediaExtractor();
      const isValidTwitterMediaUrl = (extractor as any).isValidTwitterMediaUrl.bind(extractor);

      // Valid Twitter URLs
      expect(isValidTwitterMediaUrl('https://pbs.twimg.com/media/image.jpg')).toBe(true);
      expect(isValidTwitterMediaUrl('https://video.twimg.com/video.mp4')).toBe(true);

      // Invalid URLs (로컬 파일들)
      expect(isValidTwitterMediaUrl('./bookmark_page_files/image.jpg')).toBe(false);
      expect(isValidTwitterMediaUrl('../relative/image.png')).toBe(false);
      expect(isValidTwitterMediaUrl('data/image.gif')).toBe(false);

      // Invalid URLs (외부 도메인)
      expect(isValidTwitterMediaUrl('https://example.com/image.jpg')).toBe(false);
    });

    it('클릭된 인덱스 계산 로직 테스트', async () => {
      const { OptimizedMediaExtractor } = await import(
        '../../../src/shared/services/OptimizedMediaExtractor'
      );

      const extractor = new OptimizedMediaExtractor();
      const calculateClickedIndex = (extractor as any).calculateClickedIndex.bind(extractor);

      // Mock clicked element
      const mockClickedElement = {
        querySelector: vi.fn(() => ({
          src: 'https://pbs.twimg.com/media/target_image.jpg',
        })),
        closest: vi.fn(() => ({
          src: 'https://pbs.twimg.com/media/target_image.jpg',
        })),
      } as any;

      // Mock media items
      const mediaItems = [
        { url: 'https://pbs.twimg.com/media/image1.jpg', type: 'image' },
        { url: 'https://pbs.twimg.com/media/target_image.jpg', type: 'image' },
        { url: 'https://pbs.twimg.com/media/image3.jpg', type: 'image' },
      ];

      const clickedIndex = calculateClickedIndex(mockClickedElement, mediaItems);

      // 클릭된 이미지의 인덱스 반환해야 함 (1)
      expect(clickedIndex).toBe(1);
    });
  });

  describe('Refactor: 성능 최적화 및 에러 처리', () => {
    it('대량 미디어 처리 성능 테스트', async () => {
      const { OptimizedMediaExtractor } = await import(
        '../../../src/shared/services/OptimizedMediaExtractor'
      );
      const extractor = new OptimizedMediaExtractor();

      // 100개의 미디어 아이템 생성
      const mockImages = Array.from({ length: 100 }, (_, i) => ({
        src: `https://pbs.twimg.com/media/image${i}.jpg`,
      }));

      mockContainer.querySelectorAll = vi.fn(() => mockImages);

      const startTime = performance.now();
      const results = await extractor.extractImagesFromDOM();
      const endTime = performance.now();

      // 성능 검증 (1초 이내)
      expect(endTime - startTime).toBeLessThan(1000);

      // 모든 이미지 추출되어야 함
      expect(results.length).toBe(100);
    });

    it('잘못된 URL 형식 처리', async () => {
      const { OptimizedMediaExtractor } = await import(
        '../../../src/shared/services/OptimizedMediaExtractor'
      );
      const extractor = new OptimizedMediaExtractor();

      const mockImages = [
        { src: 'https://pbs.twimg.com/media/valid.jpg' },
        { src: '' }, // 빈 URL
        { src: 'not-a-url' }, // 잘못된 형식
        { src: null }, // null 값
        { src: undefined }, // undefined 값
      ];

      mockContainer.querySelectorAll = vi.fn(() => mockImages);

      // 에러 없이 처리되어야 함
      expect(async () => {
        await extractor.extractImagesFromDOM();
      }).not.toThrow();

      const results = await extractor.extractImagesFromDOM();

      // 유효한 URL만 추출되어야 함
      expect(results.length).toBe(1);
      expect(results[0]).toBe('https://pbs.twimg.com/media/valid.jpg');
    });
  });
});
