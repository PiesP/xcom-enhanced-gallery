// @vitest-environment jsdom
/**
 * background-image heuristic v2 - 'small' / 'thumb' 등 저해상도 패턴 패널티 검증
 */
import { describe, it, expect } from 'vitest';
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/DOMDirectExtractor';

class TestableExtractor extends DOMDirectExtractor {
  // @ts-ignore - private 접근 (테스트 한정)
  public select(urls: string[]) {
    return (this as any).selectBestBackgroundImageUrl(urls);
  }
}

describe('background-image heuristic v2 패널티 적용', () => {
  it('"small" 패턴이 포함된 URL보다 일반 URL을 선택한다', () => {
    const extractor = new TestableExtractor();
    const urls = [
      'https://pbs.twimg.com/media/abc_small.jpg?format=jpg&name=900x900',
      'https://pbs.twimg.com/media/def.jpg?format=jpg&name=900x900',
    ];
    const selected = extractor.select(urls);
    expect(selected).toBe(urls[1]);
  });
});
