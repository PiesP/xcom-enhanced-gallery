// @vitest-environment jsdom
/**
 * GREEN: background-image heuristic v2 - 'small' / 'thumb' 네이밍 패턴 패널티 적용 검증
 * 개선된 구현은 낮은 해상도/축소 힌트 단어(small|thumb|tiny|crop|fit|medium) 등장 시 점수 패널티를 부여하여
 * 동일 해상도/스코어 상황에서 비-패널티 URL을 선택해야 한다.
 */
import { describe, it, expect } from 'vitest';
// 아직 v2 유틸이 존재하지 않음 -> 추후 GREEN 단계에서 제공 예정
import { DOMDirectExtractor } from '@/shared/services/media-extraction/extractors/DOMDirectExtractor';

// Private 메서드이므로 간접 테스트: DOM 요소 구성 후 extractMediaFromContainer 흐름을 유도하기엔 과하므로
// 간단히 전용 테스트용 서브클래스로 heuristic 접근 (리팩터링 시 공개 유틸로 이동 예정)
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
