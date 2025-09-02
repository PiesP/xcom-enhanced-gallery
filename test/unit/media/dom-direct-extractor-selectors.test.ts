// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';

// RED: 다양한 변형된 DOM 구조에서 현재 extractor가 0개를 반환하는지 확인 (GREEN에서 모두 추출되도록 수정 예정)

describe('Phase 11 GREEN: DOMDirectExtractor 확장 선택자 커버리지', () => {
  let extractor;
  beforeEach(() => {
    document.body.innerHTML = '';
    extractor = new DOMDirectExtractor();
  });

  async function runExtraction(element) {
    return extractor.extract(element, {}, 'test_extraction');
  }

  it('picture > source 구조 이미지 추출', async () => {
    const article = document.createElement('article');
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.setAttribute('srcset', 'https://pbs.twimg.com/media/picture_source_red.jpg');
    picture.appendChild(source);
    article.appendChild(picture);
    document.body.appendChild(article);

    const result = await runExtraction(source);
    expect(result.mediaItems.length).toBeGreaterThan(0); // GREEN 목표
  });

  it('data-image-url 속성 이미지 추출', async () => {
    const article = document.createElement('article');
    const div = document.createElement('div');
    div.setAttribute('data-image-url', 'https://pbs.twimg.com/media/data_attr_red.jpg');
    article.appendChild(div);
    document.body.appendChild(article);

    const result = await runExtraction(div);
    expect(result.mediaItems.length).toBeGreaterThan(0); // GREEN 목표
  });

  it('background-image 스타일 이미지 추출', async () => {
    const article = document.createElement('article');
    const div = document.createElement('div');
    div.setAttribute('style', 'background-image:url(https://pbs.twimg.com/media/bg_style_red.jpg)');
    article.appendChild(div);
    document.body.appendChild(article);

    const result = await runExtraction(div);
    expect(result.mediaItems.length).toBeGreaterThan(0); // GREEN 목표
  });

  it('video source src 변형 추출', async () => {
    const article = document.createElement('article');
    const video = document.createElement('video');
    const source = document.createElement('source');
    source.setAttribute('src', 'https://video.twimg.com/ext_tw_video/vid_red.mp4');
    video.appendChild(source);
    article.appendChild(video);
    document.body.appendChild(article);

    const result = await runExtraction(source);
    expect(result.mediaItems.length).toBeGreaterThan(0); // GREEN 목표
  });
});
