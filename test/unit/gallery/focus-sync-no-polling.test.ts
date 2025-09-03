import { describe, it, expect, vi } from 'vitest';
import { h } from 'preact';
import { render } from 'preact';
import { navigationIntentState } from '@shared/state/signals/navigation-intent.signals';
import { VerticalGalleryView } from '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { getPreactHooks } from '@shared/external/vendors';

// NOTE: This RED test asserts that mounting the gallery while user-scroll intent is active
// does NOT register polling via setInterval. Current implementation uses polling so this test fails (RED).

describe('FocusSync v2 (RED): polling 제거 - setInterval 기반 재계산이 없어야 한다', () => {
  it('user-scroll intent 상태에서 VerticalGalleryView 마운트 시 setInterval 미사용 (polling 제거 예정 RED)', async () => {
    const g: any = globalThis as any;
    if (!g.window) g.window = globalThis;
    const originalSetInterval = g.window.setInterval;
    const pollingSpy = vi.fn();
    g.window.setInterval = (...args: any[]) => {
      const [, delay] = args as [any, number];
      if (delay === 120) {
        pollingSpy();
      }
      return originalSetInterval(...(args as [any, any]));
    };

    navigationIntentState.value = { intent: 'user-scroll', lastUserScrollAt: Date.now() };

    const mediaItems = [
      { id: 'm1', url: 'http://example.com/1.jpg', type: 'image' },
      { id: 'm2', url: 'http://example.com/2.jpg', type: 'image' },
    ] as any;

    const doc: Document | undefined = (globalThis as any).document;
    if (!doc) {
      // 환경이 jsdom 이 아니면 테스트 스킵 (RED 의미 유지)
      return;
    }
    const div = doc.createElement('div');
    doc.body.appendChild(div);
    const { useEffect } = getPreactHooks();

    function Wrapper() {
      useEffect(() => {
        // allow effects to flush
      }, []);
      return h(VerticalGalleryView as any, {
        isVisible: true,
        currentIndex: 0,
        mediaItems,
        onClose: () => {},
      });
    }
    render(h(Wrapper, {}), div);
    await new Promise(r => (globalThis as any).setTimeout(r, 10));
    // FocusSync v1 폴링 주기(120ms) 기반 setInterval 이 더 이상 호출되지 않아야 한다
    expect(pollingSpy).toHaveBeenCalledTimes(0);
    g.window.setInterval = originalSetInterval;
  });
});
