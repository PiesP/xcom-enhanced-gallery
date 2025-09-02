/* eslint-env browser */
/**
 * Phase 11 RED: Background-image 고급 품질 휴리스틱
 * 요구사항 (RED):
 * 1) 다중 background-image (comma-separated) 에서 가장 고품질(name 우선순위 orig>large>medium>small) URL 선택
 * 2) name 파라미터 없으면 해상도(파일명 내 숫자 w/h 추정) 또는 마지막(가장 큰 것 가정) 선택
 * 3) 기존 FallbackStrategy 는 첫 번째 url() 만 선택하므로 이 테스트는 현재 실패해야 함
 * NOTE: 단순 파싱을 위해 순수 JS 구문(JSDoc) 사용
 */
import { describe, it, expect } from 'vitest';
import { FallbackStrategy } from '@/shared/services/media-extraction/strategies/fallback/FallbackStrategy';

function buildElement(css, tag = 'div') {
  const el = document.createElement(tag);
  // style 설정 (getComputedStyle mock 으로 대체 예정)
  el.style.backgroundImage = css;
  return el;
}

// getComputedStyle mocking: backgroundImage 반환을 강제
function withBackgroundImages(el, images) {
  const css = images.map(u => `url("${u}")`).join(', ');
  const original = window.getComputedStyle;
  // @ts-ignore
  window.getComputedStyle = () => ({ backgroundImage: css });
  return () => {
    window.getComputedStyle = original;
  };
}

describe('Phase 11 RED: FallbackStrategy background-image 고급 품질 휴리스틱', () => {
  it('orig > large > medium > small 우선순위로 단일 최적 URL만 선택해야 한다 (RED)', async () => {
    const container = document.createElement('div');
    const target = buildElement('');
    container.appendChild(target);

    const urls = [
      'https://pbs.twimg.com/media/IMG_medium?format=jpg&name=medium',
      'https://pbs.twimg.com/media/IMG_small?format=jpg&name=small',
      'https://pbs.twimg.com/media/IMG_orig?format=jpg&name=orig',
      'https://pbs.twimg.com/media/IMG_large?format=jpg&name=large',
    ];
    const restore = withBackgroundImages(target, urls);

    const strat = new FallbackStrategy();
    const result = await strat.extract(container, target, undefined);
    restore();

    expect(result.mediaItems.length, '단일 아이템만 반환해야 한다').toBe(1);
    const only = result.mediaItems[0];
    // 기대: orig 선택 (normalizeMediaUrl 로 url 은 항상 name=orig 로 정규화되므로 메타데이터 품질 레이블을 추가 검증)
    expect(only.url.includes('name=orig'), '선택된 URL이 name=orig 이어야 한다').toBe(true);
    expect(only.metadata?.qualityLabel, '품질 휴리스틱 metadata 품질 레이블 필요').toBe('orig');
    expect(only.metadata?.candidateCount, '다중 URL 후보 수 메타데이터 필요').toBeGreaterThan(1);

    // RED: 현재 구현은 첫 번째 medium 을 선택할 가능성 높음 → selected null 이면 실패로 RED 유지
  });

  it('name 파라미터 없는 URL은 낮은 우선순위로 처리하고 orig가 선택되어야 한다 (RED)', async () => {
    const container = document.createElement('div');
    const target = buildElement('');
    container.appendChild(target);

    const urls = [
      'https://pbs.twimg.com/media/IMG_500x300.jpg',
      'https://pbs.twimg.com/media/IMG_1200x800?format=jpg&name=large',
      'https://pbs.twimg.com/media/IMG_2400x1600?format=jpg&name=orig',
    ];
    const restore = withBackgroundImages(target, urls);

    const strat = new FallbackStrategy();
    const result = await strat.extract(container, target, undefined);
    restore();

    expect(result.mediaItems.length).toBe(1);
    const only = result.mediaItems[0];
    expect(only.url.includes('name=orig')).toBe(true);
    expect(only.metadata?.qualityLabel).toBe('orig');
    expect(only.metadata?.candidateCount).toBeGreaterThan(1);
  });
});
