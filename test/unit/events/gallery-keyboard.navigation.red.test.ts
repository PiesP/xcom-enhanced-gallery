import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function setup() {
  vi.resetModules();

  // Mock preact signals used by events module
  vi.doMock('@/shared/external/vendors', () => {
    function createSignal(initial: any) {
      let _v = initial;
      return {
        get value() {
          return _v;
        },
        set value(n) {
          _v = n;
        },
      };
    }
    function createEffect(fn: () => void) {
      try {
        fn();
      } catch (_e) {
        // ignore
      }
      return () => {};
    }
    const signal = createSignal;
    const effect = createEffect;
    return { getSolid: vi.fn(() => ({ signal, effect })) };
  });

  const events = await import('@/shared/utils/events');
  const signals = await import('@/shared/state/signals/gallery.signals');
  return { ...events, ...signals };
}

describe('Gallery keyboard navigation (Home/End/Page/Arrow/Space)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles keys only when gallery is open and prevents default for navigation keys (E2E 이관 완료: Phase 82.7 K6)', async () => {
    const { initializeGalleryEvents, cleanupGalleryEvents, openGallery, closeGallery } =
      await setup();

    const handled: string[] = [];
    await initializeGalleryEvents(
      {
        onMediaClick: vi.fn(async () => {}),
        onGalleryClose: vi.fn(() => handled.push('close')),
        onKeyboardEvent: vi.fn((e: { key?: string }) => handled.push((e && e.key) as string)),
      },
      { enableKeyboard: true, enableMediaDetection: false }
    );

    function dispatchKey(key: string) {
      const EvCtor: any = (globalThis as any).KeyboardEvent;
      const ev = new EvCtor('keydown', { key, bubbles: true, cancelable: true });
      const ok = (globalThis as any).document.dispatchEvent(ev);
      return { defaultPrevented: ev.defaultPrevented, dispatched: ok };
    }

    // 닫힘 상태: ESC/Enter 등은 onKeyboardEvent로만 위임, preventDefault는 강제하지 않음
    handled.length = 0;
    let r = dispatchKey('Home');
    expect(handled.includes('Home')).toBe(true);
    // 갤러리 닫힘 상태에서는 스크롤 방지 의무 없음
    // open
    openGallery([]);

    handled.length = 0;
    r = dispatchKey('End');
    expect(handled.includes('End')).toBe(true);
    expect(r.defaultPrevented).toBe(true);

    handled.length = 0;
    r = dispatchKey('PageDown');
    expect(handled.includes('PageDown')).toBe(true);
    expect(r.defaultPrevented).toBe(true);

    handled.length = 0;
    r = dispatchKey('PageUp');
    expect(handled.includes('PageUp')).toBe(true);
    expect(r.defaultPrevented).toBe(true);

    handled.length = 0;
    r = dispatchKey('ArrowLeft');
    expect(handled.includes('ArrowLeft')).toBe(true);
    expect(r.defaultPrevented).toBe(true);

    handled.length = 0;
    r = dispatchKey('ArrowRight');
    expect(handled.includes('ArrowRight')).toBe(true);
    expect(r.defaultPrevented).toBe(true);

    handled.length = 0;
    r = dispatchKey(' ');
    expect(handled.includes(' ')).toBe(true);
    expect(r.defaultPrevented).toBe(true);

    // cleanup
    closeGallery();
    cleanupGalleryEvents();
  });
});
