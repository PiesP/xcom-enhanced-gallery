import { describe, it, expect, vi } from 'vitest';
import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
import { getPreactHooks } from '@shared/external/vendors';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { setToolbarIntent, markUserScroll } from '@shared/state/signals/navigation-intent.signals';

const { h, render } = getPreactSafe();

/**
 * FOCUS_SYNC v2 STEP 4 – GREEN
 * auto-scroll 예약 후 user-scroll intent 발생 시 예약이 취소되고
 * onAutoScrollCancelled 콜백이 호출되는지 검증.
 */

function TestComponent() {
  const { useRef, useEffect } = getPreactHooks();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemsRootRef = useRef<HTMLDivElement | null>(null);
  const recordRef = useRef<{ startCalled: boolean; cancelCalled: boolean; cancelIndex?: number }>({
    startCalled: false,
    cancelCalled: false,
  });

  // toolbar intent 세팅은 mount 후 1틱에서 수행 (hook 내부 effect 보다 먼저 실행되도록 별도 의존성 없음)
  useEffect(() => {
    setToolbarIntent('next');
  }, []);

  useGalleryItemScroll({ current: containerRef.current }, 1, 3, {
    enabled: true,
    debounceDelay: 80,
    itemsRootRef: itemsRootRef,
    onAutoScrollStart: () => {
      recordRef.current.startCalled = true;
    },
    onAutoScrollCancelled: (index: number) => {
      recordRef.current.cancelCalled = true;
      recordRef.current.cancelIndex = index;
    },
  });

  return h(
    'div',
    { ref: containerRef, id: 'container' },
    h(
      'div',
      { ref: itemsRootRef, id: 'items-root' },
      Array.from({ length: 3 }).map((_, i) =>
        h('div', {
          id: `item-${i}`,
          ref: (el: HTMLElement | null) => {
            if (el) {
              (el as any).scrollIntoView = () => {
                /* noop for test */
              };
            }
          },
        })
      )
    ),
    h('script', null, ((globalThis as any).__XEG_TEST_AUTO_SCROLL_CANCEL__ = recordRef.current))
  );
}

describe('FOCUS_SYNC v2 Step4: user-scroll intent cancels pending auto-scroll', () => {
  it('예약된 auto-scroll 가 user-scroll 로 취소되면 onAutoScrollCancelled 호출 및 start 미호출', () => {
    vi.useFakeTimers();
    let mountPoint: HTMLElement | undefined;
    if (typeof globalThis !== 'undefined' && (globalThis as any).document) {
      const doc = (globalThis as any).document as Document;
      mountPoint = doc.createElement('div');
      doc.body.appendChild(mountPoint);
    }
    render(h(TestComponent, {}), mountPoint);

    // 30ms 경과 후 사용자 스크롤 intent 발생 (예약 중단 기대)
    vi.advanceTimersByTime(30);
    markUserScroll();

    // 디바운스 만료 시간까지 진행
    vi.advanceTimersByTime(200);

    const info = (globalThis as any).__XEG_TEST_AUTO_SCROLL_CANCEL__ as {
      startCalled: boolean;
      cancelCalled: boolean;
      cancelIndex?: number;
    };

    expect(info.startCalled).toBe(false);
    expect(info.cancelCalled).toBe(true);
    expect(info.cancelIndex).toBe(1);
    vi.useRealTimers();
  });
});
