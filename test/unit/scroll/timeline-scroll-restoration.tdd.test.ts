/**
 * @fileoverview 🔴/🟢 TDD: Twitter 타임라인(홈/사용자) 페이지에서 스크롤 위치 복원은 항상 즉시 동작해야 한다.
 * - 글로벌 smooth CSS 존재 여부와 무관
 * - restoreScrollPosition 호출 시 behavior:'auto' 로 호출
 * - smooth=true 요청을 넣어도 무시
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveScrollPosition, restoreScrollPosition } from '@shared/browser';

function setWinScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true });
}

function installGlobalSmooth() {
  const style = document.createElement('style');
  style.textContent = 'html { scroll-behavior: smooth !important; }';
  document.head.appendChild(style);
}

describe('TDD: Timeline immediate scroll restoration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
    setWinScroll(0);
    vi.setSystemTime(Date.now());
  });

  it('홈 타임라인(/, /home) 은 smooth 옵션 true 여도 auto 로 즉시 복원', () => {
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, configurable: true });
    setWinScroll(400);
    expect(saveScrollPosition()).toBe(true);
    setWinScroll(0);
    const ok = restoreScrollPosition(undefined, true); // smooth 요청
    expect(ok).toBe(true);
    const call = (window.scrollTo as any).mock.calls[0][0];
    expect(call.behavior).toBe('auto');
    expect(call.top).toBe(400);
  });

  it('사용자 타임라인(/username) 패턴도 항상 auto 즉시 복원', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/SomeUser123' },
      configurable: true,
    });
    setWinScroll(777);
    expect(saveScrollPosition()).toBe(true);
    setWinScroll(0);
    const ok = restoreScrollPosition(undefined, true);
    expect(ok).toBe(true);
    const call = (window.scrollTo as any).mock.calls[0][0];
    expect(call.behavior).toBe('auto');
    expect(call.top).toBe(777);
  });

  it('글로벌 smooth CSS 존재 시에도 타임라인 강제 auto', () => {
    installGlobalSmooth();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/home' },
      configurable: true,
    });
    setWinScroll(1234);
    expect(saveScrollPosition()).toBe(true);
    setWinScroll(0);
    restoreScrollPosition();
    const call = (window.scrollTo as any).mock.calls[0][0];
    expect(call.behavior).toBe('auto');
  });
});
