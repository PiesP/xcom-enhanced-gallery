// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';

// Phase 11 GREEN: 다양한 DOM 변형 (picture/source, data-image-url, background-image, video source) 추출 성공 검증
// 현재 구현 일부는 통과할 수 있으나 목적은 전체 커버리지 확보 & 향후 HARDEN 테스트 분리

function createArticle() {
  const article = document.createElement('article');
  article.setAttribute('data-testid', 'tweet');
  document.body.appendChild(article);
  return article;
}

describe('Phase 11 GREEN: DOMDirectExtractor 확장 선택자 커버리지', () => {
  let extractor;
  beforeEach(() => {
    document.body.innerHTML = '';
    extractor = new DOMDirectExtractor();
  });

  async function run(el) {
    return extractor.extract(el, {}, 'red_selectors');
  }

  it('picture > source srcset 첫 URL 추출', async () => {
    const article = createArticle();
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.setAttribute(
      'srcset',
      'https://pbs.twimg.com/media/red_picture_source.jpg 100w, https://pbs.twimg.com/media/other.jpg 200w'
    );
    picture.appendChild(source);
    article.appendChild(picture);

    const result = await run(source);
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBeGreaterThan(0);
  });

  it('data-image-url 속성 추출', async () => {
    const article = createArticle();
    const div = document.createElement('div');
    div.setAttribute('data-image-url', 'https://pbs.twimg.com/media/red_data_attr.jpg');
    article.appendChild(div);

    const result = await run(div);
    expect(result.mediaItems.length).toBeGreaterThan(0);
  });

  it('background-image 스타일 추출', async () => {
    const article = createArticle();
    const div = document.createElement('div');
    div.setAttribute('style', 'background-image:url(https://pbs.twimg.com/media/red_bg_style.jpg)');
    article.appendChild(div);

    const result = await run(div);
    expect(result.mediaItems.length).toBeGreaterThan(0);
  });

  it('video > source src 추출', async () => {
    const article = createArticle();
    const video = document.createElement('video');
    const source = document.createElement('source');
    source.setAttribute('src', 'https://video.twimg.com/ext_tw_video/red_video.mp4');
    video.appendChild(source);
    article.appendChild(video);

    const result = await run(source);
    expect(result.mediaItems.length).toBeGreaterThan(0);
  });
});
