/**
 * @file Phase 125.5: media-extraction-service.ts 테스트
 * @description 3단계 추출 파이프라인 (TweetInfo → API → DOM Fallback) 테스트
 * @coverage 목표: 24.76% → 60%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/dom-direct-extractor';
import { ExtractionErrorCode } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';

// Extractor 모킹
vi.mock('@shared/services/media-extraction/extractors/tweet-info-extractor');
vi.mock('@shared/services/media-extraction/extractors/twitter-api-extractor');
vi.mock('@shared/services/media-extraction/extractors/dom-direct-extractor');

describe('Phase 125.5: media-extraction-service.ts', () => {
  let service: MediaExtractionService;
  let mockTweetInfoExtractor: {
    extract: Mock;
  };
  let mockAPIExtractor: {
    extract: Mock;
  };
  let mockDOMExtractor: {
    extract: Mock;
  };
  let mockElement: HTMLElement;

  beforeEach(() => {
    // DOM 설정
    mockElement = document.createElement('img');
    mockElement.src = 'https://pbs.twimg.com/media/test.jpg';
    document.body.appendChild(mockElement);

    // Extractor 모킹 설정
    mockTweetInfoExtractor = {
      extract: vi.fn(),
    };
    mockAPIExtractor = {
      extract: vi.fn(),
    };
    mockDOMExtractor = {
      extract: vi.fn(),
    };

    vi.mocked(TweetInfoExtractor).mockImplementation(() => mockTweetInfoExtractor as any);
    vi.mocked(TwitterAPIExtractor).mockImplementation(() => mockAPIExtractor as any);
    vi.mocked(DOMDirectExtractor).mockImplementation(() => mockDOMExtractor as any);

    // Logger 스파이 설정
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});

    service = new MediaExtractionService();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('extractFromClickedElement', () => {
    describe('성공 시나리오', () => {
      it('should successfully extract via API when tweet info is available', async () => {
        const mockTweetInfo = { tweetId: 'test-tweet-id', userId: 'user123' };
        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [
            { url: 'https://pbs.twimg.com/media/test1.jpg', type: 'image', index: 0 },
            { url: 'https://pbs.twimg.com/media/test2.jpg', type: 'image', index: 1 },
          ],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(true);
        expect(result.mediaItems).toHaveLength(2);
        expect(result.metadata.sourceType).toBe('api-first');
        expect(result.metadata.strategy).toBe('media-extraction');
        expect(result.tweetInfo).toEqual(mockTweetInfo);
        expect(mockTweetInfoExtractor.extract).toHaveBeenCalledWith(mockElement);
        expect(mockAPIExtractor.extract).toHaveBeenCalledWith(
          mockTweetInfo,
          mockElement,
          {},
          expect.stringContaining('simp_')
        );
        expect(mockDOMExtractor.extract).not.toHaveBeenCalled();
      });

      it('should fallback to DOM when API extraction fails', async () => {
        const mockTweetInfo = { tweetId: 'test-tweet-id', userId: 'user123' };
        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });
        mockDOMExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [{ url: 'https://pbs.twimg.com/media/dom.jpg', type: 'image', index: 0 }],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(true);
        expect(result.mediaItems).toHaveLength(1);
        expect(result.metadata.sourceType).toBe('dom-fallback');
        expect(mockAPIExtractor.extract).toHaveBeenCalled();
        expect(mockDOMExtractor.extract).toHaveBeenCalledWith(
          mockElement,
          {},
          expect.stringContaining('simp_'),
          mockTweetInfo
        );
      });

      it('should extract via DOM direct when no tweet info', async () => {
        mockTweetInfoExtractor.extract.mockResolvedValue(null);
        mockDOMExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [{ url: 'https://pbs.twimg.com/media/direct.jpg', type: 'image', index: 0 }],
          clickedIndex: 0,
          tweetInfo: null,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(true);
        expect(result.mediaItems).toHaveLength(1);
        expect(result.metadata.sourceType).toBe('dom-fallback');
        expect(mockTweetInfoExtractor.extract).toHaveBeenCalled();
        expect(mockAPIExtractor.extract).not.toHaveBeenCalled();
        expect(mockDOMExtractor.extract).toHaveBeenCalledWith(
          mockElement,
          {},
          expect.stringContaining('simp_')
        );
      });
    });

    describe('실패 시나리오', () => {
      it('should return failure when no tweet info and DOM direct fails', async () => {
        mockTweetInfoExtractor.extract.mockResolvedValue(null);
        mockDOMExtractor.extract.mockResolvedValue({
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          tweetInfo: null,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(false);
        expect(result.mediaItems).toHaveLength(0);
        expect(result.metadata.sourceType).toBe('dom-direct-failed');
        expect(result.metadata.error).toContain('트윗 정보 없음');
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].code).toBe(ExtractionErrorCode.NO_MEDIA_FOUND);
      });

      it('should return failure when API and DOM both fail', async () => {
        const mockTweetInfo = { tweetId: 'test-tweet-id', userId: 'user123' };
        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });
        mockDOMExtractor.extract.mockResolvedValue({
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(false);
        expect(result.mediaItems).toHaveLength(0);
        expect(result.metadata.sourceType).toBe('extraction-failed');
        expect(result.metadata.error).toContain('API 및 DOM 추출 모두 실패');
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].message).toContain('API 및 DOM 추출 모두 실패');
      });

      it('should handle extraction error gracefully', async () => {
        const testError = new Error('Test extraction error');
        mockTweetInfoExtractor.extract.mockRejectedValue(testError);

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(false);
        expect(result.mediaItems).toHaveLength(0);
        expect(result.metadata.sourceType).toBe('error');
        expect(result.metadata.error).toBe('Test extraction error');
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].code).toBe(ExtractionErrorCode.UNKNOWN_ERROR);
      });
    });

    describe('로깅', () => {
      it('should log info message on extraction start', async () => {
        mockTweetInfoExtractor.extract.mockResolvedValue(null);
        mockDOMExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
          clickedIndex: 0,
          tweetInfo: null,
        });

        const infoSpy = vi.spyOn(logger, 'info');
        await service.extractFromClickedElement(mockElement);

        expect(infoSpy).toHaveBeenCalled();
        expect(infoSpy.mock.calls[0][0]).toContain('추출 시작');
      });

      it('should log debug when no tweet info found', async () => {
        mockTweetInfoExtractor.extract.mockResolvedValue(null);
        mockDOMExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
          clickedIndex: 0,
          tweetInfo: null,
        });

        const debugSpy = vi.spyOn(logger, 'debug');
        await service.extractFromClickedElement(mockElement);

        expect(debugSpy).toHaveBeenCalled();
        const debugCalls = debugSpy.mock.calls.map(call => call[0]);
        expect(debugCalls.some(msg => msg.includes('트윗 정보 없음'))).toBe(true);
      });

      it('should log warn when API extraction fails', async () => {
        const mockTweetInfo = { tweetId: 'test-tweet-id', userId: 'user123' };
        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });
        mockDOMExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });

        const warnSpy = vi.spyOn(logger, 'warn');
        await service.extractFromClickedElement(mockElement);

        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls[0][0]).toContain('API 추출 실패');
      });

      it('should log error on extraction failure', async () => {
        const testError = new Error('Test error');
        mockTweetInfoExtractor.extract.mockRejectedValue(testError);

        const errorSpy = vi.spyOn(logger, 'error');
        await service.extractFromClickedElement(mockElement);

        expect(errorSpy).toHaveBeenCalled();
        expect(errorSpy.mock.calls.some(call => call[0].includes('추출 실패'))).toBe(true);
      });
    });

    describe('메타데이터', () => {
      it('should include extractedAt timestamp in metadata', async () => {
        const beforeTime = Date.now();
        mockTweetInfoExtractor.extract.mockResolvedValue(null);
        mockDOMExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
          clickedIndex: 0,
          tweetInfo: null,
        });

        const result = await service.extractFromClickedElement(mockElement);
        const afterTime = Date.now();

        expect(result.metadata.extractedAt).toBeGreaterThanOrEqual(beforeTime);
        expect(result.metadata.extractedAt).toBeLessThanOrEqual(afterTime);
      });

      it('should include debug info when DOM direct fails', async () => {
        mockTweetInfoExtractor.extract.mockResolvedValue(null);
        mockDOMExtractor.extract.mockResolvedValue({
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          tweetInfo: null,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.metadata.debug).toBeDefined();
        expect(result.metadata.debug).toHaveProperty('element');
        expect(result.metadata.debug).toHaveProperty('domResult');
      });
    });
  });

  describe('extractAllFromContainer', () => {
    it('should find and extract first media in container', async () => {
      const container = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/container-test.jpg';
      container.appendChild(img);
      document.body.appendChild(container);

      mockTweetInfoExtractor.extract.mockResolvedValue(null);
      mockDOMExtractor.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: img.src, type: 'image', index: 0 }],
        clickedIndex: 0,
        tweetInfo: null,
      });

      const result = await service.extractAllFromContainer(container);

      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(mockTweetInfoExtractor.extract).toHaveBeenCalledWith(img);
    });

    it('should return failure when no media found in container', async () => {
      const container = document.createElement('div');
      container.innerHTML = '<span>No media here</span>';
      document.body.appendChild(container);

      const warnSpy = vi.spyOn(logger, 'warn');
      const result = await service.extractAllFromContainer(container);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toHaveLength(0);
      expect(result.metadata.sourceType).toBe('error');
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0][0]).toContain('미디어를 찾을 수 없음');
    });

    it('should handle container extraction error', async () => {
      const container = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';
      container.appendChild(img);
      document.body.appendChild(container);

      const testError = new Error('Container error');
      mockTweetInfoExtractor.extract.mockRejectedValue(testError);

      const result = await service.extractAllFromContainer(container);

      expect(result.success).toBe(false);
      expect(result.metadata.error).toBe('Container error');
    });

    it('should log debug on container extraction start', async () => {
      const container = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/test.jpg';
      container.appendChild(img);
      document.body.appendChild(container);

      mockTweetInfoExtractor.extract.mockResolvedValue(null);
      mockDOMExtractor.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: img.src, type: 'image', index: 0 }],
        clickedIndex: 0,
        tweetInfo: null,
      });

      const debugSpy = vi.spyOn(logger, 'debug');
      await service.extractAllFromContainer(container);

      expect(debugSpy).toHaveBeenCalled();
      const debugCalls = debugSpy.mock.calls.map(call => call[0]);
      expect(debugCalls.some(msg => msg.includes('컨테이너 추출 시작'))).toBe(true);
    });
  });

  describe('generateExtractionId', () => {
    it('should generate extraction ID with simp_ prefix', async () => {
      mockTweetInfoExtractor.extract.mockResolvedValue(null);
      mockDOMExtractor.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
        clickedIndex: 0,
        tweetInfo: null,
      });

      const infoSpy = vi.spyOn(logger, 'info');
      await service.extractFromClickedElement(mockElement);

      expect(infoSpy).toHaveBeenCalled();
      const extractionId = infoSpy.mock.calls[0][0].match(/\[MediaExtractor\] (simp_[^\s:]+)/)?.[1];
      expect(extractionId).toBeDefined();
      expect(extractionId).toMatch(/^simp_/);
    });

    it('should generate extraction ID with unique values', async () => {
      mockTweetInfoExtractor.extract.mockResolvedValue(null);
      mockDOMExtractor.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
        clickedIndex: 0,
        tweetInfo: null,
      });

      const infoSpy1 = vi.spyOn(logger, 'info');
      await service.extractFromClickedElement(mockElement);
      const extractionId1 = infoSpy1.mock.calls[0][0].match(
        /\[MediaExtractor\] (simp_[^\s:]+)/
      )?.[1];

      vi.clearAllMocks();

      const infoSpy2 = vi.spyOn(logger, 'info');
      await service.extractFromClickedElement(mockElement);
      const extractionId2 = infoSpy2.mock.calls[0][0].match(
        /\[MediaExtractor\] (simp_[^\s:]+)/
      )?.[1];

      expect(extractionId1).toBeDefined();
      expect(extractionId2).toBeDefined();
      expect(extractionId1).not.toBe(extractionId2);
    });
  });

  describe('createErrorResult', () => {
    it('should create error result with error message', async () => {
      const testError = new Error('Test error message');
      mockTweetInfoExtractor.extract.mockRejectedValue(testError);

      const result = await service.extractFromClickedElement(mockElement);

      expect(result.success).toBe(false);
      expect(result.metadata.error).toBe('Test error message');
      expect(result.errors![0].code).toBe(ExtractionErrorCode.UNKNOWN_ERROR);
      expect(result.errors![0].message).toContain('Test error message');
    });

    it('should handle non-Error objects gracefully', async () => {
      const testError = 'String error';
      mockTweetInfoExtractor.extract.mockRejectedValue(testError);

      const result = await service.extractFromClickedElement(mockElement);

      expect(result.success).toBe(false);
      expect(result.metadata.error).toBe('Unknown error');
      expect(result.errors![0].message).toContain('Unknown error');
    });

    it('should include extractedAt timestamp in error result', async () => {
      const beforeTime = Date.now();
      const testError = new Error('Test error');
      mockTweetInfoExtractor.extract.mockRejectedValue(testError);

      const result = await service.extractFromClickedElement(mockElement);
      const afterTime = Date.now();

      expect(result.metadata.extractedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(result.metadata.extractedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('통합 시나리오', () => {
    it('should pass options through extraction pipeline', async () => {
      const mockTweetInfo = { tweetId: 'test-tweet-id', userId: 'user123' };
      const options = { maxMedia: 5, includeVideos: true };

      mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
      mockAPIExtractor.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
        clickedIndex: 0,
        tweetInfo: mockTweetInfo,
      });

      await service.extractFromClickedElement(mockElement, options);

      expect(mockAPIExtractor.extract).toHaveBeenCalledWith(
        mockTweetInfo,
        mockElement,
        options,
        expect.any(String)
      );
    });

    it('should complete full 3-stage pipeline on complete failure', async () => {
      const mockTweetInfo = { tweetId: 'test-tweet-id', userId: 'user123' };
      mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
      mockAPIExtractor.extract.mockResolvedValue({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        tweetInfo: mockTweetInfo,
      });
      mockDOMExtractor.extract.mockResolvedValue({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        tweetInfo: mockTweetInfo,
      });

      await service.extractFromClickedElement(mockElement);

      // 모든 추출기가 호출되었는지 확인
      expect(mockTweetInfoExtractor.extract).toHaveBeenCalled();
      expect(mockAPIExtractor.extract).toHaveBeenCalled();
      expect(mockDOMExtractor.extract).toHaveBeenCalled();
    });

    /**
     * Phase 85.2: 다중 미디어 시나리오 테스트
     * 실제 환경에서 다중 미디어 트윗의 2번째/3번째 미디어 클릭 시
     * 올바른 인덱스가 계산되는지 검증
     */
    describe('다중 미디어 인덱스 계산', () => {
      it('should correctly calculate index for 2nd media in multi-media tweet (API success)', async () => {
        const mockTweetInfo = { tweetId: 'multi-tweet-id', userId: 'user123' };
        const multiMediaItems = [
          { url: 'https://pbs.twimg.com/media/img1.jpg', type: 'image', index: 0 },
          { url: 'https://pbs.twimg.com/media/img2.jpg', type: 'image', index: 1 },
          { url: 'https://pbs.twimg.com/media/img3.jpg', type: 'image', index: 2 },
        ];

        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: multiMediaItems,
          clickedIndex: 1, // ← 2번째 미디어 (인덱스 1)
          tweetInfo: mockTweetInfo,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(true);
        expect(result.mediaItems.length).toBe(3);
        expect(result.clickedIndex).toBe(1); // ← 2번째 미디어 인덱스 확인
      });

      it('should correctly calculate index for 3rd media with query string URL', async () => {
        const mockTweetInfo = { tweetId: 'multi-tweet-id', userId: 'user123' };
        const multiMediaItems = [
          { url: 'https://pbs.twimg.com/media/img1.jpg', type: 'image', index: 0 },
          { url: 'https://pbs.twimg.com/media/img2.jpg', type: 'image', index: 1 },
          { url: 'https://pbs.twimg.com/media/img3.jpg', type: 'image', index: 2 },
        ];

        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: multiMediaItems,
          clickedIndex: 2, // ← 3번째 미디어 (인덱스 2)
          tweetInfo: mockTweetInfo,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(true);
        expect(result.mediaItems.length).toBe(3);
        expect(result.clickedIndex).toBe(2); // ← 3번째 미디어 인덱스 확인
      });

      it('should handle API failure and fall back to DOM extraction for multi-media', async () => {
        const mockTweetInfo = { tweetId: 'multi-tweet-id', userId: 'user123' };
        const multiMediaItems = [
          { url: 'https://example.com/media1.jpg', type: 'image', index: 0 },
          { url: 'https://example.com/media2.jpg', type: 'image', index: 1 },
        ];

        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: false,
          mediaItems: [],
          clickedIndex: 0,
          tweetInfo: mockTweetInfo,
        });
        mockDOMExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: multiMediaItems,
          clickedIndex: 1, // ← DOM 폴백에서 계산한 인덱스
          tweetInfo: mockTweetInfo,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.success).toBe(true);
        expect(result.mediaItems.length).toBe(2);
        expect(result.clickedIndex).toBe(1); // ← DOM 폴백 인덱스 유지
        expect(mockDOMExtractor.extract).toHaveBeenCalled();
      });

      it('should preserve clicked index from API extraction', async () => {
        const mockTweetInfo = { tweetId: 'test-tweet-id', userId: 'user123' };
        const clickedIndex = 2;

        mockTweetInfoExtractor.extract.mockResolvedValue(mockTweetInfo);
        mockAPIExtractor.extract.mockResolvedValue({
          success: true,
          mediaItems: [
            { url: 'https://pbs.twimg.com/media/1.jpg', type: 'image', index: 0 },
            { url: 'https://pbs.twimg.com/media/2.jpg', type: 'image', index: 1 },
            { url: 'https://pbs.twimg.com/media/3.jpg', type: 'image', index: 2 },
          ],
          clickedIndex,
          tweetInfo: mockTweetInfo,
        });

        const result = await service.extractFromClickedElement(mockElement);

        expect(result.clickedIndex).toBe(clickedIndex);
      });
    });
  });
});
