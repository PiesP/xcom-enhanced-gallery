/**
 * @fileoverview 갤러리 이벤트: PC 전용 핫키/이벤트 등록 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const isWindows = process.platform === 'win32';
const ROOT = process.cwd().replace(/\\/g, '/');
const EVENTS_SPEC = isWindows
  ? (`/@fs/${ROOT}/src/shared/utils/events/index.ts` as string)
  : ('@/shared/utils/events' as string);
const SIGNALS_SPEC = isWindows
  ? (`/@fs/${ROOT}/src/shared/state/signals/gallery.signals.ts` as string)
  : ('@/shared/state/signals/gallery.signals' as string);

// 전역 스파이(타입 주석 제거: 파서 호환)
let addSpy;
let removeSpy;

async function importEventsWithVendorsMock() {
  vi.resetModules();

  // Solid.js Signals 모킹 (Phase 2: Solid 전환 대응)
  vi.doMock('@/shared/external/vendors', () => {
    function signal(initial) {
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
    function effect(fn) {
      // 즉시 1회 실행, 언서브 반환
      try {
        fn();
      } catch {
        // 테스트 폴백: effect 콜백 에러 무시
      }
      return () => {};
    }

    function createSignal(initial) {
      let _v = initial;
      const get = () => _v;
      const set = n => {
        _v = n;
      };
      return [get, set];
    }

    function createEffect(fn) {
      try {
        fn();
      } catch {
        // 테스트 폴백: effect 콜백 에러 무시
      }
      return () => {};
    }

    return {
      getPreactSignals: vi.fn(() => ({ signal, effect })),
      getSolid: vi.fn(() => ({ createSignal, createEffect })),
    };
  });

  addSpy = vi.spyOn(globalThis.document, 'addEventListener');
  removeSpy = vi.spyOn(globalThis.document, 'removeEventListener');

  const events = await import(EVENTS_SPEC);
  const signals = await import(SIGNALS_SPEC);

  return {
    initializeGalleryEvents: events.initializeGalleryEvents,
    cleanupGalleryEvents: events.cleanupGalleryEvents,
    openGallery: signals.openGallery,
    closeGallery: signals.closeGallery,
  };
}

describe('Gallery PC-only event policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    addSpy?.mockRestore();
    removeSpy?.mockRestore();
  });

  it('initialize는 click/keydown만 등록하고 touch/pointer는 사용하지 않는다', async () => {
    const { initializeGalleryEvents, cleanupGalleryEvents } = await importEventsWithVendorsMock();

    // 노이즈 제거 후 초기화
    addSpy.mockClear();
    removeSpy.mockClear();

    const handlers = {
      onMediaClick: vi.fn(async () => {}),
      onGalleryClose: vi.fn(() => {}),
      onKeyboardEvent: vi.fn(() => {}),
    };

    await initializeGalleryEvents(handlers, { enableKeyboard: true, enableMediaDetection: false });

    const addTypes = addSpy.mock.calls.map(c => c[0]);
    // 최소 보장: click/keydown은 1회 이상
    expect(addTypes.filter(t => t === 'click').length).toBeGreaterThanOrEqual(1);
    expect(addTypes.filter(t => t === 'keydown').length).toBeGreaterThanOrEqual(1);

    // PC 전용 정책: touch/pointer 이벤트는 등록되지 않아야 함
    const forbidden = [
      'touchstart',
      'touchend',
      'touchmove',
      'pointerdown',
      'pointerup',
      'pointermove',
      'pointercancel',
    ];
    for (const t of forbidden) {
      expect(addTypes.includes(t)).toBe(false);
    }

    await cleanupGalleryEvents();

    const removeTypes = removeSpy.mock.calls.map(c => c[0]);
    expect(removeTypes.includes('click')).toBe(true);
    expect(removeTypes.includes('keydown')).toBe(true);
  });

  it('Escape는 갤러리 열림 상태에서만 onGalleryClose를 호출하고, Enter는 onKeyboardEvent로 위임된다', async () => {
    const { initializeGalleryEvents, openGallery, closeGallery } =
      await importEventsWithVendorsMock();

    const handlers = {
      onMediaClick: vi.fn(async () => {}),
      onGalleryClose: vi.fn(() => {}),
      onKeyboardEvent: vi.fn(() => {}),
    };

    await initializeGalleryEvents(handlers, { enableKeyboard: true, enableMediaDetection: false });

    // 갤러리 닫힘 상태에서 ESC → close 호출 안됨, onKeyboardEvent는 호출됨
    handlers.onGalleryClose.mockClear();
    handlers.onKeyboardEvent.mockClear();
    globalThis.document.dispatchEvent(
      new globalThis.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    expect(handlers.onGalleryClose).not.toHaveBeenCalled();
    expect(handlers.onKeyboardEvent).toHaveBeenCalledTimes(1);

    // 갤러리 열기 후 ESC → close 호출
    openGallery([]);
    handlers.onGalleryClose.mockClear();
    handlers.onKeyboardEvent.mockClear();
    globalThis.document.dispatchEvent(
      new globalThis.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    expect(handlers.onGalleryClose).toHaveBeenCalledTimes(1);

    // Enter는 onGalleryClose를 호출하지 않고 onKeyboardEvent로만 위임
    handlers.onGalleryClose.mockClear();
    handlers.onKeyboardEvent.mockClear();
    globalThis.document.dispatchEvent(
      new globalThis.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    expect(handlers.onGalleryClose).not.toHaveBeenCalled();
    expect(handlers.onKeyboardEvent).toHaveBeenCalledTimes(1);

    // 정리
    closeGallery();
  });
});
