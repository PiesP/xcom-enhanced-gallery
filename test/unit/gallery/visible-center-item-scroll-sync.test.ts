import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
import { useVisibleCenterItem } from '@/features/gallery/hooks/useVisibleCenterItem';

// Helper to render hook within a simple Preact component for testing
const { h, render } = getPreactSafe();

// jsdom 환경 전제: document / window 존재. 타입 가드 목적 globalThis 선언 보강
declare const document: Document;
declare const window: Window & typeof globalThis;

function createContainerWithItems(count: number, itemHeight = 100) {
  const container = document.createElement('div');
  Object.assign(container.style, { height: '300px', overflow: 'auto', position: 'relative' });

  // Mock container rect
  container.getBoundingClientRect = () => ({
    top: 0,
    left: 0,
    width: 400,
    height: 300,
    bottom: 300,
    right: 400,
    x: 0,
    y: 0,
    toJSON() {},
  });

  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.setAttribute('data-xeg-role', 'gallery-item');
    item.textContent = `item-${i}`;
    Object.assign(item.style, { height: `${itemHeight}px` });
    // Each item's rect relative to container + scrollTop compensation inside hook
    item.getBoundingClientRect = () => ({
      top: i * itemHeight - container.scrollTop,
      left: 0,
      width: 400,
      height: itemHeight,
      bottom: i * itemHeight - container.scrollTop + itemHeight,
      right: 400,
      x: 0,
      y: i * itemHeight - container.scrollTop,
      toJSON() {},
    });
    container.appendChild(item);
  }
  document.body.appendChild(container);
  return container;
}

describe('useVisibleCenterItem scroll sync', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('스크롤 발생 후 centerIndex 값이 스크롤 위치에 따라 변경된다', async () => {
    const container = createContainerWithItems(10);
    const ref = { current: container };
    let observedIndex = -999;

    function Test() {
      const { centerIndex } = useVisibleCenterItem({ containerRef: ref, enabled: true });
      observedIndex = centerIndex;
      return null;
    }
    render(h(Test, {}), document.body);

    // 초기 계산 (top=0) → centerIndex 기록
    const initial = observedIndex; // 초기 -1 허용 (동기 계산 이전 프레임)

    // 스크롤 이동
    container.scrollTop = 180; // 약 1.8 item 높이
    container.dispatchEvent(new Event('scroll'));

    // rAF + idle 대기 (향후 구현 기대) - 현재 구현은 스크롤 이벤트 미수신하여 값 불변 → 테스트 RED
    await new Promise(r => window.requestAnimationFrame(() => window.requestAnimationFrame(r)));
    expect(observedIndex).not.toBe(initial);
  });

  it('setInterval polling 사용을 최소화한다 (0 또는 매우 적은 호출 허용)', () => {
    const original = window.setInterval;
    const spy = vi.fn();
    // @ts-expect-error override for test
    window.setInterval = (...args: any[]) => {
      spy();
      return original(...(args as [any, any]));
    };
    const container = createContainerWithItems(5);
    const ref = { current: container };
    function Test() {
      useVisibleCenterItem({ containerRef: ref, enabled: true });
      return null;
    }
    render(h(Test, {}), document.body);
    // 복원
    window.setInterval = original;
    expect(spy.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
