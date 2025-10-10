/**
 * @fileoverview VerticalGalleryView 포커스 추적 회귀 테스트
 * @description IntersectionObserver 기반 자동 포커스 감지가 의도대로 동작하는지 검증
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, h } from '../../../../utils/testing-library';
import { getSolid } from '@shared/external/vendors';

const solid = getSolid();
const { createSignal, onCleanup } = solid;

type ObserverEntry = [target: Element, ratio: number];

describe('VerticalGalleryView focus tracking integration', () => {
  const rafCallbacks: Array<(time: number) => void> = [];
  const observers: Array<(entries: globalThis.IntersectionObserverEntry[]) => void> = [];

  beforeEach(() => {
    vi.useFakeTimers();

    vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    class MockIntersectionObserver implements globalThis.IntersectionObserver {
      readonly root: Element | globalThis.Document | null;
      readonly rootMargin = '0px';
      readonly thresholds: ReadonlyArray<number>;
      private readonly callback: globalThis.IntersectionObserverCallback;

      constructor(
        callback: globalThis.IntersectionObserverCallback,
        options?: globalThis.IntersectionObserverInit
      ) {
        this.root = options?.root ?? null;
        this.thresholds = Array.isArray(options?.threshold)
          ? options!.threshold!
          : [options?.threshold ?? 0];
        this.callback = callback;
        observers.push(entries => this.callback(entries, this));
      }

      observe(): void {
        /* noop */
      }
      unobserve(): void {
        /* noop */
      }
      disconnect(): void {
        /* noop */
      }
      takeRecords(): globalThis.IntersectionObserverEntry[] {
        return [];
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    rafCallbacks.splice(0, rafCallbacks.length);
    observers.splice(0, observers.length);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const flushAnimationFrame = () => {
    while (rafCallbacks.length > 0) {
      const callback = rafCallbacks.shift();
      callback?.(performance.now());
    }
  };

  const triggerEntries = (entries: ObserverEntry[]) => {
    const callback = observers.at(-1);
    if (!callback) {
      throw new Error('IntersectionObserver callback가 등록되지 않았습니다.');
    }

    callback(
      entries.map(
        ([target, ratio]) =>
          ({
            target,
            intersectionRatio: ratio,
            isIntersecting: ratio > 0,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: target.parentElement?.getBoundingClientRect() ?? {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              width: 0,
              height: 0,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
            time: performance.now(),
          }) as globalThis.IntersectionObserverEntry
      )
    );
  };

  const assignRects = (elements: Element[], heights: number[]) => {
    const cumulativeOffsets: number[] = [];
    heights.reduce((offset, height, index) => {
      cumulativeOffsets[index] = offset;
      return offset + height;
    }, 0);

    elements.forEach((element, index) => {
      const top = cumulativeOffsets[index];
      const height = heights[index];
      const rect = {
        top,
        bottom: top + height,
        left: 0,
        right: 300,
        width: 300,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } satisfies globalThis.DOMRect;

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
    });
  };

  it('뷰포트 중앙에 가장 가까운 아이템을 focusedIndex로 노출해야 함', async () => {
    const { useGalleryFocusTracker } = await import(
      '@features/gallery/hooks/useGalleryFocusTracker'
    );

    const Harness = () => {
      const [container, setContainer] = createSignal<globalThis.HTMLDivElement | null>(null);
      const { focusedIndex, registerItem, forceSync } = useGalleryFocusTracker({
        container,
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      onCleanup(() => {
        forceSync?.();
      });

      const attach = (index: number) => (element: globalThis.HTMLDivElement | null) => {
        registerItem(index, element);
      };

      return (
        <div data-testid='root' ref={setContainer} data-focused={focusedIndex() ?? -1}>
          <div data-index='0' ref={attach(0)} />
          <div data-index='1' ref={attach(1)} />
          <div data-index='2' ref={attach(2)} />
        </div>
      );
    };

    const { container } = render(h(Harness, {}));

    const root = container.querySelector('[data-testid="root"]') as globalThis.HTMLDivElement;
    const items = Array.from(root.querySelectorAll('[data-index]')) as globalThis.HTMLDivElement[];

    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 300,
      left: 0,
      right: 300,
      width: 300,
      height: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    assignRects(items, [120, 120, 120]);

    triggerEntries(items.map(item => [item, 0.8] as ObserverEntry));
    flushAnimationFrame();

    await vi.runAllTimersAsync();

    expect(root.getAttribute('data-focused')).toBe('1');
  });

  it('수동 포커스가 설정되면 자동 계산보다 우선시되어야 함', async () => {
    const { useGalleryFocusTracker } = await import(
      '@features/gallery/hooks/useGalleryFocusTracker'
    );

    const Harness = () => {
      const [container, setContainer] = createSignal<globalThis.HTMLDivElement | null>(null);
      const { focusedIndex, registerItem, handleItemFocus, handleItemBlur } =
        useGalleryFocusTracker({
          container,
          isEnabled: () => true,
          getCurrentIndex: () => 0,
        });

      const attach = (index: number) => (element: globalThis.HTMLDivElement | null) => {
        registerItem(index, element);
      };

      return (
        <div data-testid='root' ref={setContainer} data-focused={focusedIndex() ?? -1}>
          <div data-index='0' ref={attach(0)} />
          <div data-index='1' ref={attach(1)} />
          <div data-index='2' ref={attach(2)} />
          <button
            data-testid='focus-button'
            onClick={() => {
              handleItemFocus(2);
            }}
            onBlur={() => {
              handleItemBlur(2);
            }}
          >
            focus
          </button>
        </div>
      );
    };

    const { container } = render(h(Harness, {}));
    const root = container.querySelector('[data-testid="root"]') as globalThis.HTMLDivElement;
    const items = Array.from(root.querySelectorAll('[data-index]')) as globalThis.HTMLDivElement[];

    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 300,
      left: 0,
      right: 300,
      width: 300,
      height: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    assignRects(items, [120, 120, 120]);

    triggerEntries(items.map(item => [item, 0.8] as ObserverEntry));
    flushAnimationFrame();
    await vi.runAllTimersAsync();
    expect(root.getAttribute('data-focused')).toBe('1');

    const focusButton = container.querySelector(
      '[data-testid="focus-button"]'
    ) as globalThis.HTMLButtonElement;
    focusButton.click();
    flushAnimationFrame();

    expect(root.getAttribute('data-focused')).toBe('2');

    focusButton.dispatchEvent(new globalThis.FocusEvent('blur'));
    flushAnimationFrame();

    triggerEntries(items.map(item => [item, 0.8] as ObserverEntry));
    flushAnimationFrame();
    await vi.runAllTimersAsync();
    expect(root.getAttribute('data-focused')).toBe('1');
  });
});
