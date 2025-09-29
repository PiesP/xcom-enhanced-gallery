/** @jsxImportSource solid-js */
/**
 * @file visibleIndex 훅/통합 동작 테스트 (RED)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, render, screen, cleanup } from '@test-utils/testing-library';
import { getSolidCore } from '@shared/external/vendors';
import {
  useGalleryVisibleIndex,
  type UseVisibleIndexOptions,
} from '@features/gallery/hooks/useVisibleIndex';

type RectLike = {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
  toJSON?: () => any;
};

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

type VisibleIndexHookProps = {
  container: HTMLElement | null;
  count: number;
  options?: UseVisibleIndexOptions;
};

const renderVisibleIndexHook = (props: VisibleIndexHookProps) =>
  useGalleryVisibleIndex(
    () => props.container,
    props.count,
    props.options ?? { rafCoalesce: false }
  );

const VisibleIndicator = (props: { container: HTMLElement; total: number }) => {
  const { createMemo } = getSolidCore();
  const { visibleIndexAccessor } = useGalleryVisibleIndex(() => props.container, props.total, {
    rafCoalesce: false,
  });

  const currentDisplay = createMemo(() => {
    const index = visibleIndexAccessor();
    return index >= 0 ? index + 1 : 1;
  });

  return (
    <div
      data-testid='indicator'
      data-current={String(currentDisplay())}
      data-total={String(props.total)}
    />
  );
};

describe('useGalleryVisibleIndex — 기본 동작', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    document.body.innerHTML = '';
  });

  it('T1: 폴백(rect) 경로에서 스크롤에 따라 visibleIndex가 갱신된다', async () => {
    const { container } = setupContainerWithItems(6);

    const origGetRect = Element.prototype.getBoundingClientRect;
    const containerRect: RectLike = {
      top: 0,
      left: 0,
      bottom: 400,
      right: 800,
      width: 800,
      height: 400,
      toJSON: () => ({}),
    };
    (container as any).getBoundingClientRect = () => containerRect as any;

    const itemRects = new Map<number, RectLike>();
    const makeRect = (top: number): RectLike => ({
      top,
      left: 0,
      right: 800,
      width: 800,
      height: 300,
      bottom: top + 300,
      toJSON: () => ({}),
    });

    const items = Array.from(
      container.querySelectorAll('[data-xeg-role="gallery-item"]')
    ) as HTMLElement[];
    items.forEach((el, i) => {
      const top = i * 300;
      itemRects.set(i, makeRect(top));
      (el as any).getBoundingClientRect = () => itemRects.get(i) as any;
    });

    const savedIO = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = undefined;

    const hook = renderHook(renderVisibleIndexHook, {
      initialProps: {
        container,
        count: items.length,
        options: { rafCoalesce: false },
      },
    });

    await vi.advanceTimersByTimeAsync(16);
    expect(hook.result.current.visibleIndex).toBe(0);

    const shift = 250;
    items.forEach((_, i) => {
      const top = i * 300 - shift;
      itemRects.set(i, makeRect(top));
    });

    container.dispatchEvent(new Event('scroll'));
    await vi.advanceTimersByTimeAsync(16);
    expect(hook.result.current.visibleIndex).toBe(1);

    hook.unmount();
    (globalThis as any).IntersectionObserver = savedIO;
    (Element.prototype as any).getBoundingClientRect = origGetRect;
  });

  it('T2/T3: 인디케이터는 visibleIndex를 반영하고, visibleIndex 갱신은 auto-scroll을 유발하지 않는다', async () => {
    const { container } = setupContainerWithItems(5);
    const savedIO = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = undefined;

    const spyScrollIntoView = vi.fn();
    const spyScrollTo = vi.fn();
    (Element.prototype as any).scrollIntoView = function () {
      spyScrollIntoView();
    };
    (HTMLElement.prototype as any).scrollTo = function () {
      spyScrollTo();
    };

    render(() => <VisibleIndicator container={container} total={5} />);
    await vi.advanceTimersByTimeAsync(16);
    const node = screen.getByTestId('indicator');
    expect(Number(node.getAttribute('data-current'))).toBe(1);
    expect(Number(node.getAttribute('data-total'))).toBe(5);

    container.dispatchEvent(new Event('scroll'));
    await vi.advanceTimersByTimeAsync(16);

    expect(spyScrollIntoView).not.toHaveBeenCalled();
    expect(spyScrollTo).not.toHaveBeenCalled();

    (globalThis as any).IntersectionObserver = savedIO;
  });
});
