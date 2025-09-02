// RED 테스트: background-image heuristic v3 (치수 추론/추가 패턴)
// 목표: (1) 쿼리 파라미터 w= / h= 로만 노출되는 치수를 추론하여 픽셀 면적 tie-break 적용
//       (2) 파일명 일부 치수가 '?' 형태로 불완전할 때 완전한 치수 URL 우선
// 현 구현(v2)은 filename내 1234x5678 패턴 중심 → w/h 파라미터 기반 비교 및 불완전 패턴 우선순위 규칙 미지원 예상
/* eslint-env jsdom */
import { describe, it, expect } from 'vitest';
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/DOMDirectExtractor';

function mount(urls: string[]) {
  const article = (globalThis as any).document.createElement('article');
  article.setAttribute('data-testid', 'tweet');
  const div = (globalThis as any).document.createElement('div');
  div.setAttribute('style', `background-image:${urls.map(u => `url("${u}")`).join(', ')}`);
  article.appendChild(div);
  (globalThis as any).document.body.appendChild(article);
  return div;
}

describe('background-image heuristic v3 치수 추론', () => {
  it('쿼리 파라미터 w/h 면적 tie-break: 파일명 숫자(2048) 동점 → w/h area(2048x1152) 고려하여 param URL 선택', async () => {
    const extractor = new DOMDirectExtractor();
    const urls = [
      // filename 에도 2048 숫자를 넣어 baseScore 동점 (name=orig + 2048 토큰) → 현재 구현 정렬 시 인덱스 우선으로 첫번째 선택 (오류)
      'https://pbs.twimg.com/media/IMG_2048_base.jpg?format=jpg&name=orig',
      // 두번째는 w/h 파라미터로 실제 해상도 정보를 제공 → v3 에서는 area 계산 후 우선해야 함
      'https://pbs.twimg.com/media/IMG_param.jpg?format=jpg&name=orig&w=2048&h=1152',
    ];
    const target = mount(urls);
    const res = await extractor.extract(target, {}, 'bg_v3_param');
    expect(res.success).toBe(true);
    // 기대: 개선 후 param (두번째) 선택 → 현재는 첫번째라 실패 → RED
    expect(res.mediaItems[0].url).toContain('w=2048');
  });

  it('불완전 치수 패턴(1600x???) 은 완전 치수(1500x1400) 보다 penalty 적용되어 완전 치수 우선', async () => {
    const extractor = new DOMDirectExtractor();
    const urls = [
      // incomplete: ??? 대신 ??? 사용, sizeRegex 미매칭 → score 상 중립, filename 에 large 토큰 넣어 가산점 유도
      'https://pbs.twimg.com/media/IMG_large_1600x???.jpg?format=jpg&name=orig',
      // complete: 약간 더 작은 숫자 조합이지만 완전한 WxH → v3 규칙상 incomplete 패널티로 이 URL 선택
      'https://pbs.twimg.com/media/IMG_full_1500x1400.jpg?format=jpg&name=orig',
    ];
    const target = mount(urls);
    const res = await extractor.extract(target, {}, 'bg_v3_incomplete');
    expect(res.success).toBe(true);
    expect(res.mediaItems[0].url).toContain('1500x1400');
  });
});
