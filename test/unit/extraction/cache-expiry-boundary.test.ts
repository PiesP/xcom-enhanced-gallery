// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import { MediaExtractionCache } from '@shared/services/media-extraction/MediaExtractionCache';

// Phase 11 GREEN: tweetId 캐시 TTL 경계 검증 (만료 직전 cacheHit 유지 / 만료 후 재호출)

describe('Phase 11 GREEN: tweetId 캐시 TTL 경계', () => {
  let service;
  let apiSpy;
  const ttlMs = 40; // 아주 짧은 TTL 로 경계 조건 검증
  const baseTime = 1_000_000;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
    const cache = new MediaExtractionCache({ ttlMs, maxEntries: 10 });
    service = new MediaExtractionService(cache);

    // TweetInfo extractor mock
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: 'ttl1',
      username: 'ttl_user',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // API extractor spy (한 번 성공 응답 반환)
    const apiModule = await import(
      '@shared/services/media-extraction/extractors/TwitterAPIExtractor'
    );
    apiSpy = vi.spyOn(apiModule.TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems: [
        {
          id: 'ttl_img',
          url: 'https://pbs.twimg.com/media/cache_ttl.jpg?format=jpg&name=orig',
          type: 'image',
          filename: 'media_1.jpg',
        },
      ],
      clickedIndex: 0,
      metadata: { sourceType: 'api-first' },
      tweetInfo: {
        tweetId: 'ttl1',
        username: 'ttl_user',
        tweetUrl: '',
        extractionMethod: 'mock',
        confidence: 1,
      },
    });
  });

  const prepareDom = () => {
    document.body.innerHTML = '';
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/cache_ttl.jpg';
    article.appendChild(img);
    document.body.appendChild(article);
    return img;
  };

  it('TTL 직전 cacheHit 유지 & TTL 경과 후 cache 무효화', async () => {
    const img = prepareDom();

    // 최초: API 호출 1회
    const first = await service.extractFromClickedElement(img);
    expect(first.success).toBe(true);
    expect(first.metadata.cacheHit).toBe(false);
    const afterFirstCalls = apiSpy.mock.calls.length;

    // TTL -1ms 시점 (유효)
    vi.setSystemTime(baseTime + ttlMs - 1);
    const second = await service.extractFromClickedElement(img);
    expect(second.metadata.cacheHit).toBe(true);
    expect(apiSpy.mock.calls.length).toBe(afterFirstCalls); // API 재호출 없음

    // TTL +1ms 시점 (만료)
    vi.setSystemTime(baseTime + ttlMs + 1);
    const third = await service.extractFromClickedElement(img);
    expect(third.metadata.cacheHit).toBe(false); // 새 추출
    expect(apiSpy.mock.calls.length).toBe(afterFirstCalls + 1); // API 두 번째 호출
  });
});
