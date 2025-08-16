/**
 * @fileoverview 🟢/🔴 TDD: 전역 html { scroll-behavior: smooth } 환경에서도 즉시 복원 보장 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveScrollPosition, restoreScrollPosition, clearScrollPosition } from '@shared/browser';
import { SCROLL_POSITION_MAX_AGE_MS } from '@shared/browser/browser-environment';

function setWinScroll(x: number, y: number) {
  Object.defineProperty(window, 'scrollX', { value: x, configurable: true });
  Object.defineProperty(window, 'pageXOffset', { value: x, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true });
}

describe('TDD: Global smooth CSS override immediate restoration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());
    const style = document.createElement('style');
    style.setAttribute('data-test', 'global-smooth');
    style.textContent = 'html { scroll-behavior: smooth !important; }';
    document.head.appendChild(style);
    setWinScroll(0, 500);
    window.scrollTo = vi.fn();
  });

  it('즉시 복원은 behavior:auto 로 호출되고 smooth 가 아님', () => {
    expect(saveScrollPosition()).toBe(true);
    setWinScroll(0, 0);
    const ok = restoreScrollPosition(undefined, false);
    expect(ok).toBe(true);
    const first = (window.scrollTo as unknown as vi.Mock).mock.calls[0]?.[0];
    expect(first).toMatchObject({ top: 500, behavior: 'auto' });
    expect(first.behavior).not.toBe('smooth');
    vi.advanceTimersByTime(200);
    expect((window.scrollTo as unknown as vi.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('만료 전에 복원 시 세션 스토리지 항목 제거', () => {
    expect(saveScrollPosition()).toBe(true);
    const keyCountBefore = sessionStorage.length;
    restoreScrollPosition();
    expect(sessionStorage.length).toBeLessThanOrEqual(keyCountBefore - 1);
  });

  it('만료된 항목은 복원되지 않음', () => {
    expect(saveScrollPosition()).toBe(true);
    const key = sessionStorage.key(0);
    if (key) {
      const raw = sessionStorage.getItem(key)!;
      const data = JSON.parse(raw);
      data.timestamp = Date.now() - SCROLL_POSITION_MAX_AGE_MS - 1000;
      sessionStorage.setItem(key, JSON.stringify(data));
    }
    const ok = restoreScrollPosition();
    expect(ok).toBe(false);
  });

  it('clearScrollPosition 후 복원 시도는 실패', () => {
    saveScrollPosition();
    clearScrollPosition();
    const ok = restoreScrollPosition();
    expect(ok).toBe(false);
  });
});
