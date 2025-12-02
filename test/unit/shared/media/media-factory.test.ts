import {
  resolveDimensionsFromApiMedia,
  createMediaInfoFromAPI,
  convertAPIMediaToMediaInfo,
} from '@shared/media/media-factory';
import { logger } from '@shared/logging';
import * as mediaUtils from '@shared/media/media-utils';
import type { TweetMediaEntry } from '@shared/services/media/types';
import type { TweetInfo } from '@shared/types/media.types';

// Mock dependencies
vi.mock('@shared/logging', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@shared/media/media-utils', () => ({
  toPositiveNumber: vi.fn(),
}));

describe('media-factory', () => {
  const mockTweetInfo: TweetInfo = {
    tweetId: '1234567890',
    username: 'testuser',
    tweetUrl: 'https://twitter.com/testuser/status/1234567890',
    extractionMethod: 'api',
    confidence: 1,
  };

  const mockApiMedia: TweetMediaEntry = {
    screen_name: 'mediauser',
    tweet_id: '1234567890',
    download_url: 'https://example.com/image.jpg',
    type: 'photo',
    typeOriginal: 'photo',
    index: 0,
    typeIndex: 0,
    typeIndexOriginal: 0,
    preview_url: 'https://example.com/preview.jpg',
    media_id: '111',
    media_key: '111',
    expanded_url: 'https://twitter.com/testuser/status/1234567890/photo/1',
    short_expanded_url: 'https://t.co/xyz',
    short_tweet_url: 'https://t.co/abc',
    tweet_text: 'Test tweet',
    original_width: 100,
    original_height: 200,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default behavior for toPositiveNumber
    vi.mocked(mediaUtils.toPositiveNumber).mockImplementation(val =>
      typeof val === 'number' && val > 0 ? val : null
    );
  });

  describe('resolveDimensionsFromApiMedia', () => {
    it('should return dimensions when width and height are valid', () => {
      const result = resolveDimensionsFromApiMedia(mockApiMedia);
      expect(result).toEqual({ width: 100, height: 200 });
      expect(mediaUtils.toPositiveNumber).toHaveBeenCalledWith(100);
      expect(mediaUtils.toPositiveNumber).toHaveBeenCalledWith(200);
    });

    it('should return null if width is invalid', () => {
      vi.mocked(mediaUtils.toPositiveNumber).mockImplementation(val =>
        val === 100 ? null : 200
      );
      const result = resolveDimensionsFromApiMedia(mockApiMedia);
      expect(result).toBeNull();
    });

    it('should return null if height is invalid', () => {
      vi.mocked(mediaUtils.toPositiveNumber).mockImplementation(val =>
        val === 200 ? null : 100
      );
      const result = resolveDimensionsFromApiMedia(mockApiMedia);
      expect(result).toBeNull();
    });
  });

  describe('createMediaInfoFromAPI', () => {
    it('should create MediaInfo for photo', () => {
      const result = createMediaInfoFromAPI(mockApiMedia, mockTweetInfo, 0);

      expect(result).toEqual({
        id: '1234567890_api_0',
        url: 'https://example.com/image.jpg',
        type: 'image',
        filename: '',
        tweetUsername: 'mediauser',
        tweetId: '1234567890',
        tweetUrl: 'https://twitter.com/testuser/status/1234567890',
        tweetText: 'Test tweet',
        tweetTextHTML: undefined,
        originalUrl: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/preview.jpg',
        alt: 'image 1',
        width: 100,
        height: 200,
        metadata: {
          apiIndex: 0,
          apiData: mockApiMedia,
          dimensions: { width: 100, height: 200 },
        },
      });
    });

    it('should create MediaInfo for video', () => {
      const videoMedia = { ...mockApiMedia, type: 'video' as const };
      const result = createMediaInfoFromAPI(videoMedia, mockTweetInfo, 1);

      expect(result).toMatchObject({
        type: 'video',
        alt: 'video 2',
        id: '1234567890_api_1',
      });
    });

    it('should use tweetInfo username if screen_name is missing', () => {
      const noScreenNameMedia = { ...mockApiMedia, screen_name: '' };
      const result = createMediaInfoFromAPI(noScreenNameMedia, mockTweetInfo, 0);

      expect(result?.tweetUsername).toBe('testuser');
    });

    it('should handle missing dimensions', () => {
      vi.mocked(mediaUtils.toPositiveNumber).mockReturnValue(null);
      const result = createMediaInfoFromAPI(mockApiMedia, mockTweetInfo, 0);

      expect(result).not.toBeNull();
      expect(result?.width).toBeUndefined();
      expect(result?.height).toBeUndefined();
      expect(result?.metadata?.dimensions).toBeUndefined();
    });

    it('should return null and log error on exception', () => {
      // Force an error by making property access fail (e.g. undefined apiMedia)
      // But TypeScript prevents passing undefined. We can cast.
      const result = createMediaInfoFromAPI(undefined as any, mockTweetInfo, 0);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create API MediaInfo:',
        expect.any(Error)
      );
    });
  });

  describe('convertAPIMediaToMediaInfo', () => {
    it('should convert array of media entries', async () => {
      const mediaList = [mockApiMedia, { ...mockApiMedia, index: 1 }];
      const result = await convertAPIMediaToMediaInfo(mediaList, mockTweetInfo);

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toContain('_api_0');
      expect(result[1]!.id).toContain('_api_1');
    });

    it('should skip null entries', async () => {
      // Simulate a sparse array or undefined entries if that's possible in runtime
      const mediaList = [mockApiMedia, undefined as any, mockApiMedia];
      const result = await convertAPIMediaToMediaInfo(mediaList, mockTweetInfo);

      expect(result).toHaveLength(2);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should skip failed conversions (null returns from createMediaInfoFromAPI)', async () => {
      // We can mock createMediaInfoFromAPI if we exported it, but since it's in the same file,
      // we can't easily mock it without rewiring.
      // Instead, we can pass an invalid media object that causes createMediaInfoFromAPI to return null.
      // However, createMediaInfoFromAPI catches errors and returns null.
      // So passing undefined as one of the items (if the array allows it) or an object that throws.

      // Let's try to make resolveDimensionsFromApiMedia throw, but that's mocked.
      // Let's just rely on the fact that `createMediaInfoFromAPI` returns null for invalid input.
      // But `convertAPIMediaToMediaInfo` checks `if (!apiMedia) continue;` before calling create.

      // If we want `createMediaInfoFromAPI` to return null, we can make it fail.
      // But we can't easily inject failure into `createMediaInfoFromAPI` from here without mocking it.
      // Since we are testing the module, we are testing the integration of these functions.

      // Let's try to construct a case where `createMediaInfoFromAPI` returns null.
      // It returns null on error.
      // We can mock `toPositiveNumber` to throw an error?
      vi.mocked(mediaUtils.toPositiveNumber).mockImplementationOnce(() => {
        throw new Error('Boom');
      });

      const result = await convertAPIMediaToMediaInfo([mockApiMedia], mockTweetInfo);
      expect(result).toHaveLength(0);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should not iterate beyond array bounds', async () => {
      const apiMedias = [mockApiMedia];
      let outOfBoundsAccess = false;

      const proxy = new Proxy(apiMedias, {
        get(target, prop) {
          if (typeof prop === 'string') {
            const index = Number(prop);
            if (Number.isInteger(index) && index >= target.length) {
              outOfBoundsAccess = true;
            }
          }
          return Reflect.get(target, prop);
        },
      });

      await convertAPIMediaToMediaInfo(proxy, mockTweetInfo);
      expect(outOfBoundsAccess).toBe(false);
    });
  });
});
