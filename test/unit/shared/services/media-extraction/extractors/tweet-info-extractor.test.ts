import { logger } from '@shared/logging';
import { TweetInfoExtractor } from '@shared/services/media-extraction/extractors/tweet-info-extractor';
import type { TweetInfo } from '@shared/types/media.types';

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TweetInfoExtractor', () => {
  let extractor: TweetInfoExtractor;

  beforeEach(() => {
    vi.clearAllMocks();
    extractor = new TweetInfoExtractor();
    document.body.innerHTML = '';
  });

  const getStrategies = (instance: TweetInfoExtractor) =>
    (instance as unknown as { strategies: Array<(element: HTMLElement) => TweetInfo | null> })
      .strategies;

  const getStrategyOrThrow = (
    instance: TweetInfoExtractor,
    index: number
  ): ((element: HTMLElement) => TweetInfo | null) => {
    const strategy = getStrategies(instance)[index];
    if (!strategy) {
      throw new Error(`Missing extraction strategy at index ${index}`);
    }
    return strategy;
  };

  describe('extract', () => {
    it('should extract from element dataset (Strategy 1)', async () => {
      const element = document.createElement('div');
      element.dataset.tweetId = '123456789';
      element.dataset.user = 'testuser';

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '123456789',
        username: 'testuser',
        tweetUrl: 'https://twitter.com/i/status/123456789',
        extractionMethod: 'element-attribute',
        confidence: 0.9,
      });
    });

    it('should extract from element href (Strategy 1)', async () => {
      const element = document.createElement('a');
      element.href = '/testuser/status/123456789';

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '123456789',
        username: 'testuser',
        tweetUrl: 'https://twitter.com/testuser/status/123456789',
        extractionMethod: 'element-href',
        confidence: 0.8,
      });
    });

    it('should preserve absolute tweet URLs without duplicating protocol handling', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', 'https://twitter.com/absolute/status/987654321');

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '987654321',
        username: 'absolute',
        tweetUrl: 'https://twitter.com/absolute/status/987654321',
        extractionMethod: 'element-href',
        confidence: 0.8,
      });
    });

    it('should normalize relative href paths when extracting from element links', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', '/relative_user/status/987654321');

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '987654321',
        username: 'relative_user',
        tweetUrl: 'https://twitter.com/relative_user/status/987654321',
        extractionMethod: 'element-href',
        confidence: 0.8,
      });
    });

    it('should extract from DOM structure (Strategy 2)', async () => {
      const container = document.createElement('article');
      container.dataset.testid = 'tweet';

      const link = document.createElement('a');
      link.href = '/testuser/status/123456789';
      container.appendChild(link);

      const element = document.createElement('div');
      container.appendChild(element);

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '123456789',
        username: 'testuser',
        tweetUrl: 'https://twitter.com/testuser/status/123456789',
        extractionMethod: 'dom-structure',
        confidence: 0.85,
        metadata: { containerTag: 'article' },
      });
    });

    it('should extract from media grid item (Strategy 3)', async () => {
      const link = document.createElement('a');
      link.href = '/testuser/status/123456789/photo/1';

      const element = document.createElement('img');
      link.appendChild(element);

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '123456789',
        username: 'testuser',
        tweetUrl: 'https://twitter.com/testuser/status/123456789/photo/1',
        extractionMethod: 'media-grid-item',
        confidence: 0.8,
      });
    });

    it('should return null if no strategy matches', async () => {
      const element = document.createElement('div');
      const result = await extractor.extract(element);
      expect(result).toBeNull();
    });

    it('should return null if tweetId is invalid', async () => {
      const element = document.createElement('div');
      element.dataset.tweetId = 'invalid';

      const result = await extractor.extract(element);
      expect(result).toBeNull();
    });

    it('should fallback to unknown username when /status path is nested deeper', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', '/nested/user/status/123456789');

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '123456789',
        username: 'unknown',
        tweetUrl: 'https://twitter.com/nested/user/status/123456789',
        extractionMethod: 'element-href',
        confidence: 0.8,
      });
    });

    it('should handle absolute URL parsing errors when extracting username', async () => {
      const element = document.createElement('a');
      element.setAttribute('href', 'https://%/user/status/123456789');

      const result = await extractor.extract(element);

      expect(result).toEqual({
        tweetId: '123456789',
        username: 'unknown',
        tweetUrl: 'https://%/user/status/123456789',
        extractionMethod: 'element-href',
        confidence: 0.8,
      });
    });

    it('should continue to next strategy when a strategy throws an error', async () => {
      const strategies = getStrategies(extractor);
      const snapshot = [...strategies];
      const throwingStrategy = () => {
        throw new Error('boom');
      };

      try {
        strategies.unshift(throwingStrategy);

        const element = document.createElement('div');
        element.dataset.tweetId = '999';

        const result = await extractor.extract(element);

        expect(result).toEqual({
          tweetId: '999',
          username: 'unknown',
          tweetUrl: 'https://twitter.com/i/status/999',
          extractionMethod: 'element-attribute',
          confidence: 0.9,
        });
      } finally {
        strategies.length = 0;
        snapshot.forEach(strategy => strategies.push(strategy));
      }
    });

    it('should skip invalid tweet info results from custom strategies', async () => {
      const strategies = getStrategies(extractor);
      const snapshot = [...strategies];
      const invalidStrategy = () => ({
        tweetId: 'unknown',
        username: 'bad-actor',
        tweetUrl: 'https://twitter.com/bad/status/0',
        extractionMethod: 'invalid',
        confidence: 0.1,
      });

      try {
        strategies.length = 0;
        strategies.push(invalidStrategy);

        const element = document.createElement('div');
        const result = await extractor.extract(element);

        expect(result).toBeNull();
        expect(logger.debug).not.toHaveBeenCalled();
      } finally {
        strategies.length = 0;
        snapshot.forEach(strategy => strategies.push(strategy));
      }
    });

    it('should reject tweetIds that contain non-digit characters from custom strategies', async () => {
      const strategies = getStrategies(extractor);
      const snapshot = [...strategies];
      const invalidStrategy = () => ({
        tweetId: '123abc',
        username: 'bad-actor',
        tweetUrl: 'https://twitter.com/bad/status/0',
        extractionMethod: 'invalid',
        confidence: 0.1,
      });

      try {
        strategies.length = 0;
        strategies.push(invalidStrategy);

        const element = document.createElement('div');
        await expect(extractor.extract(element)).resolves.toBeNull();
        expect(logger.debug).not.toHaveBeenCalled();
      } finally {
        strategies.length = 0;
        snapshot.forEach(strategy => strategies.push(strategy));
      }
    });

    it('should log tweetId details when extraction succeeds', async () => {
      const element = document.createElement('div');
      element.dataset.tweetId = '123123123';

      const result = await extractor.extract(element);

      expect(result?.tweetId).toBe('123123123');
      expect(logger.debug).toHaveBeenCalledWith(
        '[TweetInfoExtractor] Success: element-attribute',
        expect.objectContaining({ tweetId: '123123123' })
      );
    });

    describe('strategy guard rails', () => {
      it('Strategy 1 should ignore href values without /status/ path', () => {
        const elementStrategy = getStrategyOrThrow(extractor, 0);
        const link = document.createElement('a');
        link.setAttribute('href', '/testuser/updates/123456789');

        const result = elementStrategy(link);

        expect(result).toBeNull();
      });

      it.each([['123abc'], ['abc123']])(
        'Strategy 1 should reject dataset tweetIds containing letters (%s)',
        invalidId => {
          const elementStrategy = getStrategyOrThrow(extractor, 0);
          const element = document.createElement('div');
          element.dataset.tweetId = invalidId;

          const result = elementStrategy(element);

          expect(result).toBeNull();
        }
      );

      it('Strategy 2 should return null when tweet container link lacks href', () => {
        const domStrategy = getStrategyOrThrow(extractor, 1);
        const container = document.createElement('article');
        container.dataset.testid = 'tweet';

        const link = document.createElement('a');
        // Intentionally omit href to validate guard clause
        container.appendChild(link);

        const target = document.createElement('div');
        container.appendChild(target);
        document.body.appendChild(container);

        const result = domStrategy(target);

        expect(result).toBeNull();
      });

      it('Strategy 2 should return null when no tweet container ancestors exist', () => {
        const domStrategy = getStrategyOrThrow(extractor, 1);
        const orphan = document.createElement('div');
        document.body.appendChild(orphan);

        const result = domStrategy(orphan);

        expect(result).toBeNull();
      });

      it('Strategy 3 should return null when no ancestor link exists', () => {
        const mediaStrategy = getStrategyOrThrow(extractor, 2);
        const image = document.createElement('img');

        const result = mediaStrategy(image as HTMLImageElement);

        expect(result).toBeNull();
      });
    });
  });
});
