// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';

// RED: TweetInfoExtractor를 강제 실패(mock) 시 DOM fallback이 selector 제한으로 실패 → GREEN에서 성공하도록 개선 예정

describe('Phase 11 GREEN: TweetInfoExtractor 실패 시 DOM fallback 추출', () => {
  let service;

  beforeEach(async () => {
    document.body.innerHTML = '';
    service = new MediaExtractionService();
  });

  it('TweetInfoExtractor 실패 후 DOM fallback 이 background-image / data-image-url 포함 요소를 추출해야 함', async () => {
    // 동적 DOM 구성 (tweet article)
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');

    const div = document.createElement('div');
    div.setAttribute('data-image-url', 'https://pbs.twimg.com/media/fallback_red.jpg');
    article.appendChild(div);

    const bg = document.createElement('div');
    bg.setAttribute(
      'style',
      'background-image:url(https://pbs.twimg.com/media/fallback_bg_red.jpg)'
    );
    article.appendChild(bg);

    document.body.appendChild(article);

    // TweetInfoExtractor 전략 전체 실패 mock
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValueOnce(null);

    const result = await service.extractFromClickedElement(bg);

    expect(result.success, 'fallback DOM 추출이 성공해야 함').toBe(true);
    expect(result.mediaItems.length, '최소 1개 mediaItems').toBeGreaterThan(0);
  });
});
