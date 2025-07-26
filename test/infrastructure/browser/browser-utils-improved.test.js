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
} from '../../../src/shared/browser/utils/browser-utils.ts';

describe('Browser Utilities', () => {
  let mockWindow;

  beforeEach(() => {
    // Enhanced mock window with required Twitter detection methods
    mockWindow = {
      document: {
        body: { innerHTML: '' },
        createElement: vi.fn().mockReturnValue({}),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn().mockReturnValue([]),
      },
      location: {
        hostname: 'x.com',
        href: 'https://x.com/user/status/123456789',
        pathname: '/user/status/123456789',
        search: '?lang=en',
      },
      navigator: {
        userAgent: 'Mozilla/5.0 (compatible; Node.js)',
      },
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      // Mock timer functions with spies
      setTimeout: vi.fn().mockImplementation((callback, delay) => {
        return globalThis.setTimeout(callback, delay);
      }),
      clearTimeout: vi.fn().mockImplementation(id => {
        return globalThis.clearTimeout(id);
      }),
      // Mock scroll function with spy
      scrollTo: vi.fn(),
      matchMedia: vi.fn().mockImplementation(query => ({
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
      })),
    };

    // Set as global for browser utilities to access
    globalThis.window = mockWindow;
    globalThis.document = mockWindow.document;
    globalThis.location = mockWindow.location;
    globalThis.navigator = mockWindow.navigator;
  });

  describe('Environment Detection', () => {
    it('should detect browser environment', () => {
      expect(isBrowserEnvironment()).toBe(true);
    });

    it('should detect non-browser environment', () => {
      const originalWindow = globalThis.window;
      globalThis.window = undefined;

      expect(isBrowserEnvironment()).toBe(false);

      // Restore
      globalThis.window = originalWindow;
    });

    it('should handle missing document', () => {
      const originalDocument = globalThis.document;
      globalThis.document = undefined;

      expect(isBrowserEnvironment()).toBe(false);

      // Restore
      globalThis.document = originalDocument;
    });
  });

  describe('Safe Browser Object Access', () => {
    it('should return window object safely', () => {
      const window = safeWindow();
      expect(window).toBeTruthy();
      expect(window).toBe(mockWindow);
    });

    it('should return null when window is unavailable', () => {
      const originalWindow = globalThis.window;
      globalThis.window = undefined;

      const window = safeWindow();
      expect(window).toBeNull();

      // Restore
      globalThis.window = originalWindow;
    });

    it('should return location object safely', () => {
      const location = safeLocation();
      expect(location).toBeTruthy();
      expect(location.hostname).toBe('x.com');
    });

    it('should return null when location is unavailable', () => {
      const originalLocation = globalThis.location;
      globalThis.location = undefined;

      const location = safeLocation();
      expect(location).toBeNull();

      // Restore
      globalThis.location = originalLocation;
    });

    it('should return navigator object safely', () => {
      const navigator = safeNavigator();
      expect(navigator).toBeTruthy();
      expect(navigator.userAgent).toContain('Mozilla');
    });

    it('should return null when navigator is unavailable', () => {
      const originalNavigator = globalThis.navigator;
      globalThis.navigator = undefined;

      const navigator = safeNavigator();
      expect(navigator).toBeNull();

      // Restore
      globalThis.navigator = originalNavigator;
    });
  });

  describe('Twitter Site Detection', () => {
    it('should detect X.com as Twitter site', () => {
      // X.com hostname 설정
      mockWindow.location = {
        ...mockWindow.location,
        hostname: 'x.com',
      };
      globalThis.location = mockWindow.location;
      expect(isTwitterSite()).toBe(true);
    });

    it('should detect twitter.com as Twitter site', () => {
      // twitter.com hostname 설정
      mockWindow.location = {
        ...mockWindow.location,
        hostname: 'twitter.com',
      };
      globalThis.location = mockWindow.location;
      expect(isTwitterSite()).toBe(true);
    });

    it('should reject non-Twitter sites', () => {
      mockWindow.location = {
        ...mockWindow.location,
        hostname: 'example.com',
      };
      globalThis.location = mockWindow.location;
      expect(isTwitterSite()).toBe(false);
    });

    it('should handle missing location gracefully', () => {
      const originalLocation = globalThis.location;
      globalThis.location = undefined;

      expect(isTwitterSite()).toBe(false);

      // Restore
      globalThis.location = originalLocation;
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
      const originalLocation = globalThis.location;
      globalThis.location = undefined;

      const urlInfo = getCurrentUrlInfo();
      expect(urlInfo).toBeNull();

      // Restore
      globalThis.location = originalLocation;
    });
  });

  describe('Scroll Management', () => {
    it('should set scroll position', () => {
      setScrollPosition(100, 200);
      expect(mockWindow.scrollTo).toHaveBeenCalledWith(100, 200);
    });

    it('should handle missing window gracefully', () => {
      const originalWindow = globalThis.window;
      globalThis.window = undefined;

      // Should not throw
      expect(() => setScrollPosition(100, 200)).not.toThrow();

      // Restore
      globalThis.window = originalWindow;
    });
  });

  describe('Timer Management', () => {
    it('should create safe timeout', () => {
      const callback = vi.fn();
      const timerId = safeSetTimeout(callback, 1000);

      expect(timerId).toBeDefined();
      expect(typeof timerId === 'object' || typeof timerId === 'number').toBe(true);
      expect(mockWindow.setTimeout).toHaveBeenCalledWith(callback, 1000);
    });

    it('should return null when window is unavailable', () => {
      const originalWindow = globalThis.window;
      globalThis.window = undefined;

      const callback = vi.fn();
      const timerId = safeSetTimeout(callback, 1000);

      expect(timerId).toBeNull();

      // Restore
      globalThis.window = originalWindow;
    });

    it('should clear timeout safely', () => {
      safeClearTimeout(123);
      expect(mockWindow.clearTimeout).toHaveBeenCalledWith(123);
    });

    it('should handle null timer ID', () => {
      // Should not throw
      expect(() => safeClearTimeout(null)).not.toThrow();
    });

    it('should handle missing window when clearing timeout', () => {
      const originalWindow = globalThis.window;
      globalThis.window = undefined;

      // Should not throw
      expect(() => safeClearTimeout(123)).not.toThrow();

      // Restore
      globalThis.window = originalWindow;
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
      const originalWindow = globalThis.window;
      globalThis.window = undefined;

      const size = getViewportSize();

      expect(size).toEqual({
        width: 0,
        height: 0,
      });

      // Restore
      globalThis.window = originalWindow;
    });

    it('should get device pixel ratio', () => {
      const ratio = getDevicePixelRatio();
      expect(ratio).toBe(1);
    });

    it('should return default pixel ratio when window is unavailable', () => {
      const originalWindow = globalThis.window;
      globalThis.window = undefined;

      const ratio = getDevicePixelRatio();
      expect(ratio).toBe(1);

      // Restore
      globalThis.window = originalWindow;
    });
  });

  describe('Media Query Support', () => {
    it('should match media query', () => {
      const result = matchesMediaQuery('(min-width: 768px)');
      expect(result).toBe(true);
    });

    it('should handle media query errors', () => {
      mockWindow.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error('Invalid query');
      });

      const result = matchesMediaQuery('invalid-query');
      expect(result).toBe(false);
    });

    it('should handle missing matchMedia', () => {
      const originalWindow = globalThis.window;
      globalThis.window = { ...mockWindow, matchMedia: undefined };

      const result = matchesMediaQuery('(min-width: 768px)');
      expect(result).toBe(false);

      // Restore
      globalThis.window = originalWindow;
    });

    it('should detect dark mode', () => {
      const result = isDarkMode();
      expect(result).toBe(true);
    });

    it('should detect reduced motion preference', () => {
      const result = prefersReducedMotion();
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined window properties gracefully', () => {
      globalThis.window = {};

      expect(safeWindow()).toBeTruthy();
      expect(safeLocation()).toBeNull();
      expect(safeNavigator()).toBeNull();
    });

    it('should handle corrupted location object', () => {
      globalThis.window = {
        location: null,
      };

      expect(safeLocation()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial window object', () => {
      globalThis.window = {
        document: mockWindow.document,
      };

      expect(isBrowserEnvironment()).toBe(true);
      expect(safeWindow()).toBeTruthy();
    });

    it('should handle window with missing methods', () => {
      globalThis.window = {
        document: mockWindow.document,
        location: mockWindow.location,
      };

      expect(() => {
        setScrollPosition(0, 0);
        safeSetTimeout(() => {}, 100);
        safeClearTimeout(123);
      }).not.toThrow();
    });
  });
});
