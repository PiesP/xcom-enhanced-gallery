// @vitest-environment jsdom
// @ts-nocheck
/**
 * Phase 11 RED: 캐시 만료(stale) 시 재추출 전에 stale-evict 메트릭스(stage=cache-stale-evict)를 로깅해야 한다.
 * 요구사항:
 *  1) 최초 추출: cacheHit=false, stage=api-success 메트릭스 존재
 *  2) TTL 경과 후 동일 tweetId 재추출: cacheHit=false (fresh) 이면서
 *     재추출 직전에 stage=cache-stale-evict 메트릭스 로그 (metrics.staleEvicted=true, metrics.tweetId=<id>) 를 남긴다.
 * 현 구현은 만료 인지를 구분하지 않고 단순 미스 처리하므로 'cache-stale-evict' 스테이지 로그가 없어 이 테스트는 실패(RED)해야 한다.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import { MediaExtractionCache } from '@shared/services/media-extraction/MediaExtractionCache';
import { logger } from '@shared/logging/logger';

describe('Phase 11 GREEN: MediaExtractionService 캐시 만료 stale-evict 메트릭스', () => {
  let service;
  let infoSpy;
  const ttlMs = 40; // 짧은 TTL
  const baseTime = 2_000_000;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
    document.body.innerHTML = '';

    const cache = new MediaExtractionCache({ ttlMs, maxEntries: 10 });
    service = new MediaExtractionService(cache);

    // TweetInfoExtractor mock
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: 'stale123',
      username: 'stale_user',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // API extractor mock (항상 성공)
    const apiModule = await import(
      '@shared/services/media-extraction/extractors/TwitterAPIExtractor'
    );
    vi.spyOn(apiModule.TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems: [
        {
          id: 'img1',
          url: 'https://pbs.twimg.com/media/stale_cache.jpg?format=jpg&name=orig',
          type: 'image',
          filename: 'stale_cache.jpg',
        },
      ],
      clickedIndex: 0,
      metadata: { sourceType: 'api-first' },
      tweetInfo: {
        tweetId: 'stale123',
        username: 'stale_user',
        tweetUrl: '',
        extractionMethod: 'mock',
        confidence: 1,
      },
    });

    infoSpy = vi.spyOn(logger, 'info');
  });

  const prepareDom = () => {
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/stale_cache.jpg';
    article.appendChild(img);
    document.body.appendChild(article);
    return img;
  };

  it('TTL 경과 후 재추출 시 cache-stale-evict 메트릭스(stage)와 staleEvicted=true 포함해야 한다', async () => {
    const img = prepareDom();

    // 1) 최초 추출
    const first = await service.extractFromClickedElement(img);
    expect(first.success).toBe(true);
    expect(first.metadata.cacheHit).toBe(false);

    // 최초 메트릭스(api-success) 존재 확인 (사전조건) - 없으면 테스트 자체 무의미
    const hasApiSuccess = infoSpy.mock.calls.some(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('metrics(api-success)'))
    );
    expect(hasApiSuccess).toBe(true);

    // 2) TTL 경과 -> 만료 상태로 재호출
    vi.setSystemTime(baseTime + ttlMs + 5);
    const second = await service.extractFromClickedElement(img);
    expect(second.success).toBe(true);
    expect(second.metadata.cacheHit).toBe(false); // 만료 후 fresh

    // 기대: stale-evict 메트릭스 로그 (RED 예상 실패)
    const hasStaleEvictMetrics = infoSpy.mock.calls.some(call => {
      let stageOk = false;
      let metricsOk = false;
      for (const arg of call) {
        if (typeof arg === 'string' && arg.includes('metrics(cache-stale-evict)')) {
          stageOk = true;
        }
        if (arg && typeof arg === 'object' && 'metrics' in arg) {
          const m = arg.metrics;
          metricsOk =
            m && m.tweetId === 'stale123' && m.staleEvicted === true && m.cacheHit === false;
        }
      }
      return stageOk && metricsOk;
    });

    expect(hasStaleEvictMetrics).toBe(true);
  });
});
