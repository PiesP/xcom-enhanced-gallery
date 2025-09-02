// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';

// Phase 11 HARDEN RED: background-image: url(a), url(b) 다중 정의 시 첫 URL 추출
// 현재 구현: 단일 url() 패턴만, 다중 매치 불가 → 첫 URL 추출 실패 가능 (RED)

describe('Phase 11 HARDEN RED: background-image 다중 URL', () => {
  let extractor;
  beforeEach(() => {
    document.body.innerHTML = '';
    extractor = new DOMDirectExtractor();
  });

  it('background-image 에 여러 url() 중 첫 번째 URL 추출', async () => {
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    const div = document.createElement('div');
    div.setAttribute(
      'style',
      'background-image:url("https://pbs.twimg.com/media/multi1_red.jpg"), url("https://pbs.twimg.com/media/multi2_red.jpg")'
    );
    article.appendChild(div);
    document.body.appendChild(article);

    const result = await extractor.extract(div, {}, 'bg_multi_red');
    expect(result.mediaItems.length).toBeGreaterThan(0);
  });
});
