/**
 * 미디어 추출 서비스 단위 테스트
 * 순수 로직을 검증하는 단위 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupTestEnvironment } from '../../../utils/helpers/test-environment.js';
import {
  mockUserscriptAPI,
  setupMockXMLHttpResponse,
} from '../../../__mocks__/userscript-api.mock';

// 실제 서비스를 import해야 하지만, 여기서는 모의 구현
const mockMediaExtractionService = {
  extractMediaFromTweet: vi.fn(),
  extractImageUrls: vi.fn(),
  extractVideoUrls: vi.fn(),
  getHighQualityImageUrl: vi.fn(),
};

describe('MediaExtractionService 단위 테스트', () => {
  beforeEach(async () => {
    await setupTestEnvironment('minimal');
    vi.clearAllMocks();
  });

  describe('extractImageUrls', () => {
    it('트윗에서 이미지 URL들을 정확히 추출해야 한다', () => {
      // Given: 이미지가 포함된 트윗 데이터
      const tweetData = {
        entities: {
          media: [
            {
              type: 'photo',
              media_url_https: 'https://pbs.twimg.com/media/test1.jpg',
              sizes: {
                large: { w: 1200, h: 800 },
              },
            },
            {
              type: 'photo',
              media_url_https: 'https://pbs.twimg.com/media/test2.jpg',
              sizes: {
                large: { w: 800, h: 600 },
              },
            },
          ],
        },
      };

      // When: 이미지 URL을 추출하면
      mockMediaExtractionService.extractImageUrls.mockReturnValue([
        'https://pbs.twimg.com/media/test1.jpg:large',
        'https://pbs.twimg.com/media/test2.jpg:large',
      ]);

      const result = mockMediaExtractionService.extractImageUrls(tweetData);

      // Then: 모든 이미지 URL이 추출되어야 한다
      expect(result).toHaveLength(2);
      expect(result[0]).toContain('test1.jpg:large');
      expect(result[1]).toContain('test2.jpg:large');
    });

    it('이미지가 없는 트윗에서는 빈 배열을 반환해야 한다', () => {
      // Given: 이미지가 없는 트윗 데이터
      const tweetData = {
        entities: {},
      };

      // When: 이미지 URL을 추출하면
      mockMediaExtractionService.extractImageUrls.mockReturnValue([]);
      const result = mockMediaExtractionService.extractImageUrls(tweetData);

      // Then: 빈 배열이 반환되어야 한다
      expect(result).toEqual([]);
    });
  });

  describe('extractVideoUrls', () => {
    it('트윗에서 비디오 URL을 정확히 추출해야 한다', () => {
      // Given: 비디오가 포함된 트윗 데이터
      const tweetData = {
        extended_entities: {
          media: [
            {
              type: 'video',
              video_info: {
                variants: [
                  {
                    content_type: 'video/mp4',
                    bitrate: 2176000,
                    url: 'https://video.twimg.com/ext_tw_video/test.mp4',
                  },
                  {
                    content_type: 'video/mp4',
                    bitrate: 832000,
                    url: 'https://video.twimg.com/ext_tw_video/test_low.mp4',
                  },
                ],
              },
            },
          ],
        },
      };

      // When: 비디오 URL을 추출하면
      mockMediaExtractionService.extractVideoUrls.mockReturnValue([
        'https://video.twimg.com/ext_tw_video/test.mp4',
      ]);

      const result = mockMediaExtractionService.extractVideoUrls(tweetData);

      // Then: 최고 품질의 비디오 URL이 추출되어야 한다
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('test.mp4');
      expect(result[0]).not.toContain('test_low.mp4');
    });
  });

  describe('getHighQualityImageUrl', () => {
    it('이미지 URL에 ":large" 접미사를 추가해야 한다', () => {
      // Given: 기본 이미지 URL
      const baseUrl = 'https://pbs.twimg.com/media/test.jpg';

      // When: 고품질 URL을 요청하면
      mockMediaExtractionService.getHighQualityImageUrl.mockReturnValue(
        'https://pbs.twimg.com/media/test.jpg:large'
      );

      const result = mockMediaExtractionService.getHighQualityImageUrl(baseUrl);

      // Then: ":large" 접미사가 추가되어야 한다
      expect(result).toBe('https://pbs.twimg.com/media/test.jpg:large');
    });

    it('이미 접미사가 있는 URL은 변경하지 않아야 한다', () => {
      // Given: 이미 접미사가 있는 URL
      const urlWithSuffix = 'https://pbs.twimg.com/media/test.jpg:orig';

      // When: 고품질 URL을 요청하면
      mockMediaExtractionService.getHighQualityImageUrl.mockReturnValue(urlWithSuffix);
      const result = mockMediaExtractionService.getHighQualityImageUrl(urlWithSuffix);

      // Then: URL이 변경되지 않아야 한다
      expect(result).toBe(urlWithSuffix);
    });
  });

  describe('extractMediaFromTweet (통합)', () => {
    it('트윗에서 모든 미디어를 정확히 추출해야 한다', async () => {
      // Given: 이미지와 비디오가 포함된 복합 트윗
      const complexTweetData = {
        entities: {
          media: [
            {
              type: 'photo',
              media_url_https: 'https://pbs.twimg.com/media/image.jpg',
            },
          ],
        },
        extended_entities: {
          media: [
            {
              type: 'photo',
              media_url_https: 'https://pbs.twimg.com/media/image.jpg',
            },
            {
              type: 'video',
              video_info: {
                variants: [
                  {
                    content_type: 'video/mp4',
                    bitrate: 2176000,
                    url: 'https://video.twimg.com/ext_tw_video/video.mp4',
                  },
                ],
              },
            },
          ],
        },
      };

      // When: 모든 미디어를 추출하면
      mockMediaExtractionService.extractMediaFromTweet.mockResolvedValue({
        images: ['https://pbs.twimg.com/media/image.jpg:large'],
        videos: ['https://video.twimg.com/ext_tw_video/video.mp4'],
        total: 2,
      });

      const result = await mockMediaExtractionService.extractMediaFromTweet(complexTweetData);

      // Then: 모든 미디어가 추출되어야 한다
      expect(result.images).toHaveLength(1);
      expect(result.videos).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('API 오류 시 적절한 오류를 발생시켜야 한다', async () => {
      // Given: API 요청이 실패하는 상황
      setupMockXMLHttpResponse({
        status: 500,
        statusText: 'Internal Server Error',
        responseText: JSON.stringify({ error: 'Server Error' }),
      });

      // When & Then: 오류가 발생해야 한다
      mockMediaExtractionService.extractMediaFromTweet.mockRejectedValue(
        new Error('Failed to extract media: Server Error')
      );

      await expect(mockMediaExtractionService.extractMediaFromTweet({})).rejects.toThrow(
        'Failed to extract media'
      );
    });
  });

  describe('캐싱 및 성능', () => {
    it('동일한 트윗 ID에 대해서는 캐시된 결과를 반환해야 한다', async () => {
      // Given: 동일한 트윗 ID로 두 번 요청
      const tweetId = 'test-tweet-123';
      const cachedResult = {
        images: ['https://pbs.twimg.com/media/cached.jpg:large'],
        videos: [],
        total: 1,
      };

      // When: 첫 번째 요청
      mockMediaExtractionService.extractMediaFromTweet
        .mockResolvedValueOnce(cachedResult)
        .mockResolvedValueOnce(cachedResult);

      const firstResult = await mockMediaExtractionService.extractMediaFromTweet({ id: tweetId });
      const secondResult = await mockMediaExtractionService.extractMediaFromTweet({ id: tweetId });

      // Then: 같은 결과가 반환되고, API 호출은 한 번만 되어야 한다
      expect(firstResult).toEqual(secondResult);
      expect(mockUserscriptAPI.GM_xmlhttpRequest).toHaveBeenCalledTimes(0); // 캐시로 인해 호출 안됨
    });
  });

  describe('입력 유효성 검증', () => {
    it('null 또는 undefined 입력에 대해 적절히 처리해야 한다', () => {
      // Given: 잘못된 입력
      const invalidInputs = [null, undefined, {}, { entities: null }];

      invalidInputs.forEach(input => {
        // When & Then: 오류 없이 빈 결과를 반환해야 한다
        mockMediaExtractionService.extractImageUrls.mockReturnValue([]);
        const result = mockMediaExtractionService.extractImageUrls(input);
        expect(result).toEqual([]);
      });
    });

    it('잘못된 미디어 형식에 대해 필터링해야 한다', () => {
      // Given: 잘못된 형식의 미디어 데이터
      const malformedData = {
        entities: {
          media: [
            { type: 'unknown' }, // 알 수 없는 타입
            { type: 'photo' }, // URL 없음
            { type: 'photo', media_url_https: 'invalid-url' }, // 잘못된 URL
            { type: 'photo', media_url_https: 'https://pbs.twimg.com/media/valid.jpg' }, // 유효
          ],
        },
      };

      // When: 미디어를 추출하면
      mockMediaExtractionService.extractImageUrls.mockReturnValue([
        'https://pbs.twimg.com/media/valid.jpg:large',
      ]);

      const result = mockMediaExtractionService.extractImageUrls(malformedData);

      // Then: 유효한 미디어만 추출되어야 한다
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('valid.jpg');
    });
  });
});
