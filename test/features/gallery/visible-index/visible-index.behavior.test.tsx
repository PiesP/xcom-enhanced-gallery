/**
 * @file visibleIndex 훅/통합 동작 테스트 (RED)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/preact';

// 간단한 테스트용 컨테이너/아이템 마크업 생성 유틸
function setupContainerWithItems(count = 5) {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'relative',
    height: '400px',
    overflow: 'auto',
  });
  const itemsRoot = document.createElement('div');
  itemsRoot.setAttribute('data-xeg-role', 'items-container');
  container.appendChild(itemsRoot);
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.setAttribute('data-xeg-role', 'gallery-item');
    item.setAttribute('data-index', String(i));
    Object.assign(item.style, {
      height: '300px',
    });
    itemsRoot.appendChild(item);
  }
  document.body.appendChild(container);
  return { container, itemsRoot };
}

describe('useGalleryVisibleIndex — 기본 동작', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('T1: 폴백(rect) 경로에서 스크롤에 따라 visibleIndex가 갱신된다', async () => {
    const { container } = setupContainerWithItems(6);

    // getBoundingClientRect 모킹: 컨테이너는 0~400, 각 아이템 300 높이, 스크롤로 위치 변화 모사
    const origGetRect = Element.prototype.getBoundingClientRect;
    const containerRect = {
      top: 0,
      left: 0,
      bottom: 400,
      right: 800,
      width: 800,
      height: 400,
      toJSON: () => ({}),
    } as any;
    (container as any).getBoundingClientRect = () => containerRect;

    // 각 아이템의 rect는 스크롤 위치에 따라 top/bottom 이동
    const itemRects = new Map<number, any>();
    const makeRect = (top: number): any =>
      ({
        top,
        left: 0,
        right: 800,
        width: 800,
        height: 300,
        bottom: top + 300,
        toJSON: () => ({}),
      }) as any;

    const items = Array.from(container.querySelectorAll('[data-xeg-role="gallery-item"]'));
    items.forEach((el, i) => {
      const top = i * 300; // 초기 배치
      itemRects.set(i, makeRect(top));
      (el as any).getBoundingClientRect = () => itemRects.get(i)!;
    });

    // IntersectionObserver 비활성화 강제 → 폴백 경로 사용
    const savedIO = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = undefined;

    const { useGalleryVisibleIndex } = await import('@features/gallery/hooks/useVisibleIndex');
    const { getPreactHooks } = await import('@shared/external/vendors');
    const { h } = await import('@shared/external/vendors').then(v => v.getPreact());
    const { useRef } = getPreactHooks();

    function Test() {
      const ref = useRef<HTMLElement | null>(null);
      // ref는 런타임에 바인딩
      (ref as any).current = container as unknown as HTMLElement;
      const { visibleIndex } = useGalleryVisibleIndex(ref as any, items.length, {
        rafCoalesce: false,
      });
      return h('div', { 'data-testid': 'vi', 'data-value': String(visibleIndex) });
    }

    render(h(Test as any, {}));

    // 초기 스크롤 0 → 아이템0이 대부분 보임
    await vi.advanceTimersByTimeAsync(16);
    let node = screen.getByTestId('vi');
    expect(Number(node.getAttribute('data-value'))).toBe(0);

    // 스크롤을 250만큼 내리면 아이템1이 더 크게 보이게 됨
    const shift = 250;
    items.forEach((_, i) => {
      const top = i * 300 - shift;
      itemRects.set(i, makeRect(top));
    });
    container.dispatchEvent(new Event('scroll'));
    await vi.advanceTimersByTimeAsync(16);
    node = screen.getByTestId('vi');
    expect(Number(node.getAttribute('data-value'))).toBe(1);

    // 원복
    (globalThis as any).IntersectionObserver = savedIO;
    (Element.prototype as any).getBoundingClientRect = origGetRect;
  });

  it('T2/T3: 인디케이터는 visibleIndex를 반영하고, visibleIndex 갱신은 auto-scroll을 유발하지 않는다', async () => {
    const { container } = setupContainerWithItems(5);
    const savedIO = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = undefined;

    // scrollIntoView/scrollTo 스파이
    const spyScrollIntoView = vi.fn();
    const spyScrollTo = vi.fn();
    (Element.prototype as any).scrollIntoView = function () {
      spyScrollIntoView();
    };
    (HTMLElement.prototype as any).scrollTo = function () {
      spyScrollTo();
    };

    const { useGalleryVisibleIndex } = await import('@features/gallery/hooks/useVisibleIndex');
    const { h } = await import('@shared/external/vendors').then(v => v.getPreact());
    const { getPreactHooks } = await import('@shared/external/vendors');
    const { useRef } = getPreactHooks();

    function Indicator({ current, total }: { current: number; total: number }) {
      return h('div', {
        'data-testid': 'indicator',
        'data-current': String(current),
        'data-total': String(total),
      });
    }

    function Test() {
      const ref = useRef<HTMLElement | null>(null);
      (ref as any).current = container as unknown as HTMLElement;
      const { visibleIndex } = useGalleryVisibleIndex(ref as any, 5, { rafCoalesce: false });
      // currentIndex는 0이라 가정(변경 없음). indicator에는 visibleIndex 사용
      const display = visibleIndex >= 0 ? visibleIndex : 0;
      return h(Indicator as any, { current: display + 1, total: 5 });
    }

    render(h(Test as any, {}));
    await vi.advanceTimersByTimeAsync(16);
    const node = screen.getByTestId('indicator');
    // 초기에는 첫 아이템
    expect(Number(node.getAttribute('data-current'))).toBe(1);
    expect(Number(node.getAttribute('data-total'))).toBe(5);

    // 스크롤 이벤트를 발생시켜 visibleIndex가 변했다고 가정
    container.dispatchEvent(new Event('scroll'));
    await vi.advanceTimersByTimeAsync(16);

    // 자동 스크롤이 유발되지 않아야 함
    expect(spyScrollIntoView).not.toHaveBeenCalled();
    expect(spyScrollTo).not.toHaveBeenCalled();

    (globalThis as any).IntersectionObserver = savedIO;
  });
});
