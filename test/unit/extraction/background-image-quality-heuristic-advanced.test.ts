// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
/**
 * Phase 11 HARDEN: background-image 휴리스틱 고급 시나리오
 * - 동점(score 동일) 상황에서 픽셀 면적(W*H) tie-break 검증
 * - penalty(small) 적용이 큰 해상도 우위를 역전시키는지 (score 우선 > pixels)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';

describe('Phase 11 HARDEN: background-image 고급 휴리스틱', () => {
  let extractor;
  beforeEach(() => {
    document.body.innerHTML = '';
    extractor = new DOMDirectExtractor();
  });

  function mountBg(urls) {
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    const div = document.createElement('div');
    div.setAttribute('style', `background-image:${urls.map(u => `url("${u}")`).join(', ')}`);
    article.appendChild(div);
    document.body.appendChild(article);
    return div;
  }

  it('동일 score (token 없음) 시 더 큰 해상도(WxH) URL 선택 (pixels tie-break)', async () => {
    const urls = [
      // penalty -15 (medium) + size pattern (pixels) → 둘 다 동일 score, 다른 픽셀
      'https://pbs.twimg.com/media/IMG_800x600.jpg?format=jpg&name=medium',
      'https://pbs.twimg.com/media/IMG_1600x1200.jpg?format=jpg&name=medium',
    ];
    const target = mountBg(urls);
    const result = await extractor.extract(target, {}, 'bg_adv_pixels');
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(1);
    expect(result.mediaItems[0].url).toContain('IMG_1600x1200');
  });

  it('penalty(small) 적용된 초대형 해상도보다 score 높은 large 가 우선', async () => {
    // 첫 URL: name=large (+20) → score 20
    // 두 번째 URL: name=large(+20) + 4096(+5) - small penalty(-15) = 10 (픽셀 매우 큼)
    const urls = [
      'https://pbs.twimg.com/media/IMG_1200x800.jpg?format=jpg&name=large',
      'https://pbs.twimg.com/media/IMG_4096x2048_small.jpg?format=jpg&name=large',
    ];
    const target = mountBg(urls);
    const result = await extractor.extract(target, {}, 'bg_adv_penalty');
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(1);
    expect(result.mediaItems[0].url).toContain('IMG_1200x800');
    expect(result.mediaItems[0].url).not.toContain('4096x2048');
  });

  it('orig 토큰 동점 (둘 다 name=orig) 시 더 큰 해상도 선택', async () => {
    // 두 URL 모두 name=orig → 동일 baseScore (50 + 파일명 orig 30 = 80) + pixels tie-break
    const urls = [
      'https://pbs.twimg.com/media/IMG_A_1200x800_orig.jpg?format=jpg&name=orig',
      'https://pbs.twimg.com/media/IMG_B_2048x1536_orig.jpg?format=jpg&name=orig',
    ];
    const target = mountBg(urls);
    const result = await extractor.extract(target, {}, 'bg_adv_orig_pixels');
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(1);
    expect(result.mediaItems[0].url).toContain('IMG_B_2048x1536');
  });
});
