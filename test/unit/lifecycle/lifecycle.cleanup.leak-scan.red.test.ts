import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// R4 RED: 타이머/리스너 누수 스캔. TimerManager/DOMEventManager 경유 정리 보장

describe('R4 — lifecycle cleanup leak scan (RED)', () => {
  let originalSetTimeout: typeof globalThis.setTimeout;
  let originalSetInterval: typeof globalThis.setInterval;
  let originalClearTimeout: typeof globalThis.clearTimeout;
  let originalClearInterval: typeof globalThis.clearInterval;
  let originalAddEventListener: any;
  let originalRemoveEventListener: any;
  let EventTargetCtor: any;
  let readyStateDescriptor: PropertyDescriptor | undefined;

  let activeTimeouts = 0;
  let activeIntervals = 0;
  let activeListeners = 0;

  const timeoutIds = new Set<number>();
  const intervalIds = new Set<number>();

  beforeEach(() => {
    // 원본 보관
    originalSetTimeout = globalThis.setTimeout.bind(globalThis) as any;
    originalSetInterval = globalThis.setInterval.bind(globalThis) as any;
    originalClearTimeout = globalThis.clearTimeout.bind(globalThis) as any;
    originalClearInterval = globalThis.clearInterval.bind(globalThis) as any;
    EventTargetCtor = (globalThis as any).EventTarget || (globalThis as any).window?.EventTarget;
    if (!EventTargetCtor) {
      // 최소한의 EventTarget 폴백
      class ET {}
      (ET as any).prototype = {
        addEventListener() {},
        removeEventListener() {},
      };
      EventTargetCtor = ET as any;
    }
    originalAddEventListener = EventTargetCtor.prototype.addEventListener;
    originalRemoveEventListener = EventTargetCtor.prototype.removeEventListener;

    activeTimeouts = 0;
    activeIntervals = 0;
    activeListeners = 0;
    timeoutIds.clear();
    intervalIds.clear();

    // 타이머 스파이 (활성 카운트 추적)
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((cb: any, ms?: number) => {
      let id: any;
      const wrapped = () => {
        // 실행 시 활성 타임아웃 감소
        if (typeof id === 'number' && timeoutIds.has(id)) {
          timeoutIds.delete(id);
          activeTimeouts = Math.max(0, activeTimeouts - 1);
        }
        try {
          cb?.();
        } catch {}
      };
      id = originalSetTimeout(wrapped, ms as any) as unknown as number;
      timeoutIds.add(id);
      activeTimeouts++;
      return id as any;
    }) as any);

    vi.spyOn(globalThis, 'setInterval').mockImplementation(((cb: any, ms?: number) => {
      const id = originalSetInterval(cb, ms as any) as unknown as number;
      intervalIds.add(id);
      activeIntervals++;
      return id as any;
    }) as any);

    vi.spyOn(globalThis, 'clearTimeout').mockImplementation(((id: any) => {
      if (typeof id === 'number' && timeoutIds.has(id)) {
        timeoutIds.delete(id);
        activeTimeouts = Math.max(0, activeTimeouts - 1);
      }
      return originalClearTimeout(id as any) as any;
    }) as any);

    vi.spyOn(globalThis, 'clearInterval').mockImplementation(((id: any) => {
      if (typeof id === 'number' && intervalIds.has(id)) {
        intervalIds.delete(id);
        activeIntervals = Math.max(0, activeIntervals - 1);
      }
      return originalClearInterval(id as any) as any;
    }) as any);

    // 모든 대상의 add/removeEventListener 후킹 (Window/Document/Element 포함)
    vi.spyOn(EventTargetCtor.prototype, 'addEventListener').mockImplementation(function (
      this: any,
      type: any,
      listener: any,
      options?: any
    ) {
      activeListeners++;
      return originalAddEventListener.call(this, type, listener, options);
    } as any);

    vi.spyOn(EventTargetCtor.prototype, 'removeEventListener').mockImplementation(function (
      this: any,
      type: any,
      listener: any,
      options?: any
    ) {
      activeListeners = Math.max(0, activeListeners - 1);
      return originalRemoveEventListener.call(this, type, listener, options);
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('main.start → main.cleanup 후 타이머/리스너 잔여가 0이어야 한다(의도적으로 RED)', async () => {
    // 모듈 캐시 초기화 및 readyState를 loading으로 강제하여 DOMContentLoaded 리스너 경로 유도
    vi.resetModules();
    try {
      const doc = (globalThis as any).document;
      readyStateDescriptor = Object.getOwnPropertyDescriptor(doc, 'readyState');
      Object.defineProperty(doc, 'readyState', { value: 'loading', configurable: true });
    } catch (_e) {
      void _e; // ignore if jsdom doesn't allow redefine
    }

    const main = await import('@/main');

    await main.default.start();

    // 유휴 작업 기회 부여
    await Promise.resolve();

    await main.default.cleanup();

    // 기대: 모든 타이머와 리스너가 매니저를 통해 정리되어 전역 잔여가 0
    // 현재 구현이 전역에서 직접 등록한다면 이 테스트는 RED가 될 수 있다.
    expect(activeTimeouts + activeIntervals + activeListeners).toBe(0);
  });

  afterEach(() => {
    // readyState 복원
    if (readyStateDescriptor) {
      try {
        const doc = (globalThis as any).document;
        Object.defineProperty(doc, 'readyState', readyStateDescriptor);
      } catch (_e) {
        void _e; // ignore
      }
    }
  });
});
