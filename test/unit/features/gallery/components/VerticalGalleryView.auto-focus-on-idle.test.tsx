/**
 * @fileoverview VerticalGalleryView 자동 포커스 동기화 테스트
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, h } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';

type ObserverEntry = [target: Element, ratio: number];

type HarnessControls = {
  setShouldAutoFocus: (value: boolean) => void;
  focusIndex: (index: number) => void;
  blurIndex: (index: number) => void;
  forceSync: () => void;
};

describe('VerticalGalleryView auto focus sync (P0)', () => {
  const solid = getSolid();
  const { createSignal } = solid;

  let observers: Array<(entries: globalThis.IntersectionObserverEntry[]) => void> = [];
  let harnessControls: HarnessControls | null = null;

  beforeEach(() => {
    // Phase 190: real timers 사용 (fake timers의 타이밍 이슈 해결)
    vi.useRealTimers();
    observers = [];
    harnessControls = null;

    class MockIntersectionObserver implements globalThis.IntersectionObserver {
      readonly root: Element | globalThis.Document | null;
      readonly rootMargin: string;
      readonly thresholds: ReadonlyArray<number>;
      private readonly callback: globalThis.IntersectionObserverCallback;

      constructor(
        callback: globalThis.IntersectionObserverCallback,
        options?: globalThis.IntersectionObserverInit
      ) {
        this.root = options?.root ?? null;
        this.rootMargin = options?.rootMargin ?? '0px';
        this.thresholds = Array.isArray(options?.threshold)
          ? options.threshold
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
    cleanup();
    vi.useRealTimers();
    observers = [];
    harnessControls = null;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const triggerEntries = (entries: ObserverEntry[]) => {
    const callback = observers.at(-1);
    if (!callback) {
      throw new Error('IntersectionObserver callback가 등록되지 않았습니다.');
    }

    callback(
      entries.map(([target, ratio]) => {
        const rect = target.getBoundingClientRect();
        return {
          target,
          intersectionRatio: ratio,
          isIntersecting: ratio > 0,
          boundingClientRect: rect,
          intersectionRect: rect,
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
          time:
            typeof performance !== 'undefined' && typeof performance.now === 'function'
              ? performance.now()
              : Date.now(),
        } as globalThis.IntersectionObserverEntry;
      })
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
        right: 320,
        width: 320,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } satisfies globalThis.DOMRect;

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
    });
  };

  const setupHarness = async () => {
    const { useGalleryFocusTracker } = await import(
      '@features/gallery/hooks/useGalleryFocusTracker'
    );

    const Harness = () => {
      const [container, setContainer] = createSignal<globalThis.HTMLDivElement | null>(null);
      const [shouldAutoFocus, setShouldAutoFocus] = createSignal(false);

      const tracker = useGalleryFocusTracker({
        container,
        isEnabled: () => true,
        getCurrentIndex: () => 0,
        shouldAutoFocus,
        autoFocusDebounce: 50,
      });

      harnessControls = {
        setShouldAutoFocus: value => {
          setShouldAutoFocus(value);
          tracker.forceSync();
        },
        focusIndex: tracker.handleItemFocus,
        blurIndex: tracker.handleItemBlur,
        forceSync: tracker.forceSync,
      };

      const attach = (index: number) => (element: globalThis.HTMLDivElement | null) => {
        tracker.registerItem(index, element);
      };

      return (
        <div data-testid='gallery-autofocus-root' ref={setContainer} data-focused-index='-1'>
          <div data-index='0' tabIndex={0} ref={attach(0)} />
          <div data-index='1' tabIndex={0} ref={attach(1)} />
          <div data-index='2' tabIndex={0} ref={attach(2)} />
        </div>
      );
    };

    const result = render(h(Harness, {}));
    const root = result.container.querySelector(
      '[data-testid="gallery-autofocus-root"]'
    ) as globalThis.HTMLDivElement;
    const items = Array.from(root.querySelectorAll('[data-index]')) as globalThis.HTMLDivElement[];

    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 360,
      left: 0,
      right: 320,
      width: 320,
      height: 360,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    assignRects(items, [120, 120, 120]);

    return { root, items } as const;
  };

  it('스크롤 중에는 포커스가 이동하지 않다가 idle 시 자동 포커스가 적용된다', async () => {
    const { root, items } = await setupHarness();
    expect(harnessControls).not.toBeNull();
    if (!harnessControls) return;

    triggerEntries(items.map(item => [item, 0.8] as ObserverEntry));
    await vi.runAllTimersAsync();

    expect(document.activeElement).not.toBe(items[1]);

    harnessControls.setShouldAutoFocus(true);
    await vi.runAllTimersAsync();

    expect(document.activeElement).toBe(items[1]);
    expect(root.getAttribute('data-focused-index')).toBe('1');
  });

  it('수동 포커스가 설정된 동안에는 자동 포커스가 덮어쓰지 않는다', async () => {
    const { items } = await setupHarness();
    expect(harnessControls).not.toBeNull();
    if (!harnessControls) return;

    triggerEntries(items.map(item => [item, 0.8] as ObserverEntry));
    // real timers 사용 시 상태 업데이트 대기
    await new Promise(resolve => setTimeout(resolve, 50));

    harnessControls.setShouldAutoFocus(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(items[1]);

    items[2].focus();
    harnessControls.focusIndex(2);

    triggerEntries(items.map(item => [item, 0.8] as ObserverEntry));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(document.activeElement).toBe(items[2]);

    items[2].blur();
    harnessControls.blurIndex(2);
    harnessControls.forceSync();
    triggerEntries(items.map(item => [item, 0.8] as ObserverEntry));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(document.activeElement).toBe(items[1]);
  });
});
