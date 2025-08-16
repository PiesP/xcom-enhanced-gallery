import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  SCROLL_POSITION_MAX_AGE_MS,
} from '@shared/browser';
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';

// Helper to mutate sessionStorage easily
function readRaw(key: string) {
  return sessionStorage.getItem(key);
}

// build key logic duplicated (경로 기반 네임스페이스) - 간단히 현재 pathname 사용
function expectedKey(base = 'scrollPosition') {
  const pathname = window.location.pathname;
  if (!pathname || pathname === '/' || base !== 'scrollPosition') return base;
  return `${base}:${pathname}`;
}

describe('ScrollPositionController / browser-environment integration', () => {
  const KEY = expectedKey();

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    (window as any).pageXOffset = 0;
    (window as any).pageYOffset = 0;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('saves current scroll position', () => {
    (window as any).scrollX = 10;
    (window as any).scrollY = 250;
    const ok = saveScrollPosition();
    expect(ok).toBe(true);
    const raw = readRaw(KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.y).toBe(250);
  });

  it('restores saved position immediately without smooth behavior', () => {
    (window as any).scrollX = 0;
    (window as any).scrollY = 300;
    saveScrollPosition();

    const spy = vi.spyOn(window, 'scrollTo').mockImplementation((arg: any) => {
      // simulate applying scroll position
      if (typeof arg === 'object') {
        (window as any).pageXOffset = arg.left ?? 0;
        (window as any).pageYOffset = arg.top ?? 0;
      }
    });

    const ok = restoreScrollPosition(undefined, false);
    expect(ok).toBe(true);
    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls.at(-1)?.[0];
    expect(callArg.behavior).toBe('auto');
  });

  it('removes saved data after successful restore (idempotent restore second time returns false)', () => {
    (window as any).scrollX = 0;
    (window as any).scrollY = 111;
    saveScrollPosition();
    const first = restoreScrollPosition();
    const second = restoreScrollPosition();
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('discards expired saved position based on timestamp', () => {
    // 인위적으로 만료된 항목 저장
    const expired = { x: 0, y: 400, timestamp: Date.now() - (SCROLL_POSITION_MAX_AGE_MS + 10) };
    sessionStorage.setItem(KEY, JSON.stringify(expired));
    const ok = restoreScrollPosition();
    expect(ok).toBe(false);
    expect(readRaw(KEY)).toBeNull();
  });

  it('controller delayed mode schedules restore (returns true even before execution)', () => {
    (window as any).scrollX = 0;
    (window as any).scrollY = 999;
    saveScrollPosition();
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const ok = ScrollPositionController.restore({ mode: 'delayed' });
    expect(ok).toBe(true);
    // requestAnimationFrame 2회 체인 flush (jsdom에서는 16ms 단위 setTimeout으로 모킹)
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalled();
  });

  it('smooth option triggers smooth behavior parameter', () => {
    (window as any).scrollX = 0;
    (window as any).scrollY = 555;
    saveScrollPosition();
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    restoreScrollPosition(undefined, true);
    const arg = spy.mock.calls.at(-1)?.[0];
    expect(arg.behavior).toBe('smooth');
  });

  it('clear removes existing saved position explicitly', () => {
    (window as any).scrollX = 0;
    (window as any).scrollY = 42;
    saveScrollPosition();
    expect(readRaw(KEY)).toBeTruthy();
    clearScrollPosition();
    expect(readRaw(KEY)).toBeNull();
  });
});
