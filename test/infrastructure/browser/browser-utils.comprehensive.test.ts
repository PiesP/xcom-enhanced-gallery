/**
 * Browser Utils - 실제 브라우저 환경 시뮬레이션 테스트
 * 환경 감지, 안전한 접근, 에러 처리 등 실제 시나리오 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// 브라우저 환경 모킹 헬퍼
const mockBrowserEnvironment = () => {
  global.window = {
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
  } as any;

  global.document = {
    createElement: vi.fn(),
    getElementById: vi.fn(),
  } as any;
};

const mockServerEnvironment = () => {
  delete global.window;
  delete global.document;
};

describe('Browser Utils - Environment Detection', () => {
  beforeEach(() => {
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
      global.window = {} as any;
      delete global.document;
      expect(isBrowserEnvironment()).toBe(false);
    });
  });

  describe('Safe Window Access', () => {
    it('should return window object in browser environment', () => {
      mockBrowserEnvironment();
      const result = safeWindow();
      expect(result).toBe(global.window);
    });

    it('should return null in server environment', () => {
      mockServerEnvironment();
      const result = safeWindow();
      expect(result).toBeNull();
    });

    it('should handle corrupted window object', () => {
      global.window = null as any;
      global.document = {} as any;
      const result = safeWindow();
      expect(result).toBeNull();
    });
  });

  describe('Safe Location Access', () => {
    it('should return location object when available', () => {
      mockBrowserEnvironment();
      const result = safeLocation();
      expect(result).toBe(global.window.location);
    });

    it('should return null when window is unavailable', () => {
      mockServerEnvironment();
      const result = safeLocation();
      expect(result).toBeNull();
    });

    it('should handle window without location', () => {
      global.window = {} as any;
      global.document = {} as any;
      const result = safeLocation();
      expect(result).toBeNull();
    });
  });

  describe('Safe Navigator Access', () => {
    it('should return navigator object when available', () => {
      mockBrowserEnvironment();
      const result = safeNavigator();
      expect(result).toBe(global.window.navigator);
    });

    it('should return null when unavailable', () => {
      mockServerEnvironment();
      const result = safeNavigator();
      expect(result).toBeNull();
    });
  });
});

describe('Browser Utils - Twitter Site Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect X.com correctly', () => {
    global.window = {
      location: { hostname: 'x.com' },
    } as any;
    global.document = {} as any;

    expect(isTwitterSite()).toBe(true);
  });

  it('should detect Twitter.com correctly', () => {
    global.window = {
      location: { hostname: 'twitter.com' },
    } as any;
    global.document = {} as any;

    expect(isTwitterSite()).toBe(true);
  });

  it('should detect subdomains correctly', () => {
    const testCases = ['mobile.x.com', 'api.twitter.com', 'www.x.com'];

    testCases.forEach(hostname => {
      global.window = {
        location: { hostname },
      } as any;
      global.document = {} as any;

      expect(isTwitterSite()).toBe(true);
    });
  });

  it('should reject non-Twitter sites', () => {
    const testCases = [
      'facebook.com',
      'instagram.com',
      'example.com',
      'malicious-x.com.evil.com',
      'twitter-clone.com',
      'x-fake.com',
    ];

    testCases.forEach(hostname => {
      global.window = {
        location: { hostname },
      } as any;
      global.document = {} as any;

      expect(isTwitterSite()).toBe(false);
    });
  });

  it('should handle missing location gracefully', () => {
    mockServerEnvironment();
    expect(isTwitterSite()).toBe(false);
  });
});

describe('Browser Utils - URL Information', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract complete URL information', () => {
    mockBrowserEnvironment();
    const result = getCurrentUrlInfo();

    expect(result).toEqual({
      href: 'https://x.com/user/status/123456789',
      pathname: '/user/status/123456789',
      hostname: 'x.com',
      search: '?lang=en',
    });
  });

  it('should handle missing location', () => {
    mockServerEnvironment();
    const result = getCurrentUrlInfo();
    expect(result).toBeNull();
  });

  it('should handle incomplete location object', () => {
    global.window = {
      location: {
        href: 'https://x.com',
        // pathname, hostname, search 누락
      },
    } as any;
    global.document = {} as any;

    const result = getCurrentUrlInfo();
    expect(result?.href).toBe('https://x.com');
    expect(result?.pathname).toBeUndefined();
  });
});

describe('Browser Utils - Scroll Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call scrollTo when available', () => {
    mockBrowserEnvironment();
    setScrollPosition(100, 200);

    expect(global.window.scrollTo).toHaveBeenCalledWith(100, 200);
  });

  it('should handle missing scrollTo function', () => {
    global.window = {} as any;
    global.document = {} as any;

    expect(() => setScrollPosition(100, 200)).not.toThrow();
  });

  it('should handle server environment gracefully', () => {
    mockServerEnvironment();
    expect(() => setScrollPosition(100, 200)).not.toThrow();
  });
});

describe('Browser Utils - Timer Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Safe Timeout', () => {
    it('should create timeout when available', () => {
      mockBrowserEnvironment();
      const callback = vi.fn();

      const result = safeSetTimeout(callback, 1000);

      expect(global.window.setTimeout).toHaveBeenCalledWith(callback, 1000);
      expect(result).toBe(123);
    });

    it('should return null when setTimeout unavailable', () => {
      global.window = {} as any;
      global.document = {} as any;

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

      expect(global.window.clearTimeout).toHaveBeenCalledWith(123);
    });

    it('should handle null timer ID gracefully', () => {
      mockBrowserEnvironment();

      expect(() => safeClearTimeout(null)).not.toThrow();
      expect(global.window.clearTimeout).not.toHaveBeenCalled();
    });

    it('should handle missing clearTimeout function', () => {
      global.window = {} as any;
      global.document = {} as any;

      expect(() => safeClearTimeout(123)).not.toThrow();
    });
  });
});

describe('Browser Utils - Edge Cases and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle rapidly changing environment', () => {
    // 환경이 빠르게 변경되는 시나리오
    mockBrowserEnvironment();
    expect(isBrowserEnvironment()).toBe(true);

    mockServerEnvironment();
    expect(isBrowserEnvironment()).toBe(false);

    mockBrowserEnvironment();
    expect(isBrowserEnvironment()).toBe(true);
  });

  it('should handle frozen window object', () => {
    mockBrowserEnvironment();
    Object.freeze(global.window);

    expect(() => {
      const result = safeWindow();
      expect(result).toBeDefined();
    }).not.toThrow();
  });

  it('should handle window with getters that throw', () => {
    global.window = {
      get location() {
        throw new Error('Access denied');
      },
    } as any;
    global.document = {} as any;

    // 에러가 발생해도 gracefully 처리되어야 함
    const result = safeLocation();
    expect(result).toBeNull();
  });

  it('should handle concurrent timer operations', () => {
    mockBrowserEnvironment();

    // 여러 타이머를 동시에 생성
    const timers = [];
    for (let i = 0; i < 10; i++) {
      const timer = safeSetTimeout(() => {}, i * 100);
      timers.push(timer);
    }

    // 모든 타이머 해제
    timers.forEach(timer => safeClearTimeout(timer));

    expect(global.window.setTimeout).toHaveBeenCalledTimes(10);
    expect(global.window.clearTimeout).toHaveBeenCalledTimes(10);
  });

  it('should handle performance stress test', () => {
    mockBrowserEnvironment();

    // 대량의 호출 테스트
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      expect(isBrowserEnvironment()).toBe(true);
      expect(safeWindow()).toBeDefined();
      expect(isTwitterSite()).toBe(true);
    }
  });
});
