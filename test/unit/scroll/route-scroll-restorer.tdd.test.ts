import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// RED test for route scroll restorer bug: saving new route instead of previous
import {
  initializeRouteScrollRestorer,
  cleanupRouteScrollRestorer,
} from '@shared/scroll/route-scroll-restorer';

// Access sessionStorage directly (jsdom)

function getStored(key: string) {
  const raw = sessionStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

describe('[scroll][route] RouteScrollRestorer navigation save/restore (RED)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    cleanupRouteScrollRestorer();
  });
  afterEach(() => {
    cleanupRouteScrollRestorer();
  });

  it('이전 경로의 스크롤 위치를 저장하고 새 경로로 이동 후, 되돌아올 때 복원해야 한다', async () => {
    // 1. 초기 경로 '/home'
    history.pushState({}, '', '/home');

    // 2. 초기화
    initializeRouteScrollRestorer({ enable: true, smooth: false, immediate: true });

    // 3. 현재 스크롤 위치 (home) 모킹
    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 600, configurable: true });

    // 4. 다른 경로로 이동 (bookmarks) -> 이 시점에 '/home' 위치가 저장되어야 함
    history.pushState({}, '', '/i/bookmarks');

    const savedHome = getStored('scroll:timeline:home');
    // 버그 존재 시: null (잘못된 키에 저장됨)
    expect(savedHome, '이전 경로(/home)의 스크롤 위치가 저장되어야 한다').not.toBeNull();
    expect(savedHome?.y).toBe(600);

    // 5. 새 경로(/i/bookmarks)에서 다른 스크롤 값 설정
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 120, configurable: true });

    const scrollToSpy = vi.spyOn(window, 'scrollTo');

    // 6. 다시 /home 으로 이동 -> 저장된 600 위치 복원 기대
    history.pushState({}, '', '/home');

    // jsdom 타이밍 반영 (immediate 모드 이지만 micro task flush)
    await Promise.resolve();

    // 복원 로직이 호출되었는지 확인
    const calledWith = scrollToSpy.mock.calls.find(call => {
      const arg = call[0] as any;
      if (typeof arg === 'object') return arg.top === 600 || arg.y === 600;
      return false;
    });

    expect(calledWith, 'scrollTo 가 600 위치로 호출되어야 한다').toBeTruthy();
  });
});
