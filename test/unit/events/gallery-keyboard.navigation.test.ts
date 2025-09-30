import * as solid from 'solid-js';
import * as solidStore from 'solid-js/store';
import * as solidWeb from 'solid-js/web';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function setup() {
  vi.resetModules();

  // Mock preact signals used by events module
  vi.doMock('@/shared/external/vendors', () => {
    function signal(initial: any) {
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
    function effect(fn: () => void) {
      try {
        fn();
      } catch (_e) {
        // ignore
      }
      return () => {};
    }
    return {
      getPreactSignals: vi.fn(() => ({ signal, effect })),
      getSolidCore: vi.fn(() => ({
        createSignal: solid.createSignal,
        createEffect: solid.createEffect,
        createMemo: solid.createMemo,
        createRoot: solid.createRoot,
        createComputed: solid.createComputed,
        createComponent: solid.createComponent,
        mergeProps: solid.mergeProps,
        splitProps: solid.splitProps,
        onCleanup: solid.onCleanup,
        batch: solid.batch,
        untrack: solid.untrack,
        createContext: solid.createContext,
        useContext: solid.useContext,
      })),
      getSolidStore: vi.fn(() => ({
        createStore: solidStore.createStore,
        produce: solidStore.produce,
        reconcile: solidStore.reconcile,
        unwrap: solidStore.unwrap,
      })),
      getSolidWeb: vi.fn(() => ({ render: solidWeb.render })),
    };
  });

  const events = await import('@/shared/utils/events');
  const signals = await import('@/shared/state/signals/gallery.signals');
  return { ...events, ...signals };
}

describe('Gallery keyboard navigation (Home/End/Page/Arrow/Space)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles keys only when gallery is open and prevents default for navigation keys', async () => {
    const { initializeGalleryEvents, cleanupGalleryEvents, openGallery, closeGallery } =
      await setup();

    const handled: string[] = [];
    await initializeGalleryEvents(
      {
        onMediaClick: vi.fn(async () => {}),
        onGalleryClose: vi.fn(() => handled.push('close')),
        onKeyboardEvent: vi.fn((e: KeyboardEvent) => handled.push(e.key)),
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
    // End는 세로 스크롤 키이므로 preventDefault 호출되지 않음
    expect(r.defaultPrevented).toBe(false);

    handled.length = 0;
    r = dispatchKey('PageDown');
    expect(handled.includes('PageDown')).toBe(true);
    // PageDown은 세로 스크롤 키이므로 preventDefault 호출되지 않음
    expect(r.defaultPrevented).toBe(false);

    handled.length = 0;
    r = dispatchKey('PageUp');
    expect(handled.includes('PageUp')).toBe(true);
    // PageUp은 세로 스크롤 키이므로 preventDefault 호출되지 않음
    expect(r.defaultPrevented).toBe(false);

    handled.length = 0;
    r = dispatchKey('ArrowLeft');
    expect(handled.includes('ArrowLeft')).toBe(true);
    // ArrowLeft는 갤러리 네비게이션 키이므로 preventDefault 호출됨
    expect(r.defaultPrevented).toBe(true);

    handled.length = 0;
    r = dispatchKey('ArrowRight');
    expect(handled.includes('ArrowRight')).toBe(true);
    // ArrowRight는 갤러리 네비게이션 키이므로 preventDefault 호출됨
    expect(r.defaultPrevented).toBe(true);

    handled.length = 0;
    r = dispatchKey(' ');
    expect(handled.includes(' ')).toBe(true);
    // Space는 비디오 재생 제어 키이므로 preventDefault 호출됨
    expect(r.defaultPrevented).toBe(true);

    // cleanup
    closeGallery();
    cleanupGalleryEvents();
  });
});
