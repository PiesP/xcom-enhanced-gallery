/**
 * 🔴 RED: Route Scroll Key Builder 세분화 테스트
 * 목표: 타임라인 유형/사용자/미디어 구분이 반영된 키 생성
 * 아직 구현 전이므로 이 테스트는 실패해야 한다.
 */
import { describe, it, expect } from 'vitest';
import { buildRouteScrollKey } from '@shared/scroll/route-scroll-key-builder';

// 기대 규칙 (요약)
// /home -> scroll:timeline:home
// /elonmusk -> scroll:timeline:user:elonmusk:main
// /elonmusk/media -> scroll:timeline:user:elonmusk:media
// /elonmusk/with_replies -> scroll:timeline:user:elonmusk:replies
// /elonmusk/likes -> scroll:timeline:user:elonmusk:likes
// /i/bookmarks -> scroll:timeline:bookmarks
// 기타 경로 -> scroll:raw:<pathname>

describe('� buildRouteScrollKey - 타임라인 세분화', () => {
  const cases: Array<[string, string]> = [
    ['/home', 'scroll:timeline:home'],
    ['/elonmusk', 'scroll:timeline:user:elonmusk:main'],
    ['/elonmusk/media', 'scroll:timeline:user:elonmusk:media'],
    ['/elonmusk/with_replies', 'scroll:timeline:user:elonmusk:replies'],
    ['/elonmusk/likes', 'scroll:timeline:user:elonmusk:likes'],
    ['/i/bookmarks', 'scroll:timeline:bookmarks'],
    ['/some/unknown/path', 'scroll:raw:/some/unknown/path'],
  ];

  it('예상 키 규칙을 따른다', () => {
    for (const [input, expected] of cases) {
      const key = buildRouteScrollKey(input);
      expect(key).toBe(expected);
    }
  });
});
