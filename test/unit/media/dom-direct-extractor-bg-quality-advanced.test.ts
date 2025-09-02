// @vitest-environment jsdom
// @ts-nocheck
/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { DOMDirectExtractor } from '@shared/services/media-extraction/extractors/DOMDirectExtractor';

/**
 * RED: background-image 고급 품질 휴리스틱
 * 현 구현(selectBestBackgroundImageUrl)은 name 파라미터 / large|orig 패턴 / 2048|4096 힌트만 사용.
 * 아래 케이스에서는 세 URL 모두 동일한 (비인식) name 값(origSmall)과 패턴으로 점수 0 → 현재 구현은 "마지막" URL을 선택.
 * 개선 목표(GREEN): 해상도 패턴 (WxH) 파싱하여 가장 큰 픽셀 면적(url1:2400x1800)이 선택되도록 확장.
 */
describe('RED: DOMDirectExtractor background-image 고급 품질 휴리스틱', () => {
  let extractor;
  beforeEach(() => {
    document.body.innerHTML = '';
    extractor = new DOMDirectExtractor();
  });

  async function runExtraction(el) {
    return extractor.extract(el, {}, 'bg_quality_adv');
  }

  it('WxH 해상도 기반 최대 면적 URL을 선택해야 한다 (현재는 마지막 URL 선택 -> FAIL 예상)', async () => {
    const article = document.createElement('article');
    const div = document.createElement('div');
    // 의도된 순서: 가장 큰 2400x1800 이 첫 번째 (면적 4,320,000)
    // 이후 더 낮은 680x680 (462,400), 마지막 1200x800 (960,000)
    // 기존 로직: 점수 동률(0) → 기본 last 선택 → 1200x800 선택 (FAIL)
    // 목표 로직: 면적 비교로 2400x1800 선택 (PASS)
    div.setAttribute(
      'style',
      'background-image: url(https://pbs.twimg.com/media/AAA_2400x1800.jpg?format=jpg&name=origSmall), url(https://pbs.twimg.com/media/AAA_680x680.jpg?format=jpg&name=origSmall), url(https://pbs.twimg.com/media/AAA_1200x800.jpg?format=jpg&name=origSmall);'
    );
    article.appendChild(div);
    document.body.appendChild(article);

    const result = await runExtraction(div);
    expect(result.success).toBe(true);
    expect(result.mediaItems.length).toBe(1);
    const selected = result.mediaItems[0].url;
    // RED 기대: 아직 구현 전이므로 실패 (selected에 1200x800 포함될 것)
    expect(selected).toContain('2400x1800');
  });
});
