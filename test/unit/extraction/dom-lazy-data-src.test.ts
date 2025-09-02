// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';

// Phase 11 HARDEN RED: lazy-loaded 이미지 (data-src -> 다음 tick 에 src 세팅) 를 1회 micro-retry 로 포착해야 함
// 현재 구현: 단일 패스 → mediaItems=0 으로 실패 예상 (RED)

describe('Phase 11 HARDEN RED: lazy data-src micro-retry', () => {
  let extractor;
  beforeEach(() => {
    document.body.innerHTML = '';
    extractor = new DOMDirectExtractor();
  });

  it('data-src 가 나중에 src 로 승격된 이미지를 micro-retry 로 추출해야 한다', async () => {
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    const img = document.createElement('img');
    img.setAttribute('data-src', 'https://pbs.twimg.com/media/lazy_retry_red.jpg');
    // src 없음 (lazy 상태)
    article.appendChild(img);
    document.body.appendChild(article);

    // 다음 tick 에 src 적용 (실제 사이트에서 IntersectionObserver 등으로 전환 가정)
    setTimeout(() => {
      img.setAttribute('src', img.getAttribute('data-src'));
    }, 0);

    const result = await extractor.extract(img, {}, 'lazy_red');
    // GREEN 목표: success=true & mediaItems>=1
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBeGreaterThan(0);
  });
});
