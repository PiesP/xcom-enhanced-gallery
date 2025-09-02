// @vitest-environment jsdom
// eslint-env browser
// @ts-nocheck
// Phase 11 HARDEN: 메트릭스 로깅 RED 테스트
// 목표: MediaExtractionService가 성공/재시도/캐시 여부를 구조화된 메트릭스로 logger.info에 기록
// 현재 구현은 단순 문자열 로그만 존재 → 본 테스트는 실패(RED) 상태여야 함.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';
import { logger } from '@shared/logging/logger';

describe('Phase 11 GREEN: MediaExtractionService 메트릭스 로깅', () => {
  let service; // 타입 주석 제거 (RED 단계 단순화)

  beforeEach(() => {
    document.body.innerHTML = '';
    service = new MediaExtractionService();
  });

  it('API 1회 실패 후 재시도 성공 시 attempts=2, retries=1, cacheHit=false 메트릭스 로그를 남겨야 한다', async () => {
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/metrics_retry.jpg';
    article.appendChild(img);
    document.body.appendChild(article);

    // tweetInfo 강제 주입
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: 'mtr123',
      username: 'user',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // API extractor: 첫 실패, 두번째 성공
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
          tweetId: 'mtr123',
          username: 'user',
          tweetUrl: '',
          extractionMethod: 'mock',
          confidence: 1,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        mediaItems: [
          {
            id: 'mid1',
            url: 'https://pbs.twimg.com/media/metrics_retry.jpg?format=jpg&name=orig',
            type: 'image',
            filename: 'metrics_retry.jpg',
          },
        ],
        clickedIndex: 0,
        metadata: { sourceType: 'api-first' },
        tweetInfo: {
          tweetId: 'mtr123',
          username: 'user',
          tweetUrl: '',
          extractionMethod: 'mock',
          confidence: 1,
        },
      });

    const infoSpy = vi.spyOn(logger, 'info');

    const result = await service.extractFromClickedElement(img);
    expect(result.success).toBe(true);
    expect(result.metadata?.attempts).toBe(2); // 재시도 반영
    expect(result.metadata?.retries).toBe(1);
    expect(result.metadata?.cacheHit).toBe(false);

    // 기대 메트릭스: logger.info 호출 중 하나가 객체 형태 { metrics: { attempts:2, retries:1, cacheHit:false, tweetId:'mtr123', sourceType:'api-first' } }
    const metricsLogFound = infoSpy.mock.calls.some(call => {
      return call.some(arg => {
        if (arg && typeof arg === 'object' && 'metrics' in arg) {
          const metrics = arg.metrics;
          return (
            metrics &&
            metrics.tweetId === 'mtr123' &&
            metrics.attempts === 2 &&
            metrics.retries === 1 &&
            metrics.cacheHit === false &&
            metrics.sourceType === 'api-first'
          );
        }
        return false;
      });
    });

    expect(metricsLogFound).toBe(true);
  });
});
