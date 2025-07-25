/**
 * Browser Utils - 실제 브라우저 환경 시뮬레이션 테스트
 * 환경 감지, 안전한 접const restoreEnvironment = () => {
  if (originalWindow !== undefined) {
    globalThis.window = originalWindow;
  } else {
    delete globalThis.window;
  }

  if (originalDocument !== undefined) {
    globalThis.document = originalDocument;
  } else {
    delete globalThis.document;
  }
};

describe('Browser Utils - Environment Detection', () => {
  beforeEach(() => {
    // 각 테스트 전에 깨끗한 DOM 환경 확보
    if (!globalThis.document || !globalThis.document.body) {
      mockBrowserEnvironment();
    }
  });

  afterEach(() => {
    restoreEnvironment();
  }); 테스트
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
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
} from '@shared/browser/utils/browser-utils';

// 원본 global 객체들 백업
let originalWindow;
let originalDocument;

// 브라우저 환경 모킹 헬퍼
const mockBrowserEnvironment = () => {
  // 원본 백업
  originalWindow = globalThis.window;
  originalDocument = globalThis.document;

  globalThis.window = {
    location: {
      hostname: 'x.com',
      href: 'https://x.com/user/status/123456789',
      pathname: '/user/status/123456789',
      search: '?lang=en',
    },
    navigator: {
      language: 'en-US',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
    },
    scrollTo: vi.fn(),
    setTimeout: vi.fn().mockReturnValue(123),
    clearTimeout: vi.fn(),
  };

  globalThis.document = {
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    createElement: vi.fn(),
    getElementById: vi.fn(),
  };
};

const mockServerEnvironment = () => {
  delete globalThis.window;
  delete globalThis.document;
};

const restoreEnvironment = () => {
  if (originalWindow !== undefined) {
    globalThis.window = originalWindow;
  } else {
    delete globalThis.window;
  }

  if (originalDocument !== undefined) {
    globalThis.document = originalDocument;
  } else {
    delete globalThis.document;
  }
};

describe('Browser Utils - Environment Detection', () => {
  afterEach(() => {
    restoreEnvironment();
    vi.clearAllMocks();
  });

  describe('Environment Detection', () => {
    it('should detect browser environment correctly', () => {
      mockBrowserEnvironment();
      expect(isBrowserEnvironment()).toBe(true);
    });

    it('should detect server environment correctly', () => {
      mockServerEnvironment();
      expect(isBrowserEnvironment()).toBe(false);
    });

    it('should handle partial browser environment', () => {
      globalThis.window = {};
      expect(isBrowserEnvironment()).toBe(true);
    });
  });

  describe('Safe Window Access', () => {
    it('should return window object in browser environment', () => {
      mockBrowserEnvironment();
      const result = safeWindow();
      expect(result).toBe(globalThis.window);
    });

    it('should return null in server environment', () => {
      mockServerEnvironment();
      const result = safeWindow();
      expect(result).toBeNull();
    });

    it('should handle corrupted window object', () => {
      globalThis.window = null;
      const result = safeWindow();
      expect(result).toBeNull();
    });
  });

  describe('Safe Location Access', () => {
    it('should return location object when available', () => {
      mockBrowserEnvironment();
      const result = safeLocation();
      expect(result).toBe(globalThis.window.location);
    });

    it('should return null when window is unavailable', () => {
      mockServerEnvironment();
      const result = safeLocation();
      expect(result).toBeNull();
    });

    it('should handle window without location', () => {
      globalThis.window = {};
      const result = safeLocation();
      expect(result).toBeNull();
    });
  });

  describe('Safe Navigator Access', () => {
    it('should return navigator object when available', () => {
      mockBrowserEnvironment();
      const result = safeNavigator();
      expect(result).toBe(globalThis.window.navigator);
    });

    it('should return null when unavailable', () => {
      mockServerEnvironment();
      const result = safeNavigator();
      expect(result).toBeNull();
    });
  });

  describe('Twitter Site Detection', () => {
    it('should detect X.com correctly', () => {
      globalThis.window = {
        location: { hostname: 'x.com' },
      };
      expect(isTwitterSite()).toBe(true);
    });

    it('should detect Twitter.com correctly', () => {
      globalThis.window = {
        location: { hostname: 'twitter.com' },
      };
      expect(isTwitterSite()).toBe(true);
    });

    it('should detect subdomains correctly', () => {
      globalThis.window = {
        location: { hostname: 'mobile.twitter.com' },
      };
      expect(isTwitterSite()).toBe(true);
    });

    it('should reject non-Twitter sites', () => {
      globalThis.window = {
        location: { hostname: 'example.com' },
      };
      expect(isTwitterSite()).toBe(false);
    });

    it('should handle missing location gracefully', () => {
      globalThis.window = {};
      expect(isTwitterSite()).toBe(false);
    });
  });

  describe('URL Information', () => {
    it('should extract complete URL information', () => {
      mockBrowserEnvironment();
      const result = getCurrentUrlInfo();
      expect(result).toEqual({
        hostname: 'x.com',
        href: 'https://x.com/user/status/123456789',
        pathname: '/user/status/123456789',
        search: '?lang=en',
      });
    });

    it('should handle missing location', () => {
      mockServerEnvironment();
      const result = getCurrentUrlInfo();
      expect(result).toEqual({
        href: '',
        pathname: '',
        hostname: '',
        search: '',
      });
    });

    it('should handle incomplete location object', () => {
      globalThis.window = {
        location: { hostname: 'x.com' },
      };
      const result = getCurrentUrlInfo();
      expect(result.hostname).toBe('x.com');
      expect(result.href).toBe('');
    });
  });

  describe('Scroll Operations', () => {
    it('should call scrollTo when available', () => {
      mockBrowserEnvironment();
      setScrollPosition(100, 200);
      expect(globalThis.window.scrollTo).toHaveBeenCalledWith(100, 200);
    });

    it('should handle missing scrollTo function', () => {
      globalThis.window = {};
      expect(() => setScrollPosition(100, 200)).not.toThrow();
    });

    it('should handle server environment gracefully', () => {
      mockServerEnvironment();
      expect(() => setScrollPosition(100, 200)).not.toThrow();
    });
  });

  describe('Timer Operations', () => {
    describe('Safe Timeout', () => {
      it('should create timeout when available', () => {
        mockBrowserEnvironment();
        const callback = vi.fn();
        const result = safeSetTimeout(callback, 1000);
        expect(result).toBe(123);
        expect(globalThis.window.setTimeout).toHaveBeenCalledWith(callback, 1000);
      });

      it('should return null when setTimeout unavailable', () => {
        globalThis.window = {};
        const callback = vi.fn();
        const result = safeSetTimeout(callback, 1000);
        expect(result).toBeNull();
      });

      it('should handle server environment', () => {
        mockServerEnvironment();
        const callback = vi.fn();
        const result = safeSetTimeout(callback, 1000);
        expect(result).toBeNull();
      });
    });

    describe('Safe Clear Timeout', () => {
      it('should clear timeout when available', () => {
        mockBrowserEnvironment();
        safeClearTimeout(123);
        expect(globalThis.window.clearTimeout).toHaveBeenCalledWith(123);
      });

      it('should handle null timer ID gracefully', () => {
        mockBrowserEnvironment();
        expect(() => safeClearTimeout(null)).not.toThrow();
      });

      it('should handle missing clearTimeout function', () => {
        globalThis.window = {};
        expect(() => safeClearTimeout(123)).not.toThrow();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapidly changing environment', () => {
      mockBrowserEnvironment();
      expect(isBrowserEnvironment()).toBe(true);

      mockServerEnvironment();
      expect(isBrowserEnvironment()).toBe(false);

      mockBrowserEnvironment();
      expect(isBrowserEnvironment()).toBe(true);
    });

    it('should handle frozen window object', () => {
      const frozenWindow = Object.freeze({});
      globalThis.window = frozenWindow;
      expect(() => safeWindow()).not.toThrow();
    });

    it('should handle window with getters that throw', () => {
      globalThis.window = {
        get location() {
          throw new Error('Location access denied');
        },
      };
      expect(() => safeLocation()).not.toThrow();
      expect(safeLocation()).toBeNull();
    });

    it('should handle concurrent timer operations', async () => {
      mockBrowserEnvironment();
      const timers = [];

      for (let i = 0; i < 10; i++) {
        const timer = safeSetTimeout(vi.fn(), 100);
        timers.push(timer);
      }

      timers.forEach(timer => {
        safeClearTimeout(timer);
      });

      expect(globalThis.window.setTimeout).toHaveBeenCalledTimes(10);
      expect(globalThis.window.clearTimeout).toHaveBeenCalledTimes(10);
    });

    it('should handle performance stress test', () => {
      mockBrowserEnvironment();

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        isBrowserEnvironment();
        safeWindow();
        safeLocation();
        safeNavigator();
        isTwitterSite();
      }
      const duration = Date.now() - start;

      // 성능 검증: 1000번 호출이 100ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(100);
    });
  });
});
