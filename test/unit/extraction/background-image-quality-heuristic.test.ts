// @ts-nocheck
/* eslint-env browser */
/**
 * FallbackStrategy background-image 품질 휴리스틱 GREEN 테스트
 * - 다중 background-image 중 orig > large > medium > small 우선 선택
 * - name 없음은 해상도 추정 또는 낮은 우선순위 처리
 */
import { describe, it, expect } from 'vitest';
import { FallbackStrategy } from '@/shared/services/media-extraction/strategies/fallback/FallbackStrategy';

function buildElement(tag = 'div') {
  const el = document.createElement(tag);
  return el;
}

// getComputedStyle mocking: backgroundImage 강제
function withBackgroundImages(el, urls) {
  const css = urls.map(u => `url("${u}")`).join(', ');
  const original = window.getComputedStyle;
  // @ts-ignore
  window.getComputedStyle = () => ({ backgroundImage: css });
  return () => {
    window.getComputedStyle = original;
  };
}

describe('FallbackStrategy background-image 품질 휴리스틱', () => {
  it('orig > large > medium > small 우선순위로 단일 최적 URL 선택', async () => {
    const container = document.createElement('div');
    const target = buildElement();
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

    expect(result.mediaItems.length).toBeGreaterThanOrEqual(1);
    const best = result.mediaItems[0];
    expect(best.url.includes('name=orig')).toBe(true);
    const quality =
      best.metadata &&
      (best.metadata.qualityLabel ||
        (best.metadata.additionalMetadata && best.metadata.additionalMetadata.qualityLabel));
    expect(quality).toBe('orig');
  });

  it('name 파라미터 없는 URL은 낮은 우선순위이며 orig 선택', async () => {
    const container = document.createElement('div');
    const target = buildElement();
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

    expect(result.mediaItems.length).toBeGreaterThanOrEqual(1);
    const best = result.mediaItems[0];
    expect(best.url.includes('name=orig')).toBe(true);
    const quality =
      best.metadata &&
      (best.metadata.qualityLabel ||
        (best.metadata.additionalMetadata && best.metadata.additionalMetadata.qualityLabel));
    expect(quality).toBe('orig');
  });
});
