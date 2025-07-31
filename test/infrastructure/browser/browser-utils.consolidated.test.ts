/**
 * Browser Utilities - 통합 테스트
 *
 * @description 브라우저 환경 감지, 안전한 접근, DOM 조작을 위한 통합 테스트
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  isBrowserEnvironment,
  safeWindow,
  safeLocation,
  safeNavigator,
  isTwitterSite,
  getCurrentUrlInfo,
  setScrollPosition,
  safeSetTimeout,
  safeClearTimeout,
  getViewportSize,
  getDevicePixelRatio,
  matchesMediaQuery,
  isDarkMode,
  prefersReducedMotion,
} from '@shared/browser/utils/browser-utils';

describe('Browser Utilities - 통합 테스트', () => {
  let mockWindow: Record<string, any>;
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;

  beforeEach(() => {
    // 환경 백업
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;

    // 완전한 window mock 객체 생성
    mockWindow = {
      location: {
        href: 'https://x.com/test',
        host: 'x.com',
        hostname: 'x.com',
        pathname: '/test',
        search: '?param=value',
        hash: '#section',
        protocol: 'https:',
        origin: 'https://x.com',
      },
      navigator: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        language: 'ko-KR',
        languages: ['ko-KR', 'ko', 'en-US', 'en'],
        platform: 'Win32',
        cookieEnabled: true,
        onLine: true,
      },
      document: {
        documentElement: {
          clientWidth: 1920,
          clientHeight: 1080,
          scrollTop: 0,
          scrollLeft: 0,
        },
        body: {
          scrollTop: 0,
          scrollLeft: 0,
        },
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(() => []),
        createElement: vi.fn(() => ({
          style: {},
          setAttribute: vi.fn(),
          getAttribute: vi.fn(),
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        })),
      },
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      setTimeout: vi.fn((callback, delay) => {
        if (typeof callback === 'function') {
          callback();
        }
        return 1;
      }),
      clearTimeout: vi.fn(),
      matchMedia: vi.fn(query => ({
        matches: query.includes('prefers-color-scheme: dark') ? false : true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      scrollTo: vi.fn(),
      scrollBy: vi.fn(),
    };

    globalThis.window = mockWindow;
    globalThis.document = mockWindow.document;
  });

  afterEach(() => {
    // 환경 복원
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }

    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    } else {
      delete (globalThis as any).document;
    }

    vi.clearAllMocks();
  });

  describe('환경 감지', () => {
    it('브라우저 환경을 올바르게 감지해야 한다', () => {
      expect(isBrowserEnvironment()).toBe(true);
    });

    it('안전한 window 접근을 제공해야 한다', () => {
      const win = safeWindow();
      expect(win).toBeDefined();
      expect(win?.location?.href).toBe('https://x.com/test');
    });

    it('안전한 location 접근을 제공해야 한다', () => {
      const location = safeLocation();
      expect(location).toBeDefined();
      expect(location?.hostname).toBe('x.com');
    });

    it('안전한 navigator 접근을 제공해야 한다', () => {
      const navigator = safeNavigator();
      expect(navigator).toBeDefined();
      expect(navigator?.language).toBe('ko-KR');
    });
  });

  describe('사이트 감지', () => {
    it('X.com 사이트를 올바르게 감지해야 한다', () => {
      expect(isTwitterSite()).toBe(true);
    });

    it('Twitter.com도 X 사이트로 인식해야 한다', () => {
      mockWindow.location.hostname = 'twitter.com';
      expect(isTwitterSite()).toBe(true);
    });

    it('다른 사이트는 X 사이트로 인식하지 않아야 한다', () => {
      mockWindow.location.hostname = 'example.com';
      expect(isTwitterSite()).toBe(false);
    });
  });

  describe('URL 정보 추출', () => {
    it('현재 URL 정보를 올바르게 추출해야 한다', () => {
      const urlInfo = getCurrentUrlInfo();

      expect(urlInfo).toEqual({
        href: 'https://x.com/test',
        hostname: 'x.com',
        pathname: '/test',
        search: '?param=value',
      });
    });

    it('URL 정보가 없을 때 기본값을 반환해야 한다', () => {
      delete mockWindow.location;
      const urlInfo = getCurrentUrlInfo();

      expect(urlInfo).toEqual({
        href: '',
        hostname: '',
        pathname: '',
        search: '',
      });
    });
  });

  describe('스크롤 제어', () => {
    it('스크롤 위치를 설정해야 한다', () => {
      setScrollPosition(100, 50);
      expect(mockWindow.scrollTo).toHaveBeenCalledWith(100, 50);
    });

    it('스크롤 위치가 음수일 때도 전달된 값으로 호출해야 한다', () => {
      setScrollPosition(-10, -5);
      expect(mockWindow.scrollTo).toHaveBeenCalledWith(-10, -5);
    });
  });

  describe('타이머 제어', () => {
    it('안전한 setTimeout을 제공해야 한다', () => {
      const callback = vi.fn();
      const id = safeSetTimeout(callback, 100);

      expect(mockWindow.setTimeout).toHaveBeenCalledWith(callback, 100);
      expect(id).toBe(1);
    });

    it('안전한 clearTimeout을 제공해야 한다', () => {
      safeClearTimeout(1);
      expect(mockWindow.clearTimeout).toHaveBeenCalledWith(1);
    });

    it('window가 없을 때 폴백을 사용해야 한다', () => {
      delete (globalThis as any).window;

      const callback = vi.fn();
      const id = safeSetTimeout(callback, 100);

      expect(id).toBeNull();
    });
  });

  describe('뷰포트 정보', () => {
    it('뷰포트 크기를 올바르게 반환해야 한다', () => {
      const size = getViewportSize();
      expect(size).toEqual({ width: 1920, height: 1080 });
    });

    it('디바이스 픽셀 비율을 반환해야 한다', () => {
      const ratio = getDevicePixelRatio();
      expect(ratio).toBe(1);
    });

    it('window가 없을 때 기본값을 반환해야 한다', () => {
      delete (globalThis as any).window;

      const size = getViewportSize();
      const ratio = getDevicePixelRatio();

      expect(size).toEqual({ width: 0, height: 0 });
      expect(ratio).toBe(1);
    });
  });

  describe('미디어 쿼리', () => {
    it('미디어 쿼리 매칭을 확인해야 한다', () => {
      const matches = matchesMediaQuery('(max-width: 768px)');
      expect(matches).toBe(true);
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
    });

    it('다크 모드를 감지해야 한다', () => {
      const darkMode = isDarkMode();
      expect(darkMode).toBe(false);
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('모션 감소 선호를 감지해야 한다', () => {
      const reducedMotion = prefersReducedMotion();
      expect(reducedMotion).toBe(true);
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('matchMedia가 없을 때 기본값을 반환해야 한다', () => {
      delete mockWindow.matchMedia;

      const matches = matchesMediaQuery('(max-width: 768px)');
      const darkMode = isDarkMode();
      const reducedMotion = prefersReducedMotion();

      expect(matches).toBe(false);
      expect(darkMode).toBe(false);
      expect(reducedMotion).toBe(false);
    });
  });

  describe('예외 상황 처리', () => {
    it('window가 정의되지 않은 환경에서도 안전하게 작동해야 한다', () => {
      delete (globalThis as any).window;
      delete (globalThis as any).document;

      expect(isBrowserEnvironment()).toBe(false);
      expect(safeWindow()).toBeNull();
      expect(safeLocation()).toBeNull();
      expect(safeNavigator()).toBeNull();
      expect(isTwitterSite()).toBe(false);
    });

    it('부분적으로 정의된 window에서도 안전하게 작동해야 한다', () => {
      globalThis.window = {} as any;

      expect(safeLocation()).toBeNull();
      expect(safeNavigator()).toBeNull();
      expect(getCurrentUrlInfo()).toEqual({
        href: '',
        hostname: '',
        pathname: '',
        search: '',
      });
    });
  });
});
