import { describe, it, expect } from 'vitest';
import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
import { getPreactHooks } from '@shared/external/vendors';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';

const { h, render } = getPreactSafe();

/**
 * RED 테스트:
 * 현재 구현은 container.children[index] 를 직접 사용한다.
 * 컨테이너 구조에 header / toolbar wrapper 등이 끼어있을 경우 잘못된 요소 선택.
 * v2에서는 itemsRootRef(실제 아이템 래퍼)를 별도 전달하여 정확한 item 선택 예정.
 */

function TestComponent() {
  const { useRef, useEffect } = getPreactHooks();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemsRootRef = useRef<HTMLDivElement | null>(null);
  const scrolled = useRef<{ targetId?: string }>({});

  useEffect(() => {
    // Wait for refs to be set
    setTimeout(() => {
      if (!containerRef.current || !itemsRootRef.current) {
        console.log('Missing refs:', {
          container: !!containerRef.current,
          itemsRoot: !!itemsRootRef.current,
        });
        return;
      }

      const api = useGalleryItemScroll({ current: containerRef.current }, 1, 3, {
        enabled: true,
        debounceDelay: 0,
        itemsRootRef,
      });
      api.scrollToItem(1);
    }, 0);
  }, []);

  return h(
    'div',
    { ref: containerRef },
    h('div', { id: 'header' }),
    h(
      'div',
      { ref: itemsRootRef, id: 'items-root' },
      Array.from({ length: 3 }).map((_, i) =>
        h('div', {
          id: `item-${i}`,
          'data-idx': i,
          ref: (el: HTMLElement | null) => {
            if (el) {
              // scrollIntoView 를 가로채어 호출 대상 기록
              (el as any).scrollIntoView = () => {
                scrolled.current.targetId = el.id;
                (globalThis as any).__XEG_TEST_FOCUS_SYNC_RED__ = scrolled.current;
              };
            }
          },
        })
      )
    )
  );
}

describe('FOCUS_SYNC v2 RED: container vs itemsRoot children mismatch', () => {
  it.skip('현재는 item-1 이 아닌 다른 요소를 스크롤 대상으로 선택할 수 있다 (GREEN 시 item-1)', () => {
    // This test is skipped because the focus sync functionality is not yet fully implemented
    // When implemented, this should test that incorrect elements are selected due to
    // container.children[index] instead of itemsRootRef.children[index]
    const doc: Document | undefined = (globalThis as any).document;
    if (!doc) return; // jsdom 환경 보장
    const host = doc.createElement('div');
    doc.body.appendChild(host);
    render(h(TestComponent, {}), host);
    const info = (globalThis as any).__XEG_TEST_FOCUS_SYNC_RED__ as { targetId?: string };
    expect(info?.targetId).toBe('item-1'); // GREEN 기대 (Step2 구현 후 통과)
  });
});
