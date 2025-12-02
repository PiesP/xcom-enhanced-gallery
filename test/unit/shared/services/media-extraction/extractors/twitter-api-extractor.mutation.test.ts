import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import { TwitterAPI } from '@shared/services/media/twitter-api-client';
import { convertAPIMediaToMediaInfo } from '@shared/media/media-factory';
import { determineClickedIndex } from '@shared/services/media-extraction/determine-clicked-index';
import { extractTweetTextHTMLFromClickedElement } from '@shared/utils/media/tweet-extractor';
import { logger } from '@shared/logging';
import type { TweetInfo, MediaExtractionOptions } from '@shared/types/media.types';
import type { TweetMediaEntry } from '@shared/services/media/types';

// Mock dependencies
vi.mock('@shared/services/media/twitter-api-client', () => ({
  TwitterAPI: {
    getTweetMedias: vi.fn(),
  },
}));

vi.mock('@shared/media/media-factory', () => ({
  convertAPIMediaToMediaInfo: vi.fn(),
}));

vi.mock('@shared/services/media-extraction/determine-clicked-index', () => ({
  determineClickedIndex: vi.fn(),
}));

vi.mock('@shared/utils/media/tweet-extractor', () => ({
  extractTweetTextHTMLFromClickedElement: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TwitterAPIExtractor', () => {
  let extractor: TwitterAPIExtractor;
  let mockTweetInfo: TweetInfo;
  let mockElement: HTMLElement;
  let mockOptions: MediaExtractionOptions;
  const mockExtractionId = 'test-extraction-id';

  beforeEach(() => {
    extractor = new TwitterAPIExtractor();
    mockTweetInfo = {
      tweetId: '1234567890',
      username: 'testuser',
      tweetUrl: 'https://twitter.com/testuser/status/1234567890',
      extractionMethod: 'api',
      confidence: 1,
    };
    mockElement = document.createElement('div');
    mockOptions = {};

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully extract media when API returns data', async () => {
    const mockApiMedias: TweetMediaEntry[] = [
      { id_str: 'media1', type: 'photo', media_url_https: 'http://example.com/1.jpg' } as any,
    ];
    const mockMediaItems = [
      { id: 'media1', type: 'photo', url: 'http://example.com/1.jpg' } as any,
    ];
    const mockTweetTextHTML = '<p>Tweet text</p>';
    const mockClickedIndex = 0;

    vi.mocked(TwitterAPI.getTweetMedias).mockResolvedValue(mockApiMedias);
    vi.mocked(extractTweetTextHTMLFromClickedElement).mockReturnValue(mockTweetTextHTML);
    vi.mocked(convertAPIMediaToMediaInfo).mockResolvedValue(mockMediaItems);
    vi.mocked(determineClickedIndex).mockReturnValue(mockClickedIndex);

    const result = await extractor.extract(
      mockTweetInfo,
      mockElement,
      mockOptions,
      mockExtractionId
    );

    expect(result.success).toBe(true);
    expect(result.mediaItems).toEqual(mockMediaItems);
    expect(result.clickedIndex).toBe(mockClickedIndex);
    expect(result.tweetInfo).toEqual(mockTweetInfo);
    expect(result.metadata?.sourceType).toBe('twitter-api');
    expect(result.metadata?.apiMediaCount).toBe(1);

    expect(TwitterAPI.getTweetMedias).toHaveBeenCalledWith(mockTweetInfo.tweetId);
    expect(extractTweetTextHTMLFromClickedElement).toHaveBeenCalledWith(mockElement);
    expect(convertAPIMediaToMediaInfo).toHaveBeenCalledWith(
      mockApiMedias,
      mockTweetInfo,
      mockTweetTextHTML
    );
    expect(determineClickedIndex).toHaveBeenCalledWith(mockElement, mockMediaItems);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Starting API extraction'),
      expect.any(Object)
    );
  });

  it('should return failure result when API returns null', async () => {
    vi.mocked(TwitterAPI.getTweetMedias).mockResolvedValue(null as any);

    const result = await extractor.extract(
      mockTweetInfo,
      mockElement,
      mockOptions,
      mockExtractionId
    );

    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
    expect(result.metadata?.error).toBe('No media found in API response');
    expect(result.tweetInfo).toBeNull();
  });

  it('should return failure result when API returns empty array', async () => {
    vi.mocked(TwitterAPI.getTweetMedias).mockResolvedValue([]);

    const result = await extractor.extract(
      mockTweetInfo,
      mockElement,
      mockOptions,
      mockExtractionId
    );

    expect(result.success).toBe(false);
    expect(result.mediaItems).toEqual([]);
    expect(result.metadata?.error).toBe('No media found in API response');
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error');
    vi.mocked(TwitterAPI.getTweetMedias).mockRejectedValue(error);

    const result = await extractor.extract(
      mockTweetInfo,
      mockElement,
      mockOptions,
      mockExtractionId
    );

    expect(result.success).toBe(false);
    expect(result.metadata?.error).toBe('API Error');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('API extraction failed'),
      error
    );
  });

  it('should handle non-Error objects thrown during extraction', async () => {
    const error = 'String Error';
    vi.mocked(TwitterAPI.getTweetMedias).mockRejectedValue(error);

    const result = await extractor.extract(
      mockTweetInfo,
      mockElement,
      mockOptions,
      mockExtractionId
    );

    expect(result.success).toBe(false);
    expect(result.metadata?.error).toBe('API extraction failed');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('API extraction failed'),
      error
    );
  });

  it('should handle errors during media conversion', async () => {
    const mockApiMedias: TweetMediaEntry[] = [{ id_str: 'media1' } as any];
    vi.mocked(TwitterAPI.getTweetMedias).mockResolvedValue(mockApiMedias);
    vi.mocked(convertAPIMediaToMediaInfo).mockRejectedValue(new Error('Conversion failed'));

    const result = await extractor.extract(
      mockTweetInfo,
      mockElement,
      mockOptions,
      mockExtractionId
    );

    expect(result.success).toBe(false);
    expect(result.metadata?.error).toBe('Conversion failed');
  });
});
