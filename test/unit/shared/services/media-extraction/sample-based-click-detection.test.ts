/**
 * @file Sample-Based Click Media Extraction Test
 * @description 실제 X.com HTML 샘플을 토대로 미디어 클릭 추출 정확도 검증
 * @coverage 다중 미디어, 단일 미디어, Edge Case, Fallback 메커니즘
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/dom-direct-extractor';

// Mock extractors
vi.mock('@shared/services/media-extraction/extractors/tweet-info-extractor');
vi.mock('@shared/services/media-extraction/extractors/twitter-api-extractor');
vi.mock('@shared/services/media-extraction/extractors/dom-direct-extractor');

/**
 * 실제 X.com 샘플에서 추출한 미디어 URL들
 * Sample 1: 다중 미디어 트윗 (4개 이미지)
 * Sample 2: 단일 미디어 트윗
 */
const SAMPLE_TWEETS = {
  sample1_media1: {
    url: 'https://pbs.twimg.com/media/G32HHpGWoAAly7r.jpg',
    alt: 'Image 1',
    clickedIndex: 0,
  },
  sample1_media2: {
    url: 'https://pbs.twimg.com/media/G32NPv3WYAAmtHq.jpg',
    alt: 'Image 2',
    clickedIndex: 1,
  },
  sample1_media3: {
    url: 'https://pbs.twimg.com/media/G32VJkOW4AAVBVL.jpg',
    alt: 'Image 3',
    clickedIndex: 2,
  },
  sample1_media4: {
    url: 'https://pbs.twimg.com/media/G32VJkWWEAADOmr.jpg',
    alt: 'Image 4',
    clickedIndex: 3,
  },
  sample2_media: {
    url: 'https://pbs.twimg.com/media/single_image.jpg',
    alt: 'Single Image',
    clickedIndex: 0,
  },
};

describe('Sample-Based Click Media Extraction', () => {
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
    // Setup mock element
    mockElement = document.createElement('img');
    mockElement.src = SAMPLE_TWEETS.sample1_media1.url;
    document.body.appendChild(mockElement);

    // Setup extractor mocks
    mockTweetInfoExtractor = {
      extract: vi.fn(),
    };
    mockAPIExtractor = {
      extract: vi.fn(),
    };
    mockDOMExtractor = {
      extract: vi.fn(),
    };

    // Mock module references
    vi.mocked(TweetInfoExtractor).mockReturnValue(mockTweetInfoExtractor as any);
    vi.mocked(TwitterAPIExtractor).mockReturnValue(mockAPIExtractor as any);
    vi.mocked(DOMDirectExtractor).mockReturnValue(mockDOMExtractor as any);

    // Create service instance
    service = new MediaExtractionService(
      mockTweetInfoExtractor as any,
      mockAPIExtractor as any,
      mockDOMExtractor as any
    );
  });

  describe('Sample 1: Multi-Media Tweet (4 images)', () => {
    const allMediaUrls = [
      SAMPLE_TWEETS.sample1_media1.url,
      SAMPLE_TWEETS.sample1_media2.url,
      SAMPLE_TWEETS.sample1_media3.url,
      SAMPLE_TWEETS.sample1_media4.url,
    ];

    it('should correctly identify clicked index 0 (first media)', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_1',
        mediaUrls: allMediaUrls,
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 0,
        allMediaUrls,
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.clickedIndex).toBe(0);
      expect(result.value.mediaUrls).toContain(SAMPLE_TWEETS.sample1_media1.url);
    });

    it('should correctly identify clicked index 1 (second media)', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_1',
        mediaUrls: allMediaUrls,
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 1,
        allMediaUrls,
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.clickedIndex).toBe(1);
      expect(result.value.mediaUrls[1]).toBe(SAMPLE_TWEETS.sample1_media2.url);
    });

    it('should correctly identify clicked index 2 (third media)', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_1',
        mediaUrls: allMediaUrls,
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 2,
        allMediaUrls,
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.clickedIndex).toBe(2);
      expect(result.value.mediaUrls[2]).toBe(SAMPLE_TWEETS.sample1_media3.url);
    });

    it('should correctly identify clicked index 3 (fourth media)', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_1',
        mediaUrls: allMediaUrls,
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 3,
        allMediaUrls,
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.clickedIndex).toBe(3);
      expect(result.value.mediaUrls[3]).toBe(SAMPLE_TWEETS.sample1_media4.url);
    });

    it('should extract all 4 media URLs from multi-media tweet', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_1',
        mediaUrls: allMediaUrls,
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 0,
        allMediaUrls,
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.mediaUrls).toHaveLength(4);
      expect(result.value.mediaUrls).toEqual(allMediaUrls);
    });
  });

  describe('Sample 2: Single Media Tweet', () => {
    it('should extract single media from single-media tweet', async () => {
      // Setup
      const singleMediaUrl = SAMPLE_TWEETS.sample2_media.url;
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_2',
        mediaUrls: [singleMediaUrl],
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 0,
        allMediaUrls: [singleMediaUrl],
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.mediaUrls).toHaveLength(1);
      expect(result.value.mediaUrls[0]).toBe(singleMediaUrl);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL normalization with query strings', async () => {
      // Setup: Media URL with query string
      const urlWithQuery = 'https://pbs.twimg.com/media/G32HHpGWoAAly7r.jpg?format=jpg&name=large';
      const normalizedUrl = 'https://pbs.twimg.com/media/G32HHpGWoAAly7r.jpg';

      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_3',
        mediaUrls: [normalizedUrl],
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 0,
        allMediaUrls: [normalizedUrl],
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.mediaUrls[0]).toBe(normalizedUrl);
    });

    it('should fallback to DOM extraction when API fails', async () => {
      // Setup: API failure
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_4',
        mediaUrls: [SAMPLE_TWEETS.sample1_media1.url],
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockRejectedValue(new Error('API failed'));

      mockDOMExtractor.extract.mockResolvedValue({
        clickedIndex: 0,
        allMediaUrls: [SAMPLE_TWEETS.sample1_media1.url],
        source: 'dom-direct',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.mediaUrls[0]).toBe(SAMPLE_TWEETS.sample1_media1.url);
      expect(mockDOMExtractor.extract).toHaveBeenCalled();
    });
  });

  describe('Metadata Validation', () => {
    it('should include timestamp in extracted metadata', async () => {
      // Setup
      const timestamp = new Date().toISOString();
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_5',
        mediaUrls: [SAMPLE_TWEETS.sample1_media1.url],
        timestamp,
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 0,
        allMediaUrls: [SAMPLE_TWEETS.sample1_media1.url],
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.timestamp).toBe(timestamp);
    });

    it('should include source type in metadata', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue({
        tweetId: 'tweet_6',
        mediaUrls: [SAMPLE_TWEETS.sample1_media1.url],
        timestamp: new Date().toISOString(),
      });

      mockAPIExtractor.extract.mockResolvedValue({
        clickedIndex: 0,
        allMediaUrls: [SAMPLE_TWEETS.sample1_media1.url],
        source: 'twitter-api',
      });

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.sourceType).toBeDefined();
    });
  });
});
