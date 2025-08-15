import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  __test_only_buildScrollKey,
  SCROLL_POSITION_MAX_AGE_MS,
} from '@shared/browser/browser-environment';

function setWindowScroll(x: number, y: number) {
  Object.defineProperty(window, 'scrollX', { value: x, configurable: true });
  Object.defineProperty(window, 'pageXOffset', { value: x, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true });
}

describe('Scroll Position Enhancements', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: new URL('https://x.com/example/path'),
      writable: true,
    });
    setWindowScroll(120, 345);
    window.scrollTo = vi.fn();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());
  });

  it('builds namespaced key for non-root path', () => {
    const key = __test_only_buildScrollKey();
    expect(key).toBe('scrollPosition:/example/path');
  });

  it('saves, restores and clears scroll position automatically (instant restore object call)', () => {
    expect(saveScrollPosition()).toBe(true);
    const namespacedKey = __test_only_buildScrollKey();
    expect(sessionStorage.getItem(namespacedKey)).toBeTruthy();
    expect(restoreScrollPosition()).toBe(true);
    // 첫 호출: 객체 형태 (behavior: auto)
    const firstCallArgs = (window.scrollTo as unknown as vi.Mock).mock.calls[0][0];
    expect(firstCallArgs).toMatchObject({ left: 120, top: 345, behavior: 'auto' });
    expect(sessionStorage.getItem(namespacedKey)).toBeNull();
  });

  it('discards expired entries', () => {
    saveScrollPosition();
    const namespacedKey = __test_only_buildScrollKey();
    const raw = sessionStorage.getItem(namespacedKey)!;
    const data = JSON.parse(raw);
    data.timestamp = Date.now() - SCROLL_POSITION_MAX_AGE_MS - 1000;
    sessionStorage.setItem(namespacedKey, JSON.stringify(data));
    expect(restoreScrollPosition()).toBe(false);
    expect(sessionStorage.getItem(namespacedKey)).toBeNull();
  });

  it('performs secondary correction when initial offset remains', () => {
    // Save at Y=345
    expect(saveScrollPosition()).toBe(true);
    // 사용자 스크롤이 위로 이동했다고 가정 (0)
    setWindowScroll(0, 0);
    expect(restoreScrollPosition()).toBe(true);
    // 첫 즉시 호출
    expect((window.scrollTo as unknown as vi.Mock).mock.calls[0][0]).toMatchObject({ top: 345 });
    // jsdom에서는 scrollY 자동 업데이트가 안 되므로 차이 남아서 2차 보정 예정
    vi.advanceTimersByTime(200);
    expect((window.scrollTo as unknown as vi.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('clearScrollPosition removes namespaced entry', () => {
    saveScrollPosition();
    const namespacedKey = __test_only_buildScrollKey();
    expect(sessionStorage.getItem(namespacedKey)).toBeTruthy();
    clearScrollPosition();
    expect(sessionStorage.getItem(namespacedKey)).toBeNull();
  });
});
