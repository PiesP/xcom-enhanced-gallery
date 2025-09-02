// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { MediaExtractionService } from '@shared/services/media-extraction/MediaExtractionService';

function createInitialTweetDom(url) {
  const article = document.createElement('article');
  article.setAttribute('data-testid', 'tweet');
  const img = document.createElement('img');
  img.src = url;
  article.appendChild(img);
  document.body.appendChild(article);
  return { article, img };
}

function mutateTweetDomToBackground(article, url) {
  article.innerHTML = '';
  const div = document.createElement('div');
  div.setAttribute('role', 'button');
  div.setAttribute('style', `width:100px;height:100px;background-image:url(${url})`);
  article.appendChild(div);
  return div;
}

describe('Phase 11 GREEN: 갤러리 재열기 - 변이된 DOM에서도 미디어 재추출', () => {
  const TEST_URL = 'https://pbs.twimg.com/media/reopen_red.jpg';
  let service;

  beforeEach(() => {
    document.body.innerHTML = '';
    service = new MediaExtractionService();
  });

  it('재열기: background-image 로 대체된 경우에도 추출이 성공해야 한다', async () => {
    const { article, img } = createInitialTweetDom(TEST_URL);

    // 1차 추출 (현재 구현에서는 실패 가능하지만, 일반 IMG 기준 성공을 기대하지는 않음)
    await service.extractFromClickedElement(img);

    // 갤러리 닫힘 후 DOM 변이 (이미지 → background-image div)
    const bgDiv = mutateTweetDomToBackground(article, TEST_URL);

    const result = await service.extractFromClickedElement(bgDiv);

    // 기대: GREEN 단계에서 success=true & mediaItems>=1 달성
    expect(result.success, 'DOM 변이 후에도 추출이 성공해야 함').toBe(true);
    expect(result.mediaItems.length).toBeGreaterThan(0);
  });
});
