// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';

// API 두 번 모두 실패 후 DOM 폴백 성공 시나리오 검증
// 기대: attempts=2, retries=1, cacheHit=false, sourceType='dom-fallback'

describe('Phase 11: API 완전 실패 후 DOM 폴백 성공', () => {
  let service;
  beforeEach(() => {
    document.body.innerHTML = '';
    service = new MediaExtractionService();
  });

  it('API 2회 (초기+재시도) 모두 실패 -> DOM 폴백 성공', async () => {
    const article = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/api_double_fail_dom_success.jpg';
    article.appendChild(img);
    document.body.appendChild(article);

    // TweetInfo 정상 반환 (tweetId 확보)
    const tweetInfoModule = await import(
      '@shared/services/media-extraction/extractors/TweetInfoExtractor'
    );
    vi.spyOn(tweetInfoModule.TweetInfoExtractor.prototype, 'extract').mockResolvedValue({
      tweetId: 'dom789',
      username: 'u3',
      tweetUrl: '',
      extractionMethod: 'mock',
      confidence: 1,
    });

    // API extractor: 두 번 모두 실패하도록 mock (success=false)
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
          tweetId: 'dom789',
          username: 'u3',
          tweetUrl: '',
          extractionMethod: 'mock',
          confidence: 1,
        },
      })
      .mockResolvedValueOnce({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        metadata: { sourceType: 'api-first' },
        tweetInfo: {
          tweetId: 'dom789',
          username: 'u3',
          tweetUrl: '',
          extractionMethod: 'mock',
          confidence: 1,
        },
      });

    // DOM extractor: 성공 1개 이미지
    const domModule = await import(
      '@shared/services/media-extraction/extractors/DOMDirectExtractor'
    );
    vi.spyOn(domModule.DOMDirectExtractor.prototype, 'extract').mockResolvedValue({
      success: true,
      mediaItems: [
        {
          id: 'd1',
          url: 'https://pbs.twimg.com/media/api_double_fail_dom_success.jpg?format=jpg&name=orig',
          type: 'image',
          filename: 'media_dom.jpg',
        },
      ],
      clickedIndex: 0,
      metadata: { sourceType: 'dom-fallback' },
      tweetInfo: {
        tweetId: 'dom789',
        username: 'u3',
        tweetUrl: '',
        extractionMethod: 'mock',
        confidence: 1,
      },
    });

    const result = await service.extractFromClickedElement(img);
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(1);
    expect(result.metadata?.cacheHit).toBe(false);
    expect(result.metadata?.sourceType).toBe('dom-fallback');
    expect(result.metadata?.attempts).toBe(2); // initial + retry
    expect(result.metadata?.retries).toBe(1);
  });
});
