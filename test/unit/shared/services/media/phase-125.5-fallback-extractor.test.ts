/**
 * @fileoverview Phase 125.5: fallback-extractor.ts 테스트
 * @description 목표: 18.64% → 50% (+31.36%p)
 *
 * 테스트 전략:
 * - FallbackExtractor 클래스의 extract 메서드 검증
 * - 트윗 컨테이너 찾기 로직 검증
 * - FallbackStrategy 통합 검증
 * - 성공/실패 시나리오 모두 커버
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FallbackExtractor } from '@shared/services/media/fallback-extractor';
import type { MediaExtractionOptions, TweetInfo } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';

// FallbackStrategy 모킹
vi.mock('@shared/services/media-extraction/strategies/fallback/fallback-strategy', () => {
  return {
    FallbackStrategy: vi.fn().mockImplementation(() => {
      return {
        name: 'mock-fallback-strategy',
        extract: vi.fn(),
      };
    }),
  };
});

describe('Phase 125.5: fallback-extractor.ts', () => {
  let extractor: FallbackExtractor;
  let mockElement: HTMLElement;
  let mockTweetContainer: HTMLElement;
  let mockStrategy: any;

  beforeEach(() => {
    // 모킹 초기화
    vi.clearAllMocks();

    // 목 DOM 요소 생성
    mockTweetContainer = document.createElement('article');
    mockTweetContainer.setAttribute('data-testid', 'tweet');

    mockElement = document.createElement('div');
    mockTweetContainer.appendChild(mockElement);
    document.body.appendChild(mockTweetContainer);

    // Extractor 생성 (내부 strategy는 모킹됨)
    extractor = new FallbackExtractor();
    // @ts-expect-error - private 필드 접근 (테스트 목적)
    mockStrategy = extractor.strategy;
  });

  afterEach(() => {
    // DOM 정리
    document.body.innerHTML = '';
  });

  describe('extract', () => {
    const defaultOptions: MediaExtractionOptions = {};
    const extractionId = 'test-extraction-id';
    const tweetInfo: TweetInfo = {
      tweetId: '123456789',
      authorHandle: '@testuser',
    };

    it('should successfully extract media using fallback strategy', async () => {
      // Strategy 모킹 설정
      const mockMediaItems = [
        {
          url: 'https://pbs.twimg.com/media/test1.jpg',
          type: 'image' as const,
          index: 0,
        },
        {
          url: 'https://pbs.twimg.com/media/test2.jpg',
          type: 'image' as const,
          index: 1,
        },
      ];

      mockStrategy.extract.mockResolvedValue({
        success: true,
        mediaItems: mockMediaItems,
        clickedIndex: 0,
        metadata: {},
      });

      const result = await extractor.extract(mockElement, defaultOptions, extractionId, tweetInfo);

      expect(result.success).toBe(true);
      expect(result.mediaItems).toEqual(mockMediaItems);
      expect(result.metadata.extractionId).toBe(extractionId);
      expect(result.metadata.sourceType).toBe('fallback');
      expect(result.metadata.strategy).toBe('mock-fallback-strategy');
      expect(mockStrategy.extract).toHaveBeenCalledWith(mockTweetContainer, mockElement, tweetInfo);
    });

    it('should return failure when tweet container is not found', async () => {
      // 트윗 컨테이너가 없는 요소
      const isolatedElement = document.createElement('div');
      document.body.appendChild(isolatedElement);

      const result = await extractor.extract(
        isolatedElement,
        defaultOptions,
        extractionId,
        tweetInfo
      );

      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.metadata.error).toBe('Tweet container not found');
      expect(result.metadata.sourceType).toBe('fallback');
      expect(result.metadata.strategy).toBe('fallback-failed');
      expect(mockStrategy.extract).not.toHaveBeenCalled();

      isolatedElement.remove();
    });

    it('should return failure when strategy extract returns no media', async () => {
      mockStrategy.extract.mockResolvedValue({
        success: true,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {},
      });

      const result = await extractor.extract(mockElement, defaultOptions, extractionId);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.metadata.error).toBe('Fallback strategy failed');
    });

    it('should return failure when strategy extract returns success false', async () => {
      mockStrategy.extract.mockResolvedValue({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {},
      });

      const result = await extractor.extract(mockElement, defaultOptions, extractionId);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.metadata.error).toBe('Fallback strategy failed');
    });

    it('should handle strategy extraction error gracefully', async () => {
      const errorMessage = 'Strategy extraction failed';
      mockStrategy.extract.mockRejectedValue(new Error(errorMessage));

      const warnSpy = vi.spyOn(logger, 'warn');

      const result = await extractor.extract(mockElement, defaultOptions, extractionId);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.metadata.error).toBe('Fallback strategy failed');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('통합 전략 실패'),
        expect.any(Error)
      );
    });

    it('should log info message on successful extraction', async () => {
      mockStrategy.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
        clickedIndex: 0,
        metadata: {},
      });

      const infoSpy = vi.spyOn(logger, 'info');

      await extractor.extract(mockElement, defaultOptions, extractionId);

      expect(infoSpy).toHaveBeenCalled();
      expect(infoSpy.mock.calls[0][0]).toContain(extractionId);
    });

    it('should log debug message on extraction start', async () => {
      mockStrategy.extract.mockResolvedValue({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {},
      });

      const debugSpy = vi.spyOn(logger, 'debug');

      await extractor.extract(mockElement, defaultOptions, extractionId);

      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('백업 추출 시작'));
    });

    it('should include extractedAt timestamp in metadata', async () => {
      mockStrategy.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
        clickedIndex: 0,
        metadata: {},
      });

      const beforeTime = Date.now();
      const result = await extractor.extract(mockElement, defaultOptions, extractionId);
      const afterTime = Date.now();

      expect(result.metadata.extractedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(result.metadata.extractedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('findTweetContainer', () => {
    it('should find tweet container with data-testid="tweet"', () => {
      const container = document.createElement('div');
      container.setAttribute('data-testid', 'tweet');
      const child = document.createElement('div');
      container.appendChild(child);
      document.body.appendChild(container);

      // Private 메서드 테스트를 위한 리플렉션
      // @ts-expect-error - private 메서드 접근
      const result = extractor.findTweetContainer(child);

      expect(result).toBe(container);

      container.remove();
    });

    it('should find tweet container with article tag', () => {
      const article = document.createElement('article');
      const child = document.createElement('div');
      article.appendChild(child);
      document.body.appendChild(article);

      // @ts-expect-error - private 메서드 접근
      const result = extractor.findTweetContainer(child);

      expect(result).toBe(article);

      article.remove();
    });

    it('should return null when no container is found', () => {
      const isolatedElement = document.createElement('div');
      document.body.appendChild(isolatedElement);

      // @ts-expect-error - private 메서드 접근
      const result = extractor.findTweetContainer(isolatedElement);

      expect(result).toBeNull();

      isolatedElement.remove();
    });
  });

  describe('createFailureResult', () => {
    it('should create failure result with error message', () => {
      const errorMessage = 'Test error message';

      // @ts-expect-error - private 메서드 접근
      const result = extractor.createFailureResult(errorMessage);

      expect(result.success).toBe(false);
      expect(result.mediaItems).toEqual([]);
      expect(result.clickedIndex).toBe(0);
      expect(result.metadata.sourceType).toBe('fallback');
      expect(result.metadata.strategy).toBe('fallback-failed');
      expect(result.metadata.error).toBe(errorMessage);
      expect(result.tweetInfo).toBeNull();
    });

    it('should include extractedAt timestamp', () => {
      const beforeTime = Date.now();
      // @ts-expect-error - private 메서드 접근
      const result = extractor.createFailureResult('error');
      const afterTime = Date.now();

      expect(result.metadata.extractedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(result.metadata.extractedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('integration scenarios', () => {
    it('should handle extraction without tweetInfo parameter', async () => {
      mockStrategy.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
        clickedIndex: 0,
        metadata: {},
      });

      const result = await extractor.extract(mockElement, {}, 'test-id');

      expect(result.success).toBe(true);
      expect(mockStrategy.extract).toHaveBeenCalledWith(mockTweetContainer, mockElement, undefined);
    });

    it('should pass through strategy metadata', async () => {
      const customMetadata = { customField: 'customValue' };
      mockStrategy.extract.mockResolvedValue({
        success: true,
        mediaItems: [{ url: 'test.jpg', type: 'image', index: 0 }],
        clickedIndex: 0,
        metadata: customMetadata,
      });

      const result = await extractor.extract(mockElement, {}, 'test-id');

      expect(result.metadata.customField).toBe('customValue');
      expect(result.metadata.sourceType).toBe('fallback');
    });
  });
});
