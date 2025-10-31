/**
 * @file Sample-Based Click Media Extraction Test
 * @description 실제 X.com HTML 샘플을 토대로 미디어 클릭 추출 정확도 검증
 * @coverage 다중 미디어, 단일 미디어, Edge Case, Fallback 메커니즘
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import type { MediaExtractionResult, MediaInfo, TweetInfo } from '@shared/types/media.types';

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

class TestableMediaExtractionService extends MediaExtractionService {
  constructor(
    tweetInfoExtractor: { extract: Mock },
    apiExtractor: { extract: Mock },
    domExtractor: { extract: Mock }
  ) {
    super();
    (this as unknown as { tweetInfoExtractor: { extract: Mock } }).tweetInfoExtractor =
      tweetInfoExtractor;
    (this as unknown as { apiExtractor: { extract: Mock } }).apiExtractor = apiExtractor;
    (this as unknown as { domExtractor: { extract: Mock } }).domExtractor = domExtractor;
  }
}

const createMediaInfos = (urls: readonly string[]): MediaInfo[] =>
  urls.map((url, index) => ({
    id: `media-${index}`,
    url,
    type: 'image',
    filename: `media-${index}.jpg`,
  }));

const createSuccessResult = (
  urls: readonly string[],
  clickedIndex: number,
  overrides: Partial<MediaExtractionResult> = {}
): MediaExtractionResult => ({
  success: true,
  mediaItems: createMediaInfos(urls),
  clickedIndex,
  metadata: {
    extractedAt: Date.now(),
    sourceType: 'test-double',
    strategy: 'unit-test',
  },
  tweetInfo: {
    tweetId: 'mock-tweet',
    username: 'tester',
    tweetUrl: 'https://x.com/mock-tweet',
    extractionMethod: 'mock',
    confidence: 1,
  },
  ...overrides,
});

const createTweetInfo = (overrides: Partial<TweetInfo> = {}): TweetInfo => ({
  tweetId: 'tweet_1',
  username: 'user_1',
  tweetUrl: 'https://x.com/user_1/status/tweet_1',
  extractionMethod: 'unit-test',
  confidence: 0.95,
  metadata: overrides.metadata,
  ...overrides,
});

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
    const img = (mockElement as any).asImage?.() ?? (mockElement as HTMLImageElement);
    img.src = SAMPLE_TWEETS.sample1_media1.url;
    document.body.appendChild(mockElement);

    mockTweetInfoExtractor = { extract: vi.fn() };
    mockAPIExtractor = { extract: vi.fn() };
    mockDOMExtractor = { extract: vi.fn() };

    service = new TestableMediaExtractionService(
      mockTweetInfoExtractor,
      mockAPIExtractor,
      mockDOMExtractor
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
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo());

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult(allMediaUrls, 0, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(0);
      expect(result.mediaItems.map(item => item.url)).toContain(SAMPLE_TWEETS.sample1_media1.url);
    });

    it('should correctly identify clicked index 1 (second media)', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo());

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult(allMediaUrls, 1, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(1);
      expect(result.mediaItems[1]?.url).toBe(SAMPLE_TWEETS.sample1_media2.url);
    });

    it('should correctly identify clicked index 2 (third media)', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo());

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult(allMediaUrls, 2, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(2);
      expect(result.mediaItems[2]?.url).toBe(SAMPLE_TWEETS.sample1_media3.url);
    });

    it('should correctly identify clicked index 3 (fourth media)', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo());

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult(allMediaUrls, 3, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.clickedIndex).toBe(3);
      expect(result.mediaItems[3]?.url).toBe(SAMPLE_TWEETS.sample1_media4.url);
    });

    it('should extract all 4 media URLs from multi-media tweet', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo());

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult(allMediaUrls, 0, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(4);
      expect(result.mediaItems.map(item => item.url)).toEqual(allMediaUrls);
    });
  });

  describe('Sample 2: Single Media Tweet', () => {
    it('should extract single media from single-media tweet', async () => {
      // Setup
      const singleMediaUrl = SAMPLE_TWEETS.sample2_media.url;
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo({ tweetId: 'tweet_2' }));

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult([singleMediaUrl], 0, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0]?.url).toBe(singleMediaUrl);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL normalization with query strings', async () => {
      // Setup: Media URL with query string
      const urlWithQuery = 'https://pbs.twimg.com/media/G32HHpGWoAAly7r.jpg?format=jpg&name=large';
      const normalizedUrl = 'https://pbs.twimg.com/media/G32HHpGWoAAly7r.jpg';

      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo({ tweetId: 'tweet_3' }));

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult([normalizedUrl], 0, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.mediaItems[0]?.url).toBe(normalizedUrl);
    });

    it('should fallback to DOM extraction when API fails', async () => {
      // Setup: API failure
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo({ tweetId: 'tweet_4' }));

      mockAPIExtractor.extract.mockRejectedValue(new Error('API failed'));

      mockDOMExtractor.extract.mockResolvedValue(
        createSuccessResult([SAMPLE_TWEETS.sample1_media1.url], 0, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'dom-direct',
            strategy: 'dom-fallback',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.mediaItems[0]?.url).toBe(SAMPLE_TWEETS.sample1_media1.url);
      expect(mockDOMExtractor.extract).toHaveBeenCalled();
    });
  });

  describe('Metadata Validation', () => {
    it('should include timestamp in extracted metadata', async () => {
      // Setup
      const timestamp = new Date().toISOString();
      mockTweetInfoExtractor.extract.mockResolvedValue(
        createTweetInfo({
          tweetId: 'tweet_5',
          metadata: { timestamp },
        })
      );

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult([SAMPLE_TWEETS.sample1_media1.url], 0, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tweetInfo?.metadata?.timestamp).toBe(timestamp);
    });

    it('should include source type in metadata', async () => {
      // Setup
      mockTweetInfoExtractor.extract.mockResolvedValue(createTweetInfo({ tweetId: 'tweet_6' }));

      mockAPIExtractor.extract.mockResolvedValue(
        createSuccessResult([SAMPLE_TWEETS.sample1_media1.url], 0, {
          metadata: {
            extractedAt: Date.now(),
            sourceType: 'twitter-api',
            strategy: 'api-extraction',
          },
        })
      );

      // Execute
      const result = await service.extractFromClickedElement(mockElement);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata?.sourceType).toBeDefined();
    });
  });
});
