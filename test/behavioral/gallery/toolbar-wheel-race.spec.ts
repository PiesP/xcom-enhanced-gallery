import { describe, it, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const document: Document;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function setTimeout(
  handler: (...args: any[]) => void,
  timeout?: number,
  ...args: any[]
): any;
import { getPreactSafe } from '@shared/external/vendors/vendor-api-safe';
import { useGalleryItemScroll } from '@/features/gallery/hooks/useGalleryItemScroll';
import { setToolbarIntent, markUserScroll } from '@shared/state/signals/navigation-intent.signals';

const { h, render } = getPreactSafe();

describe('FocusSync race: toolbar navigation 직후 빠른 wheel', () => {
  it('toolbar intent 직후 user-scroll 발생 시 auto-scroll 실행 취소', async () => {
    const container = document.createElement('div');
    Object.assign(container.style, { height: '200px', overflow: 'auto' });
    container.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      width: 300,
      height: 200,
      bottom: 200,
      right: 300,
      x: 0,
      y: 0,
      toJSON() {},
    });
    for (let i = 0; i < 8; i++) {
      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      Object.assign(item.style, { height: '160px' });
      item.getBoundingClientRect = () => ({
        top: i * 160 - container.scrollTop,
        left: 0,
        width: 300,
        height: 160,
        bottom: i * 160 - container.scrollTop + 160,
        right: 300,
        x: 0,
        y: i * 160 - container.scrollTop,
        toJSON() {},
      });
      container.appendChild(item);
    }
    document.body.appendChild(container);
    const ref = { current: container };
    let cancelled = 0;

    function Test() {
      useGalleryItemScroll(ref, 5, 8, {
        debounceDelay: 50,
        behavior: 'smooth',
        onAutoScrollCancelled: () => {
          cancelled++;
        },
      });
      setToolbarIntent('next');
      // 10ms 뒤 wheel 발생 → user-scroll intent → 예약된 auto-scroll 취소 기대
      setTimeout(() => markUserScroll(), 10);
      return null;
    }
    render(h(Test, {}), document.body);
    await new Promise(r => setTimeout(r, 400));
    expect(cancelled).toBeGreaterThanOrEqual(1);
  });
});
