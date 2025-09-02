// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';

// Phase 11 GREEN: background-image 다중 URL 중 고품질(orig/large) 후보 선택 휴리스틱 검증

describe('Phase 11 GREEN: background-image 고품질 선택 휴리스틱', () => {
  let extractor;
  beforeEach(() => {
    document.body.innerHTML = '';
    extractor = new DOMDirectExtractor();
  });

  it('다중 background-image 중 파일명 *_orig 가 포함된 URL이 선택된다', async () => {
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    const div = document.createElement('div');
    // small -> orig 순으로 제공, 마지막이 orig 이고 휴리스틱이 orig 선호
    div.setAttribute(
      'style',
      'background-image:url("https://pbs.twimg.com/media/abc_small.jpg?format=jpg&name=small"), url("https://pbs.twimg.com/media/abc_orig.jpg?format=jpg&name=large")'
    );
    article.appendChild(div);
    document.body.appendChild(article);

    const result = await extractor.extract(div, {}, 'bg_quality_red');
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(1);
    // 구현은 query string 의 name= 을 모두 name=orig 로 정규화하지만 경로(파일명)는 유지되므로 abc_orig 포함해야 함
    expect(result.mediaItems[0].url).toContain('abc_orig');
  });
});
