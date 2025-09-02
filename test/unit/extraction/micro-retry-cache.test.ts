// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';

// Phase 11 GREEN: API 1차 실패 -> rAF/0ms backoff 후 2차 재시도 성공, attempts=2,retries=1
// + tweetId 기반 캐시: 두번째 동일 tweetId 호출 시 cacheHit=true

describe('Phase 11 GREEN: micro-retry & tweetId 캐시', () => {
  let service;
  beforeEach(() => {
    document.body.innerHTML = '';
    service = new MediaExtractionService();
  });

  it('1차 API 실패 후 1회 재시도로 성공 (attempts=2, retries=1)', async () => {
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/micro_retry_red.jpg';
    article.appendChild(img);
    document.body.appendChild(article);

    // TweetInfo 확보
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: 'mr1',
      username: 'u',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // API extractor: 첫 실패 -> 두번째 성공
    const apiModule = await import(
      '@shared/services/media-extraction/extractors/TwitterAPIExtractor'
    );
    vi.spyOn(apiModule.TwitterAPIExtractor.prototype, 'extract')
      .mockResolvedValueOnce({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'api-first' },
        tweetInfo: {
          tweetId: 'mr1',
          username: 'u',
          tweetUrl: '',
          extractionMethod: 'mock',
          confidence: 1,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        mediaItems: [
          {
            id: 'r1',
            url: 'https://pbs.twimg.com/media/micro_retry_red.jpg?format=jpg&name=orig',
            type: 'image',
            filename: 'media_1.jpg',
          },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'api-first' },
        tweetInfo: {
          tweetId: 'mr1',
          username: 'u',
          tweetUrl: '',
          extractionMethod: 'mock',
          confidence: 1,
        },
      });

    const result = await service.extractFromClickedElement(img);
    expect(result.success).toBe(true);
    expect(result.metadata.attempts).toBe(2);
    expect(result.metadata.retries).toBe(1);
    expect(result.metadata.cacheHit).toBe(false);
  });

  it('동일 tweetId 두번째 호출 시 cacheHit=true & API 재호출 없음', async () => {
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/micro_retry_cache_red.jpg';
    article.appendChild(img);
    document.body.appendChild(article);

    // TweetInfo
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: 'cache123',
      username: 'u2',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // API extractor 단 1회 성공
    const apiModule = await import(
      '@shared/services/media-extraction/extractors/TwitterAPIExtractor'
    );
    const apiSpy = vi.spyOn(apiModule.TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems: [
        {
          id: 'c1',
          url: 'https://pbs.twimg.com/media/micro_retry_cache_red.jpg?format=jpg&name=orig',
          type: 'image',
          filename: 'media_1.jpg',
        },
      ],
      clickedIndex: 0,
      metadata: { sourceType: 'api-first' },
      tweetInfo: {
        tweetId: 'cache123',
        username: 'u2',
        tweetUrl: '',
        extractionMethod: 'mock',
        confidence: 1,
      },
    });

    const first = await service.extractFromClickedElement(img);
    expect(first.metadata.cacheHit).toBe(false);
    const callsAfterFirst = apiSpy.mock.calls.length;
    const second = await service.extractFromClickedElement(img);
    expect(second.metadata.cacheHit).toBe(true);
    expect(apiSpy.mock.calls.length).toBe(callsAfterFirst);
  });
});
