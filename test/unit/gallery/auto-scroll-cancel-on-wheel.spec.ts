import { describe, it, expect, vi } from 'vitest';
import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
import { useGalleryItemScroll } from '@/features/gallery/hooks/useGalleryItemScroll';
import { setAutoIntent, markUserScroll } from '@shared/state/signals/navigation-intent.signals';
import { getPreactHooks } from '@shared/external/vendors';

const { h, render } = getPreactSafe();
const { useEffect } = getPreactHooks();

// jsdom globals
declare const document: Document;
// minimal globals
declare const setTimeout: any;

describe('FocusSync: auto-scroll cancel (debounce intent change)', () => {
  it('디바운스 대기 중 intent=user-scroll 로 변경되면 auto-scroll 취소 콜백 1회 호출', async () => {
    const container = document.createElement('div');
    Object.assign(container.style, { height: '200px', overflow: 'auto' });
    container.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      width: 200,
      height: 200,
      bottom: 200,
      right: 200,
      x: 0,
      y: 0,
      toJSON() {},
    });
    for (let i = 0; i < 3; i++) {
      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      Object.assign(item.style, { height: '150px' });
      item.getBoundingClientRect = () => ({
        top: i * 150 - container.scrollTop,
        left: 0,
        width: 200,
        height: 150,
        bottom: i * 150 - container.scrollTop + 150,
        right: 200,
        x: 0,
        y: i * 150 - container.scrollTop,
        toJSON() {},
      });
      container.appendChild(item);
    }
    document.body.appendChild(container);
    const ref = { current: container };
    const cancelled = vi.fn();
    // intent 먼저 설정 (실제 흐름: intent 설정 후 index 변경 → effect 디바운스 예약)
    setAutoIntent();
    function TestDebounce() {
      useGalleryItemScroll(ref, 2, 3, {
        behavior: 'auto',
        debounceDelay: 70,
        onAutoScrollCancelled: cancelled,
      });
      useEffect(() => {
        const t = setTimeout(() => markUserScroll(), 25); // intent flips before debounce fires
        return () => clearTimeout(t);
      }, []);
      return null;
    }
    render(h(TestDebounce, {}), document.body);
    await new Promise(r => setTimeout(r, 160));
    expect(cancelled).toHaveBeenCalledTimes(1);
  });
});
