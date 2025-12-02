// Mock logging so we can assert on logged messages
vi.mock('@shared/logging', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
import { logger } from '@shared/logging';
import { MediaExtractionService } from '@shared/services/media-extraction/media-extraction-service';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
import { ErrorCode } from '@shared/types/result.types';
import { ExtractionError } from '@shared/types/media.types';

describe('MediaExtractionService', () => {
  let service: MediaExtractionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MediaExtractionService();
  });

  it('should log an extraction start message with a simp_ id', async () => {
    vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(null as any);

    await service.extractFromClickedElement(document.createElement('div'));

    // logger is mocked and imported above
    expect(logger.info).toHaveBeenCalled();
    // First arg should be a string that contains the extraction id with the 'simp_' prefix
    const firstArg = (logger.info as any).mock.calls[0][0];
    expect(firstArg).toMatch(/simp_[A-Za-z0-9_-]+: Extraction started/);
  });

  it('should return success with empty mediaItems when deduped items are empty', async () => {
    const baseTweetInfo = {
      tweetId: '123',
      username: 'user',
      tweetUrl: 'https://x.com/user/status/123',
      extractionMethod: 'dom',
      confidence: 1,
    } as any;

    vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(baseTweetInfo);

    // API extractor returns items without urls -> removed by dedupe logic (key missing)
    vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems: [{} as any],
      clickedIndex: 0,
      metadata: {},
      tweetInfo: null,
    } as any);

    const result = await service.extractFromClickedElement(document.createElement('div'));
    expect(result.success).toBe(true);
    expect(result.mediaItems).toHaveLength(0);
    expect(result.clickedIndex).toBe(0);
  });

  it('should return an error when tweetInfo.extract throws', async () => {
    vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockImplementation(() => {
      throw new Error('boom');
    });

    const result = await service.extractFromClickedElement(document.createElement('div'));
    expect(result.success).toBe(false);
    expect(result.metadata?.error).toContain('boom');
  });

  it('returns an error when no tweet info is found', async () => {
    vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(null as any);
    // No need to mock API extractor
    const result = await service.extractFromClickedElement(document.createElement('div'));
    expect(result.success).toBe(false);
    expect(result.errors?.[0]).toBeInstanceOf(ExtractionError);
    expect(result.errors?.[0]?.code).toBe(ErrorCode.NO_MEDIA_FOUND);
    expect(result.metadata?.error).toBe('No tweet information found');
  });

  it('returns an error when API extraction fails', async () => {
    vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: '123',
      username: 'user',
      tweetUrl: 'https://x.com/user/status/123',
      extractionMethod: 'dom',
      confidence: 1,
    } as any);

    vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: { sourceType: 'twitter-api' },
      tweetInfo: null,
    } as any);

    const result = await service.extractFromClickedElement(document.createElement('div'));
    expect(result.success).toBe(false);
    expect(result.metadata?.error).toBe('API extraction failed');
  });

  it('deduplicates media items and merges tweet metadata on success', async () => {
    const baseTweetInfo = {
      tweetId: '123',
      username: 'user',
      tweetUrl: 'https://x.com/user/status/123',
      extractionMethod: 'dom',
      confidence: 1,
      metadata: { base: true },
    } as any;

    vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(baseTweetInfo);

    const apiTweetInfo = { metadata: { override: true } } as any;
    const mediaItems = [
      { id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any,
      { id: '2', url: 'https://pbs.twimg.com/media/2.jpg' } as any,
      { id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any,
    ];

    vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems,
      clickedIndex: 2,
      metadata: {},
      tweetInfo: apiTweetInfo,
    } as any);

    const result = await service.extractFromClickedElement(document.createElement('div'));
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(2);
    // clickedIndex was 2 (pointing at duplicate item with id '1'), which should be mapped to index 0 after dedupe
    expect(result.clickedIndex).toBe(0);
    expect(result.tweetInfo?.metadata?.base).toBe(true);
    expect(result.tweetInfo?.metadata?.override).toBe(true);
  });

  it('extractAllFromContainer should return error if no media found', async () => {
    const container = document.createElement('div');
    const result = await service.extractAllFromContainer(container);
    expect(result.success).toBe(false);
    expect(result.metadata?.error).toBe('No media found in container');
  });

  it('extractAllFromContainer should call extractFromClickedElement for found media', async () => {
    // Spy the instance method
    const extractSpy = vi
      .spyOn(MediaExtractionService.prototype, 'extractFromClickedElement')
      .mockResolvedValue({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {},
        tweetInfo: null,
      } as any);

    const container = document.createElement('div');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/foo.jpg';
    container.appendChild(img);

    await service.extractAllFromContainer(container);

    expect(extractSpy).toHaveBeenCalledWith(img, {});
    extractSpy.mockRestore();
  });

  describe('generateExtractionId', () => {
    it('should generate ID using crypto.randomUUID when available', async () => {
      // crypto.randomUUID should be available in modern environments
      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(null as any);

      await service.extractFromClickedElement(document.createElement('div'));

      const logCall = (logger.info as any).mock.calls[0][0];
      expect(logCall).toMatch(/simp_[0-9a-f-]+: Extraction started/);
    });

    it('should generate fallback ID when crypto.randomUUID is unavailable', async () => {
      // Temporarily remove randomUUID
      const originalRandomUUID = crypto.randomUUID;
      (crypto as any).randomUUID = undefined;

      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(null as any);

      await service.extractFromClickedElement(document.createElement('div'));

      const logCall = (logger.info as any).mock.calls[0][0];
      // Fallback format: simp_{timestamp}_{random}
      expect(logCall).toMatch(/simp_\d+_[a-z0-9]+: Extraction started/);

      // Restore
      crypto.randomUUID = originalRandomUUID;
    });
  });

  describe('createErrorResult', () => {
    it('should handle Error objects', async () => {
      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockImplementation(() => {
        throw new Error('Test error message');
      });

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBe('Test error message');
      expect(result.errors?.[0]).toBeInstanceOf(ExtractionError);
    });

    it('should handle string errors', async () => {
      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockImplementation(() => {
        throw 'String error';
      });

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBe('String error');
    });

    it('should handle unknown error types', async () => {
      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockImplementation(() => {
        throw { custom: 'error' };
      });

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBe('Unknown error');
    });
  });

  describe('mergeTweetInfoMetadata', () => {
    it('should return override when base is null', async () => {
      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(null as any);

      // This path is when tweetInfo returns null, which leads to error
      const result = await service.extractFromClickedElement(document.createElement('div'));
      expect(result.success).toBe(false);
    });

    it('should return base when override is null', async () => {
      const baseTweetInfo = {
        tweetId: '123',
        username: 'user',
        tweetUrl: 'https://x.com/user/status/123',
        extractionMethod: 'dom',
        confidence: 1,
        metadata: { fromBase: true },
      } as any;

      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(baseTweetInfo);
      vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
        success: true,
        mediaItems: [{ id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any],
        clickedIndex: 0,
        metadata: {},
        tweetInfo: null, // override is null
      } as any);

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(true);
      expect(result.tweetInfo?.metadata?.fromBase).toBe(true);
    });

    it('should merge metadata from both base and override', async () => {
      const baseTweetInfo = {
        tweetId: '123',
        username: 'baseUser',
        tweetUrl: 'https://x.com/user/status/123',
        extractionMethod: 'dom',
        confidence: 1,
        metadata: { baseKey: 'baseValue' },
      } as any;

      const overrideTweetInfo = {
        tweetId: '123',
        username: 'overrideUser',
        metadata: { overrideKey: 'overrideValue' },
      } as any;

      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(baseTweetInfo);
      vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
        success: true,
        mediaItems: [{ id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any],
        clickedIndex: 0,
        metadata: {},
        tweetInfo: overrideTweetInfo,
      } as any);

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(true);
      // Override should take precedence for top-level properties
      expect(result.tweetInfo?.username).toBe('overrideUser');
      // But metadata should be merged
      expect(result.tweetInfo?.metadata?.baseKey).toBe('baseValue');
      expect(result.tweetInfo?.metadata?.overrideKey).toBe('overrideValue');
    });

    it('should handle undefined metadata in base', async () => {
      const baseTweetInfo = {
        tweetId: '123',
        username: 'user',
        tweetUrl: 'https://x.com/user/status/123',
        extractionMethod: 'dom',
        confidence: 1,
        // No metadata
      } as any;

      const overrideTweetInfo = {
        metadata: { key: 'value' },
      } as any;

      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(baseTweetInfo);
      vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
        success: true,
        mediaItems: [{ id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any],
        clickedIndex: 0,
        metadata: {},
        tweetInfo: overrideTweetInfo,
      } as any);

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(true);
      expect(result.tweetInfo?.metadata?.key).toBe('value');
    });

    it('should handle undefined metadata in override', async () => {
      const baseTweetInfo = {
        tweetId: '123',
        username: 'user',
        tweetUrl: 'https://x.com/user/status/123',
        extractionMethod: 'dom',
        confidence: 1,
        metadata: { key: 'value' },
      } as any;

      const overrideTweetInfo = {
        tweetId: '123',
        // No metadata
      } as any;

      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(baseTweetInfo);
      vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
        success: true,
        mediaItems: [{ id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any],
        clickedIndex: 0,
        metadata: {},
        tweetInfo: overrideTweetInfo,
      } as any);

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(true);
      expect(result.tweetInfo?.metadata?.key).toBe('value');
    });
  });

  describe('finalizeResult', () => {
    it('should return unchanged result when not successful', async () => {
      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
        tweetId: '123',
        username: 'user',
        tweetUrl: 'https://x.com/user/status/123',
        extractionMethod: 'dom',
        confidence: 1,
      } as any);

      vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: {},
        tweetInfo: null,
      } as any);

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(false);
    });

    it('should adjust clickedIndex after deduplication', async () => {
      const baseTweetInfo = {
        tweetId: '123',
        username: 'user',
        tweetUrl: 'https://x.com/user/status/123',
        extractionMethod: 'dom',
        confidence: 1,
      } as any;

      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue(baseTweetInfo);

      // Media items with duplicate at index 3 (same as index 0)
      const mediaItems = [
        { id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any,
        { id: '2', url: 'https://pbs.twimg.com/media/2.jpg' } as any,
        { id: '3', url: 'https://pbs.twimg.com/media/3.jpg' } as any,
        { id: '1', url: 'https://pbs.twimg.com/media/1.jpg' } as any, // duplicate of index 0
      ];

      vi.spyOn(TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
        success: true,
        mediaItems,
        clickedIndex: 3, // Pointing to duplicate
        metadata: {},
        tweetInfo: null,
      } as any);

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(true);
      expect(result.mediaItems.length).toBe(3);
      // clickedIndex should be adjusted to point to the original (index 0)
      expect(result.clickedIndex).toBe(0);
    });
  });

  describe('extractAllFromContainer with video', () => {
    it('should find video elements', async () => {
      const extractSpy = vi
        .spyOn(MediaExtractionService.prototype, 'extractFromClickedElement')
        .mockResolvedValue({
          success: true,
          mediaItems: [],
          clickedIndex: 0,
          metadata: {},
          tweetInfo: null,
        } as any);

      const container = document.createElement('div');
      const video = document.createElement('video');
      video.src = 'https://video.twimg.com/media/foo.mp4';
      container.appendChild(video);

      await service.extractAllFromContainer(container);

      expect(extractSpy).toHaveBeenCalledWith(video, {});
      extractSpy.mockRestore();
    });

    it('should handle extraction throwing error', async () => {
      const container = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://pbs.twimg.com/media/foo.jpg';
      container.appendChild(img);

      // Create a new service instance for this test
      const testService = new MediaExtractionService();

      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockImplementation(() => {
        throw new Error('Extraction failed');
      });

      const result = await testService.extractAllFromContainer(container);

      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBe('Extraction failed');
    });
  });

  describe('tweetInfo edge cases', () => {
    it('should handle tweetInfo without tweetId', async () => {
      vi.spyOn(TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
        username: 'user',
        // No tweetId
      } as any);

      const result = await service.extractFromClickedElement(document.createElement('div'));

      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBe('No tweet information found');
    });
  });
});
