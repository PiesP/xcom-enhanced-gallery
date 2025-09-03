// @vitest-environment jsdom
// RED: background-image heuristic v3.1 추가 패턴 _(\d+)x(\d+) (언더스코어 경계) 인식
import { describe, it, expect } from 'vitest';
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/DOMDirectExtractor';

function makeElem(urls: string[]): HTMLElement {
  const el = (globalThis.document as Document).createElement('div');
  el.setAttribute('style', `background-image: ${urls.map(u => `url(${u})`).join(', ')};`);
  return el;
}

describe('[RED] background-image heuristic dimension underscore pattern', () => {
  it('패턴 AAA_2400x1600 처리하여 가장 큰 해상도 선택', async () => {
    const extractor = new DOMDirectExtractor();
    const root = (globalThis.document as Document).createElement('div');
    const bg = makeElem([
      'https://pbs.twimg.com/media/AAA_1200x800.jpg?format=jpg&name=orig',
      'https://pbs.twimg.com/media/AAA_2400x1600.jpg?format=jpg&name=orig',
    ]);
    root.appendChild(bg);
    const result = await extractor.extract(root, {}, 'heuristic-dim');
    expect(result.success).toBe(true);
    expect(result.mediaItems[0].url).toContain('2400x1600');
  });
});
