/**
 * @fileoverview 브라우저 유틸리티 테스트 (browser-utils)
 *
 * Phase 170B+: 현대적 패턴 적용
 * - Mock 객체 단순화 및 일관성 확보
 * - JSDOM 환경에서 안전하고 효율적인 테스트
 * - 불필요한 edge cases 정리
 *
 * Phase 282 Step 2: import 경로 수정 (utils/browser/safe-browser 직접 사용)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  getCurrentUrlInfo,
  getDevicePixelRatio,
  getViewportSize,
  isBrowserEnvironment,
  isDarkMode,
  isTwitterSite,
  matchesMediaQuery,
  prefersReducedMotion,
  safeClearTimeout,
  safeLocation,
  safeNavigator,
  safeSetTimeout,
  safeWindow,
  setScrollPosition,
} from '@shared/utils/browser/safe-browser';

/** 테스트용 window 모킹 팩토리 */
const createMockWindow = (overrides: Record<string, any> = {}) =>
  ({
    location: {
      href: 'https://x.com/user/status/123456789',
      hostname: 'x.com',
      pathname: '/user/status/123456789',
      search: '?lang=en',
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    },
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    scrollTo: vi.fn(),
    setTimeout: vi.fn((cb: any, delay: number) => globalThis.setTimeout(cb, delay)),
    clearTimeout: vi.fn((id: any) => globalThis.clearTimeout(id)),
    matchMedia: vi.fn((query: string) => ({
      matches:
        query.includes('min-width: 768px') ||
        query.includes('prefers-color-scheme: dark') ||
        query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    ...overrides,
  }) as any;

describe('Browser Utilities', () => {
  setupGlobalTestIsolation();

  let originalWindow: any;
  let mockWindow: any;

  beforeEach(() => {
    originalWindow = globalThis.window;
    mockWindow = createMockWindow();
    (globalThis as any).window = mockWindow;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('Environment Detection', () => {
    it('should detect browser environment', () => {
      expect(isBrowserEnvironment()).toBe(true);
    });

    it('should detect server environment when window is undefined', () => {
      (globalThis as any).window = undefined;
      expect(isBrowserEnvironment()).toBe(false);
    });
  });

  describe('Safe Browser Object Access', () => {
    it('should return window object safely', () => {
      const win = safeWindow();
      expect(win).toBeTruthy();
      expect(win).toHaveProperty('location');
    });

    it('should return null when window unavailable', () => {
      (globalThis as any).window = undefined;
      expect(safeWindow()).toBeNull();
    });

    it('should return location object safely', () => {
      const location = safeLocation();
      expect(location).toBeTruthy();
      expect(location.hostname).toBe('x.com');
    });

    it('should return navigator object safely', () => {
      const navigator = safeNavigator();
      expect(navigator).toBeTruthy();
      expect(navigator.userAgent).toContain('Chrome');
    });
  });

  describe('Twitter Site Detection', () => {
    it('should detect X.com correctly', () => {
      expect(isTwitterSite()).toBe(true);
    });

    it('should detect twitter.com', () => {
      mockWindow.location.hostname = 'twitter.com';
      expect(isTwitterSite()).toBe(true);
    });

    it('should reject non-Twitter sites', () => {
      mockWindow.location.hostname = 'facebook.com';
      expect(isTwitterSite()).toBe(false);
    });

    it('should handle missing location', () => {
      (globalThis as any).window = { navigator: {} };
      expect(isTwitterSite()).toBe(false);
    });
  });

  describe('URL Information', () => {
    it('should extract current URL info', () => {
      const info = getCurrentUrlInfo();
      expect(info.hostname).toBe('x.com');
      expect(info.href).toContain('x.com');
      expect(info.pathname).toBe('/user/status/123456789');
    });

    it('should handle missing location', () => {
      (globalThis as any).window = {};
      const info = getCurrentUrlInfo();
      expect(info.href).toBe('');
      expect(info.hostname).toBe('');
    });
  });

  describe('Scroll Management', () => {
    it('should call scrollTo when available', () => {
      setScrollPosition(100, 200);
      expect(mockWindow.scrollTo).toHaveBeenCalledWith(100, 200);
    });

    it('should handle missing scrollTo gracefully', () => {
      mockWindow.scrollTo = undefined;
      expect(() => setScrollPosition(100, 200)).not.toThrow();
    });
  });

  describe('Timer Management', () => {
    it('should create safe timeout', () => {
      const callback = vi.fn();
      const timerId = safeSetTimeout(callback, 1000);
      expect(timerId).toBeDefined();
      expect(mockWindow.setTimeout).toHaveBeenCalledWith(callback, 1000);
    });

    it('should return null when setTimeout unavailable', () => {
      mockWindow.setTimeout = undefined;
      const timerId = safeSetTimeout(vi.fn(), 1000);
      expect(timerId).toBeNull();
    });

    it('should clear timeout safely', () => {
      safeClearTimeout(123);
      expect(mockWindow.clearTimeout).toHaveBeenCalledWith(123);
    });

    it('should handle null timer ID gracefully', () => {
      expect(() => safeClearTimeout(null)).not.toThrow();
    });
  });

  describe('Viewport Information', () => {
    it('should get viewport size', () => {
      const size = getViewportSize();
      expect(size).toEqual({ width: 1920, height: 1080 });
    });

    it('should return zero size when window unavailable', () => {
      mockWindow.innerWidth = undefined;
      mockWindow.innerHeight = undefined;
      const size = getViewportSize();
      expect(size).toEqual({ width: 0, height: 0 });
    });

    it('should get device pixel ratio', () => {
      const ratio = getDevicePixelRatio();
      expect(ratio).toBe(1);
    });
  });

  describe('Media Query Support', () => {
    it('should match media query', () => {
      const matches = matchesMediaQuery('(min-width: 768px)');
      expect(matches).toBe(true);
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    });

    it('should handle media query errors gracefully', () => {
      mockWindow.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error('Invalid query');
      });
      const matches = matchesMediaQuery('invalid');
      expect(matches).toBe(false);
    });

    it('should detect dark mode', () => {
      const darkMode = isDarkMode();
      expect(darkMode).toBe(true);
    });

    it('should detect reduced motion preference', () => {
      const reducedMotion = prefersReducedMotion();
      expect(reducedMotion).toBe(true);
    });
  });
});
