/**
 * DOMDirectExtractor 리팩토링 TDD 테스트
 * - 규칙 유틸 통합 및 중복 제거
 */

/* @vitest-environment jsdom */
/* eslint-env browser */

import { describe, it, expect } from 'vitest';

describe('DOMDirectExtractor - 규칙 유틸 통합', () => {
  it('이미지 URL을 중앙 유틸 규칙대로 orig 품질로 변환해야 한다', async () => {
    const { DOMDirectExtractor } = await import(
      '@shared/services/media-extraction/extractors/dom-direct-extractor'
    );
    const { extractOriginalImageUrl } = await import('@shared/utils/media/media-url.util');

    const container = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/AbCdEf.jpg?format=jpg&name=large';
    container.appendChild(img);

    const extractor = new DOMDirectExtractor();
    const result = await extractor.extract(img, {}, 'test-extract-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.mediaItems).toHaveLength(1);
      const expected = extractOriginalImageUrl(img.src);
      expect(result.mediaItems[0].url).toBe(expected);
    }
  });

  it('profile_images 경로는 제외해야 하며, isValid 규칙을 따라야 한다', async () => {
    const { DOMDirectExtractor } = await import(
      '@shared/services/media-extraction/extractors/dom-direct-extractor'
    );

    const container = document.createElement('article');
    const profileImg = document.createElement('img');
    profileImg.src =
      'https://pbs.twimg.com/profile_images/12345/some_avatar.jpg?format=jpg&name=large';
    container.appendChild(profileImg);

    const normalImg = document.createElement('img');
    normalImg.src = 'https://pbs.twimg.com/media/ZyXwVu.jpg?format=jpg&name=small';
    container.appendChild(normalImg);

    const extractor = new DOMDirectExtractor();
    const result = await extractor.extract(normalImg, {}, 'test-extract-2');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.mediaItems.length).toBe(1);
      // profile_images는 포함되지 않아야 함
      expect(result.mediaItems[0].url).toContain('pbs.twimg.com/media/');
    }
  });

  it('png 형식은 유지하되 name=orig로만 승격해야 한다', async () => {
    const { DOMDirectExtractor } = await import(
      '@shared/services/media-extraction/extractors/dom-direct-extractor'
    );

    const container = document.createElement('article');
    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/FooBar.png?format=png&name=medium';
    container.appendChild(img);

    const extractor = new DOMDirectExtractor();
    const result = await extractor.extract(img, {}, 'test-extract-3');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.mediaItems).toHaveLength(1);
      expect(result.mediaItems[0].url).toBe(
        'https://pbs.twimg.com/media/FooBar.png?format=png&name=orig'
      );
    }
  });

  it('우선순위 선택자 기반으로 가장 가까운 상위 트윗 컨테이너(article[data-testid="tweet"])를 선택해야 한다', async () => {
    const { DOMDirectExtractor } = await import(
      '@shared/services/media-extraction/extractors/dom-direct-extractor'
    );

    // 구조: article[data-testid="tweet"] (outer)
    //   └─ div[data-testid="tweet"] (inner) ─ img (clicked)
    //   └─ img (sibling in outer)
    const outer = document.createElement('article');
    outer.setAttribute('data-testid', 'tweet');

    const inner = document.createElement('div');
    inner.setAttribute('data-testid', 'tweet');

    const clickedImg = document.createElement('img');
    clickedImg.src = 'https://pbs.twimg.com/media/Inner.jpg?format=jpg&name=large';

    const siblingImg = document.createElement('img');
    siblingImg.src = 'https://pbs.twimg.com/media/Sibling.jpg?format=jpg&name=large';

    inner.appendChild(clickedImg);
    outer.appendChild(inner);
    outer.appendChild(siblingImg);
    document.body.appendChild(outer);

    const extractor = new DOMDirectExtractor();
    const result = await extractor.extract(clickedImg, {}, 'test-extract-closest');

    expect(result.success).toBe(true);
    if (result.success) {
      // 올바른 상위 컨테이너(article)를 선택했다면 두 이미지가 모두 수집되어야 함
      expect(result.mediaItems.length).toBe(2);
      const urls = result.mediaItems.map(m => m.url).sort();
      expect(urls[0]).toContain('Inner');
      expect(urls[1]).toContain('Sibling');
    }
  });
});
