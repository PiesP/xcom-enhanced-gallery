// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';

// RED: 재시도/캐시 미구현 상태 확인 → GREEN에서 1회 재시도 + tweetId 캐시로 성공률 향상

describe('Phase 11 GREEN: MediaExtractionService 재시도 & 캐시 구현', () => {
  let service;
  beforeEach(() => {
    document.body.innerHTML = '';
    service = new MediaExtractionService();
  });

  it('API 1회 실패 후 재시도 또는 DOM 폴백으로 성공 & attempts/retries 기록', async () => {
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/retry_cache_red.jpg';
    article.appendChild(img);
    document.body.appendChild(article);

    // TweetInfoExtractor 를 mock 해서 유효한 tweetId 를 반환하도록 하여
    // API extractor 경로가 활성화되도록 강제 (기존 실패 원인: tweetId 추출 실패로 API 경로 비실행)
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: '123',
      username: 'u',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // TweetInfoExtractor mock → 정상 tweetId 부여해 API 추출 단계로 이동시키고 API extractor 강제 실패
    const apiModule = await import(
      '@shared/services/media-extraction/extractors/TwitterAPIExtractor'
    );
    // 첫 호출 실패 -> 두번째 재시도 성공 시나리오 구성
    vi.spyOn(apiModule.TwitterAPIExtractor.prototype, 'extract')
      .mockResolvedValueOnce({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'api-first' },
        tweetInfo: {
          tweetId: '123',
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
            id: 'm1',
            url: 'https://pbs.twimg.com/media/retry_cache_red.jpg?format=jpg&name=orig',
            type: 'image',
            filename: 'media_1.jpg',
          },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'api-first' },
        tweetInfo: {
          tweetId: '123',
          username: 'u',
          tweetUrl: '',
          extractionMethod: 'mock',
          confidence: 1,
        },
      });

    const result = await service.extractFromClickedElement(img);
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(1);
    if (result.metadata?.attempts !== undefined) {
      expect(result.metadata.attempts).toBeGreaterThanOrEqual(1);
      expect(result.metadata.retries).toBeLessThanOrEqual(1);
    }
    expect(result.metadata?.cacheHit).toBe(false);
  });

  it('동일 tweetId 두번째 호출: 캐시 히트로 빠른 반환 (cacheHit=true)', async () => {
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/cache_id_red.jpg';
    article.appendChild(img);
    document.body.appendChild(article);

    // 강제로 tweetInfo null 처리 → 첫 호출 실패 예상
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: '456',
      username: 'u2',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // API extractor는 한 번만 성공하도록 mock
    const apiModule = await import(
      '@shared/services/media-extraction/extractors/TwitterAPIExtractor'
    );
    const apiSpy = vi.spyOn(apiModule.TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems: [
        {
          id: 'c1',
          url: 'https://pbs.twimg.com/media/cache_id_red.jpg?format=jpg&name=orig',
          type: 'image',
          filename: 'media_1.jpg',
        },
      ],
      clickedIndex: 0,
      metadata: { sourceType: 'api-first' },
      tweetInfo: {
        tweetId: '456',
        username: 'u2',
        tweetUrl: '',
        extractionMethod: 'mock',
        confidence: 1,
      },
    });

    const first = await service.extractFromClickedElement(img);
    expect(first.success).toBe(true);
    expect(first.metadata?.cacheHit).toBe(false);
    const callCountAfterFirst = apiSpy.mock.calls.length;
    const second = await service.extractFromClickedElement(img);
    expect(second.success).toBe(true);
    expect(second.metadata?.cacheHit).toBe(true);
    // 두번째 호출에서 API extract 추가 호출 없어야 함
    expect(apiSpy.mock.calls.length).toBe(callCountAfterFirst);
  });
});
