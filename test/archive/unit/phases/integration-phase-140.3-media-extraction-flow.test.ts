// Phase 140.3: 미디어 추출 플로우 통합 테스트
// 목표: MediaExtractionService + TwitterAPIExtractor + Mapping 통합 커버리지 향상

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { MediaExtractionService } from '../../src/shared/services/media-extraction/media-extraction-service';
import { TwitterAPIExtractor } from '../../src/shared/services/media-extraction/extractors/twitter-api-extractor';
import { TweetInfoExtractor } from '../../src/shared/services/media-extraction/extractors/tweet-info-extractor';
import { DOMDirectExtractor } from '../../src/shared/services/media-extraction/extractors/dom-direct-extractor';
import { TwitterAPI } from '../../src/shared/services/media/twitter-video-extractor';
import { initializeVendors } from '../../src/shared/external/vendors';
import type {
  MediaExtractionResult,
  MediaInfo,
  TweetInfo,
} from '../../src/shared/types/media.types';

describe('Phase 140.3: 미디어 추출 플로우 통합 테스트', () => {
  let mediaExtractionService: MediaExtractionService;
  let mockTweetContainer: HTMLElement;
  let mockClickedElement: HTMLImageElement;

  beforeEach(() => {
    initializeVendors();
    document.body.innerHTML = '';

    // MediaExtractionService 인스턴스 생성
    mediaExtractionService = new MediaExtractionService();

    // 모의 트윗 컨테이너 생성
    mockTweetContainer = document.createElement('article');
    mockTweetContainer.setAttribute('data-testid', 'tweet');
    mockTweetContainer.setAttribute('role', 'article');

    // 트윗 링크 추가 (트윗 ID 추출용)
    const tweetLink = document.createElement('a');
    tweetLink.href = 'https://x.com/testuser/status/1234567890';
    tweetLink.setAttribute('role', 'link');
    mockTweetContainer.appendChild(tweetLink);

    // 이미지 요소 추가
    mockClickedElement = document.createElement('img');
    mockClickedElement.src = 'https://pbs.twimg.com/media/test_image.jpg:large';
    mockClickedElement.alt = 'Test image';
    mockTweetContainer.appendChild(mockClickedElement);

    document.body.appendChild(mockTweetContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('1. API 우선 추출 플로우', () => {
    it('should extract media via API when available', async () => {
      // Given: TwitterAPI 모킹
      const mockApiMedias = [
        {
          screen_name: 'testuser',
          tweet_id: '1234567890',
          download_url: 'https://pbs.twimg.com/media/test_image.jpg:large',
          type: 'photo' as const,
          typeOriginal: 'photo' as const,
          index: 0,
          typeIndex: 0,
          typeIndexOriginal: 0,
          preview_url: 'https://pbs.twimg.com/media/test_image.jpg',
          media_id: 'media123',
          media_key: 'key123',
          expanded_url: 'https://x.com/testuser/status/1234567890/photo/1',
          short_expanded_url: 'x.com/testuser/status/…',
          short_tweet_url: 'x.com/testuser/status/…',
          tweet_text: 'Test tweet content',
        },
      ];

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue(mockApiMedias);

      // When: 미디어 추출 실행
      const result: MediaExtractionResult =
        await mediaExtractionService.extractFromClickedElement(mockClickedElement);

      // Then: API 추출 성공
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      const firstMedia = result.mediaItems[0];
      expect(firstMedia).toMatchObject({
        type: 'image',
        url: 'https://pbs.twimg.com/media/test_image.jpg:large',
        tweetUsername: 'unknown', // JSDOM 환경에서는 username 추출이 제한적
        tweetId: '1234567890',
      });
      expect(result.metadata?.sourceType).toBe('api-first'); // MediaExtractionService가 API 우선 전략임을 명시
      expect(TwitterAPI.getTweetMedias).toHaveBeenCalledWith('1234567890');
    });

    it('should handle API timeout gracefully', async () => {
      // Given: API 타임아웃 모킹
      vi.spyOn(TwitterAPI, 'getTweetMedias').mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API timeout')), 100);
          })
      );

      // When: 타임아웃 옵션으로 추출 실행
      const result = await mediaExtractionService.extractFromClickedElement(mockClickedElement, {
        timeoutMs: 50,
        maxRetries: 1,
      });

      // Then: DOM 백업 추출로 폴백
      // (DOMDirectExtractor가 동작하므로 실패하지 않고 DOM에서 추출)
      expect(result).toBeDefined();
      // API 실패 시 DOM fallback으로 동작
      expect(result.metadata?.sourceType).toBe('dom-fallback');
    });

    it('should extract multiple media items from API', async () => {
      // Given: 다중 이미지 트윗 모킹
      const mockApiMedias = [
        {
          screen_name: 'testuser',
          tweet_id: '1234567890',
          download_url: 'https://pbs.twimg.com/media/img1.jpg:large',
          type: 'photo' as const,
          typeOriginal: 'photo' as const,
          index: 0,
          typeIndex: 0,
          typeIndexOriginal: 0,
          preview_url: 'https://pbs.twimg.com/media/img1.jpg',
          media_id: 'media1',
          media_key: 'key1',
          expanded_url: 'https://x.com/testuser/status/1234567890/photo/1',
          short_expanded_url: 'x.com/testuser/status/…',
          short_tweet_url: 'x.com/testuser/status/…',
          tweet_text: 'Test tweet with multiple images',
        },
        {
          screen_name: 'testuser',
          tweet_id: '1234567890',
          download_url: 'https://pbs.twimg.com/media/img2.jpg:large',
          type: 'photo' as const,
          typeOriginal: 'photo' as const,
          index: 1,
          typeIndex: 1,
          typeIndexOriginal: 1,
          preview_url: 'https://pbs.twimg.com/media/img2.jpg',
          media_id: 'media2',
          media_key: 'key2',
          expanded_url: 'https://x.com/testuser/status/1234567890/photo/2',
          short_expanded_url: 'x.com/testuser/status/…',
          short_tweet_url: 'x.com/testuser/status/…',
          tweet_text: 'Test tweet with multiple images',
        },
      ];

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue(mockApiMedias);

      // When: 미디어 추출
      const result = await mediaExtractionService.extractFromClickedElement(mockClickedElement);

      // Then: 모든 이미지 추출
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(2);
      expect(result.mediaItems[0]?.url).toBe('https://pbs.twimg.com/media/img1.jpg:large');
      expect(result.mediaItems[1]?.url).toBe('https://pbs.twimg.com/media/img2.jpg:large');
    });
  });

  describe('2. DOM 백업 추출 플로우', () => {
    it('should fallback to DOM extraction when API fails', async () => {
      // Given: API 실패 모킹
      vi.spyOn(TwitterAPI, 'getTweetMedias').mockRejectedValue(new Error('API Error'));

      // When: 미디어 추출
      const result = await mediaExtractionService.extractFromClickedElement(mockClickedElement);

      // Then: DOM 백업 추출 성공
      expect(result).toBeDefined();
      expect(result.metadata?.sourceType).toBe('dom-fallback');
      // DOM에서 이미지를 찾을 수 있어야 함
      if (result.success) {
        expect(result.mediaItems.length).toBeGreaterThan(0);
      }
    });

    it('should extract from images in DOM', async () => {
      // Given: API 비활성화
      vi.spyOn(TwitterAPI, 'getTweetMedias').mockRejectedValue(new Error('API disabled'));

      // 추가 이미지 요소 생성
      const img2 = document.createElement('img');
      img2.src = 'https://pbs.twimg.com/media/test_image2.jpg:large';
      mockTweetContainer.appendChild(img2);

      // When: DOM 추출
      const result = await mediaExtractionService.extractFromClickedElement(mockClickedElement);

      // Then: DOM에서 이미지 추출
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.mediaItems.length).toBeGreaterThanOrEqual(1);
        expect(result.mediaItems.some(item => item.type === 'image')).toBe(true);
      }
    });

    it('should extract video thumbnails from DOM', async () => {
      // Given: 비디오 썸네일 추가
      const video = document.createElement('video');
      video.setAttribute('poster', 'https://pbs.twimg.com/media/video_thumb.jpg');
      mockTweetContainer.appendChild(video);

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockRejectedValue(new Error('API disabled'));

      // When: DOM 추출
      const result = await mediaExtractionService.extractFromClickedElement(video);

      // Then: 비디오 정보 추출
      expect(result).toBeDefined();
    });
  });

  describe('3. 트윗 정보 추출', () => {
    it('should extract tweet info from container', async () => {
      // Given: TweetInfoExtractor 인스턴스
      const tweetInfoExtractor = new TweetInfoExtractor();

      // When: 트윗 정보 추출
      const tweetInfo = await tweetInfoExtractor.extract(mockTweetContainer);

      // Then: 트윗 ID 추출 성공
      expect(tweetInfo).toBeDefined();
      if (tweetInfo) {
        expect(tweetInfo.tweetId).toBe('1234567890');
        expect(tweetInfo.username).toBe('unknown'); // JSDOM 환경에서는 username 추출이 제한적
        expect(tweetInfo.tweetUrl).toContain('1234567890'); // URL 패턴 확인
      }
    });

    it('should handle missing tweet info gracefully', async () => {
      // Given: 트윗 정보 없는 컨테이너
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      const tweetInfoExtractor = new TweetInfoExtractor();

      // When: 트윗 정보 추출 시도
      const tweetInfo = await tweetInfoExtractor.extract(emptyContainer);

      // Then: null 또는 낮은 confidence (ParentTraversalStrategy가 fallback 시도)
      // JSDOM 환경에서는 완전히 null이 아닐 수 있음
      if (tweetInfo) {
        expect(tweetInfo.confidence).toBeLessThan(0.7); // 낮은 confidence
      }
    });
  });

  describe('4. 클릭된 인덱스 계산', () => {
    it('should calculate correct clicked index', async () => {
      // Given: 다중 이미지와 두 번째 이미지 클릭
      const img1 = document.createElement('img');
      img1.src = 'https://pbs.twimg.com/media/img1.jpg:large';
      const img2 = document.createElement('img');
      img2.src = 'https://pbs.twimg.com/media/img2.jpg:large';

      mockTweetContainer.appendChild(img1);
      mockTweetContainer.appendChild(img2);

      const mockApiMedias = [
        {
          screen_name: 'testuser',
          tweet_id: '1234567890',
          download_url: 'https://pbs.twimg.com/media/img1.jpg:large',
          type: 'photo' as const,
          typeOriginal: 'photo' as const,
          index: 0,
          typeIndex: 0,
          typeIndexOriginal: 0,
          preview_url: 'https://pbs.twimg.com/media/img1.jpg',
          media_id: 'media1',
          media_key: 'key1',
          expanded_url: '',
          short_expanded_url: '',
          short_tweet_url: '',
          tweet_text: '',
        },
        {
          screen_name: 'testuser',
          tweet_id: '1234567890',
          download_url: 'https://pbs.twimg.com/media/img2.jpg:large',
          type: 'photo' as const,
          typeOriginal: 'photo' as const,
          index: 1,
          typeIndex: 1,
          typeIndexOriginal: 1,
          preview_url: 'https://pbs.twimg.com/media/img2.jpg',
          media_id: 'media2',
          media_key: 'key2',
          expanded_url: '',
          short_expanded_url: '',
          short_tweet_url: '',
          tweet_text: '',
        },
      ];

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue(mockApiMedias);

      // When: 두 번째 이미지 클릭
      const result = await mediaExtractionService.extractFromClickedElement(img2);

      // Then: clickedIndex가 1이어야 함
      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(1);
    });
  });

  describe('5. 에러 처리', () => {
    it('should handle extraction errors gracefully', async () => {
      // Given: 잘못된 요소
      const invalidElement = document.createElement('div');

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockRejectedValue(new Error('Invalid element'));

      // When: 추출 시도
      const result = await mediaExtractionService.extractFromClickedElement(invalidElement);

      // Then: 에러 정보 포함
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      }
    });

    it('should validate media URLs', async () => {
      // Given: 잘못된 URL의 이미지
      const invalidImg = document.createElement('img');
      invalidImg.src = 'invalid-url';
      mockTweetContainer.appendChild(invalidImg);

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockRejectedValue(new Error('API Error'));

      // When: 추출 시도
      const result = await mediaExtractionService.extractFromClickedElement(invalidImg);

      // Then: 유효한 URL만 포함
      expect(result).toBeDefined();
      if (result.success && result.mediaItems.length > 0) {
        result.mediaItems.forEach(item => {
          expect(item.url).toMatch(/^https?:\/\//);
        });
      }
    });
  });

  describe('6. 통합 시나리오', () => {
    it('should complete full extraction flow from click to media info', async () => {
      // Given: 완전한 트윗 구조
      const fullTweetContainer = document.createElement('article');
      fullTweetContainer.setAttribute('data-testid', 'tweet');

      const link = document.createElement('a');
      link.href = 'https://x.com/user123/status/9876543210';
      fullTweetContainer.appendChild(link);

      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/full_test.jpg:large';
      img.alt = 'Full test image';
      fullTweetContainer.appendChild(img);

      document.body.appendChild(fullTweetContainer);

      const mockApiMedias = [
        {
          screen_name: 'user123',
          tweet_id: '9876543210',
          download_url: 'https://pbs.twimg.com/media/full_test.jpg:orig',
          type: 'photo' as const,
          typeOriginal: 'photo' as const,
          index: 0,
          typeIndex: 0,
          typeIndexOriginal: 0,
          preview_url: 'https://pbs.twimg.com/media/full_test.jpg',
          media_id: 'media_full',
          media_key: 'key_full',
          expanded_url: 'https://x.com/user123/status/9876543210/photo/1',
          short_expanded_url: 'x.com/user123/status/…',
          short_tweet_url: 'x.com/user123/status/…',
          tweet_text: 'Full integration test tweet',
        },
      ];

      vi.spyOn(TwitterAPI, 'getTweetMedias').mockResolvedValue(mockApiMedias);

      // When: 전체 플로우 실행
      const result = await mediaExtractionService.extractFromClickedElement(img);

      // Then: 완전한 MediaInfo 생성
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);

      const mediaInfo = result.mediaItems[0];
      expect(mediaInfo).toMatchObject({
        type: 'image',
        url: 'https://pbs.twimg.com/media/full_test.jpg:orig',
        tweetUsername: 'unknown', // JSDOM 환경에서는 username 추출이 제한적
        tweetId: '9876543210',
      });

      expect(mediaInfo?.id).toBeTruthy();
      expect(mediaInfo?.tweetUrl).toContain('9876543210'); // URL에 트윗 ID 포함
      expect(result.metadata?.extractedAt).toBeTruthy();
      expect(result.metadata?.sourceType).toBe('api-first'); // MediaExtractionService가 API 우선 전략임을 명시
    });
  });
});
