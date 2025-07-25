/**
 * @fileoverview 브라우저 유틸리티 테스트
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('Browser Utilities', () => {
  let mockWindow: any;

  beforeEach(() => {
    // Get the current window mock from setup
    mockWindow = global.window;

    // Setup specific mock behaviors for media queries
    mockWindow.matchMedia = vi.fn().mockImplementation(query => ({
      matches:
        query.includes('min-width: 768px') ||
        query.includes('prefers-color-scheme: dark') ||
        query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  describe('Environment Detection', () => {
    it('should detect browser environment', () => {
      expect(isBrowserEnvironment()).toBe(true);
    });

    it('should detect non-browser environment', () => {
      // Temporarily mock window as undefined without deleting
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      expect(isBrowserEnvironment()).toBe(false);

      // Restore
      global.window = originalWindow;
    });

    it('should handle missing document', () => {
      const originalDocument = global.document;
      // @ts-ignore
      global.document = undefined;

      expect(isBrowserEnvironment()).toBe(false);

      // Restore
      global.document = originalDocument;
    });
  });

  describe('Safe Browser Object Access', () => {
    it('should return window object safely', () => {
      const win = safeWindow();
      expect(win).toBeTruthy();
      expect(win).toHaveProperty('location');
    });

    it('should return null when window is unavailable', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const win = safeWindow();
      expect(win).toBeNull();

      // Restore
      global.window = originalWindow;
    });

    it('should return location object safely', () => {
      const location = safeLocation();
      expect(location).toBeTruthy();
      expect(location).toHaveProperty('hostname');
    });

    it('should return null when location is unavailable', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const location = safeLocation();
      expect(location).toBeNull();

      // Restore
      global.window = originalWindow;
    });

    it('should return navigator object safely', () => {
      const navigator = safeNavigator();
      expect(navigator).toBeTruthy();
      expect(navigator).toHaveProperty('userAgent');
    });

    it('should return null when navigator is unavailable', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const navigator = safeNavigator();
      expect(navigator).toBeNull();

      // Restore
      global.window = originalWindow;
    });
  });

  describe('Twitter Site Detection', () => {
    it('should detect X.com as Twitter site', () => {
      expect(isTwitterSite()).toBe(true);
    });

    it('should detect twitter.com as Twitter site', () => {
      mockWindow.location.hostname = 'twitter.com';
      expect(isTwitterSite()).toBe(true);
    });

    it('should reject non-Twitter sites', () => {
      mockWindow.location.hostname = 'facebook.com';
      expect(isTwitterSite()).toBe(false);
    });

    it('should handle missing location gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      expect(isTwitterSite()).toBe(false);

      // Restore
      global.window = originalWindow;
    });
  });

  describe('URL Information', () => {
    it('should get current URL info', () => {
      const urlInfo = getCurrentUrlInfo();

      expect(urlInfo).toEqual({
        href: 'https://x.com/user/status/123456789',
        pathname: '/user/status/123456789',
        hostname: 'x.com',
        search: '?lang=en',
      });
    });

    it('should return null when location is unavailable', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const urlInfo = getCurrentUrlInfo();
      expect(urlInfo).toBeNull();

      // Restore
      global.window = originalWindow;
    });
  });

  describe('Scroll Management', () => {
    it('should set scroll position', () => {
      setScrollPosition(100, 200);
      expect(mockWindow.scrollTo).toHaveBeenCalledWith(100, 200);
    });

    it('should handle missing window gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      expect(() => setScrollPosition(100, 200)).not.toThrow();

      // Restore
      global.window = originalWindow;
    });
  });

  describe('Timer Management', () => {
    it('should create safe timeout', () => {
      const callback = vi.fn();
      const timerId = safeSetTimeout(callback, 1000);

      // Node.js 환경에서는 실제 Timeout 객체가 반환되므로 타입과 호출 여부만 확인
      expect(timerId).toBeDefined();
      expect(typeof timerId === 'object' || typeof timerId === 'number').toBe(true);
      expect(mockWindow.setTimeout).toHaveBeenCalledWith(callback, 1000);
    });

    it('should return null when window is unavailable', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const callback = vi.fn();
      const timerId = safeSetTimeout(callback, 1000);

      expect(timerId).toBeNull();

      // Restore
      global.window = originalWindow;
    });

    it('should clear timeout safely', () => {
      safeClearTimeout(123);
      expect(mockWindow.clearTimeout).toHaveBeenCalledWith(123);
    });

    it('should handle null timer ID', () => {
      expect(() => safeClearTimeout(null)).not.toThrow();
    });

    it('should handle missing window when clearing timeout', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      expect(() => safeClearTimeout(123)).not.toThrow();

      // Restore
      global.window = originalWindow;
    });
  });

  describe('Viewport Information', () => {
    it('should get viewport size', () => {
      const size = getViewportSize();

      expect(size).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it('should return zero size when window is unavailable', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const size = getViewportSize();

      expect(size).toEqual({
        width: 0,
        height: 0,
      });

      // Restore
      global.window = originalWindow;
    });

    it('should get device pixel ratio', () => {
      const ratio = getDevicePixelRatio();
      expect(ratio).toBe(1);
    });

    it('should return default pixel ratio when window is unavailable', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const ratio = getDevicePixelRatio();
      expect(ratio).toBe(1);

      // Restore
      global.window = originalWindow;
    });
  });

  describe('Media Query Support', () => {
    it('should match media query', () => {
      const matches = matchesMediaQuery('(min-width: 768px)');
      expect(matches).toBe(true);
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    });

    it('should handle media query errors', () => {
      mockWindow.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error('Invalid query');
      });

      const matches = matchesMediaQuery('invalid-query');
      expect(matches).toBe(false);
    });

    it('should handle missing matchMedia', () => {
      mockWindow.matchMedia = undefined;

      const matches = matchesMediaQuery('(min-width: 768px)');
      expect(matches).toBe(false);
    });

    it('should detect dark mode', () => {
      const darkMode = isDarkMode();
      expect(darkMode).toBe(true);
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should detect reduced motion preference', () => {
      const reducedMotion = prefersReducedMotion();
      expect(reducedMotion).toBe(true);
      expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined window properties gracefully', () => {
      const partialWindow = { location: undefined, navigator: undefined };
      global.window = partialWindow as any;

      expect(safeLocation()).toBeNull();
      expect(safeNavigator()).toBeNull();
    });

    it('should handle corrupted location object', () => {
      mockWindow.location = null;

      expect(getCurrentUrlInfo()).toBeNull();
      expect(isTwitterSite()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial window object', () => {
      global.window = {
        location: { hostname: 'x.com' },
        innerWidth: undefined,
        innerHeight: undefined,
      } as any;

      expect(isTwitterSite()).toBe(true);
      expect(getViewportSize()).toEqual({ width: 0, height: 0 });
    });

    it('should handle window with missing methods', () => {
      global.window = {
        location: mockWindow.location,
        navigator: mockWindow.navigator,
        scrollTo: undefined,
        setTimeout: undefined,
        clearTimeout: undefined,
      } as any;

      expect(() => setScrollPosition(100, 200)).not.toThrow();
      expect(safeSetTimeout(() => {}, 1000)).toBeNull();
    });
  });
});
