// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';

// Phase 11 GREEN: 첫 추출 후 DOM 제거 → 동일 tweetId 재구성/재클릭 시 cacheHit 경로 검증

function buildTweetDom(url, tweetId = 'reopen1') {
  const article = document.createElement('article');
  article.setAttribute('data-testid', 'tweet');
  const img = document.createElement('img');
  img.src = url;
  article.appendChild(img);
  document.body.appendChild(article);
  return { article, img, tweetId };
}

describe('Phase 11 GREEN: cacheHit 재열기 시나리오', () => {
  let service;
  const URL = 'https://pbs.twimg.com/media/cache_reopen_red.jpg';

  beforeEach(() => {
    document.body.innerHTML = '';
    service = new MediaExtractionService();
  });

  it('첫 추출 후 DOM 제거 & 재구성 시 cacheHit=true', async () => {
    // TweetInfo mock
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: 'reopen777',
      username: 'userX',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    const apiModule = await import(
      '@shared/services/media-extraction/extractors/TwitterAPIExtractor'
    );
    const apiSpy = vi.spyOn(apiModule.TwitterAPIExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems: [
        { id: 'a1', url: `${URL}?format=jpg&name=orig`, type: 'image', filename: 'media_1.jpg' },
      ],
      clickedIndex: 0,
      metadata: { sourceType: 'api-first' },
      tweetInfo: {
        tweetId: 'reopen777',
        username: 'userX',
        tweetUrl: '',
        extractionMethod: 'mock',
        confidence: 1,
      },
    });

    // 첫 추출
    const { article, img } = buildTweetDom(URL, 'reopen777');
    const first = await service.extractFromClickedElement(img);
    expect(first.success).toBe(true);
    expect(first.metadata.cacheHit).toBe(false);
    const callsAfterFirst = apiSpy.mock.calls.length;

    // DOM 제거 (simulate close)
    article.remove();

    // 재구성 (새 DOM but same tweetId via TweetInfo mock)
    const { img: secondImg } = buildTweetDom(URL, 'reopen777');
    const second = await service.extractFromClickedElement(secondImg);
    expect(second.success).toBe(true);
    expect(second.metadata.cacheHit).toBe(true);
    // API 추가 호출 없음
    expect(apiSpy.mock.calls.length).toBe(callsAfterFirst);
  });
});
