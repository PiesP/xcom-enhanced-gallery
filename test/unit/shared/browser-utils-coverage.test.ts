/**
 * @fileoverview browser-utils.ts 추가 커버리지 테스트
 * @description getBrowserInfo 및 Extension API 감지 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  getBrowserInfo,
  isExtensionEnvironment,
  isExtensionContext,
} from '@shared/utils/browser/safe-browser';

/**
 * Mock setup for logger
 */
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('browser-utils - Extended Coverage', () => {
  setupGlobalTestIsolation();

  let originalWindow: typeof globalThis.window | undefined;
  let originalDocument: typeof globalThis.document | undefined;
  let mockWindow: any;

  beforeEach(() => {
    originalWindow = (globalThis as any).window;
    originalDocument = (globalThis as any).document;

    mockWindow = {
      location: { href: 'https://x.com/', hostname: 'x.com', pathname: '/', search: '' },
      navigator: { userAgent: 'Mozilla/5.0', vendor: 'Google Inc.' },
    };

    (globalThis as any).window = mockWindow;
    (globalThis as any).document = {};
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }

    if (originalDocument === undefined) {
      delete (globalThis as any).document;
    } else {
      (globalThis as any).document = originalDocument;
    }

    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. Chrome Detection
  // ============================================================================
  describe('Chrome Browser Detection', () => {
    it('should detect Chrome 120', () => {
      mockWindow.navigator.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
      mockWindow.navigator.vendor = 'Google Inc.';

      const info = getBrowserInfo();
      expect(info.isChrome).toBe(true);
      expect(info.name).toBe('Chrome');
    });

    it('should extract Chrome version 120.0.0.0', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Chrome/120.0.0.0 Safari';
      mockWindow.navigator.vendor = 'Google Inc.';

      const info = getBrowserInfo();
      expect(info.version).toBe('120.0.0.0');
    });
  });

  // ============================================================================
  // 2. Firefox Detection
  // ============================================================================
  describe('Firefox Browser Detection', () => {
    it('should detect Firefox 121', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Firefox/121.0 Gecko/20100101';
      mockWindow.navigator.vendor = '';

      const info = getBrowserInfo();
      expect(info.isFirefox).toBe(true);
      expect(info.name).toBe('Firefox');
    });

    it('should extract Firefox version 121.0', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Firefox/121.5';
      mockWindow.navigator.vendor = '';

      const info = getBrowserInfo();
      expect(info.version).toBe('121.5');
    });
  });

  // ============================================================================
  // 3. Safari Detection
  // ============================================================================
  describe('Safari Browser Detection', () => {
    it('should detect Safari 17', () => {
      mockWindow.navigator.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15';
      mockWindow.navigator.vendor = 'Apple Computer, Inc.';

      const info = getBrowserInfo();
      expect(info.isSafari).toBe(true);
      expect(info.name).toBe('Safari');
    });

    it('should extract Safari version 17.0', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Version/17.2 Safari/605.1.15';
      mockWindow.navigator.vendor = 'Apple Computer, Inc.';

      const info = getBrowserInfo();
      expect(info.version).toBe('17.2');
    });
  });

  // ============================================================================
  // 4. Unknown Browser
  // ============================================================================
  describe('Unknown Browser', () => {
    it('should return Unknown browser flags as false', () => {
      mockWindow.navigator.userAgent = 'UnknownBrowser/1.0';
      mockWindow.navigator.vendor = 'Unknown';

      const info = getBrowserInfo();
      expect(info.isChrome).toBe(false);
      expect(info.isFirefox).toBe(false);
      expect(info.isSafari).toBe(false);
      expect(info.isEdge).toBe(false);
      expect(info.name).toBe('Unknown');
    });

    it('should handle empty navigator', () => {
      delete (globalThis as any).window;
      const info = getBrowserInfo();
      expect(info.name).toBe('Unknown');
    });
  });

  // ============================================================================
  // 5. Chrome Extension Detection
  // ============================================================================
  describe('Chrome Extension Detection', () => {
    it('should detect Chrome extension', () => {
      mockWindow.chrome = { runtime: { id: 'test-id' } };

      expect(isExtensionEnvironment()).toBe(true);
      expect(isExtensionContext()).toBe(true);
    });

    it('should return false without runtime ID', () => {
      mockWindow.chrome = { runtime: {} };

      expect(isExtensionEnvironment()).toBe(false);
      expect(isExtensionContext()).toBe(false);
    });
  });

  // ============================================================================
  // 6. Firefox Extension Detection
  // ============================================================================
  describe('Firefox Extension Detection', () => {
    it('should detect Firefox extension', () => {
      mockWindow.browser = { runtime: { id: 'firefox-id' } };

      expect(isExtensionEnvironment()).toBe(true);
      expect(isExtensionContext()).toBe(true);
    });

    it('should return false without Firefox runtime API', () => {
      mockWindow.browser = {};

      expect(isExtensionEnvironment()).toBe(false);
      expect(isExtensionContext()).toBe(false);
    });
  });

  // ============================================================================
  // 7. Non-Extension Environments
  // ============================================================================
  describe('Non-Extension Environments', () => {
    it('should detect regular web page', () => {
      expect(isExtensionEnvironment()).toBe(false);
      expect(isExtensionContext()).toBe(false);
    });

    it('should handle missing window', () => {
      delete (globalThis as any).window;

      expect(isExtensionEnvironment()).toBe(false);
      expect(isExtensionContext()).toBe(false);
    });

    it('should handle errors gracefully', () => {
      Object.defineProperty(mockWindow, 'chrome', {
        get() {
          throw new Error('Access denied');
        },
      });

      expect(isExtensionEnvironment()).toBe(false);
      expect(isExtensionContext()).toBe(false);
    });
  });

  // ============================================================================
  // 8. Browser Info Structure
  // ============================================================================
  describe('Browser Info Structure', () => {
    it('should return complete browser info object', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 Chrome/120.0.0.0';
      mockWindow.navigator.vendor = 'Google Inc.';

      const info = getBrowserInfo();

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('isChrome');
      expect(info).toHaveProperty('isFirefox');
      expect(info).toHaveProperty('isSafari');
      expect(info).toHaveProperty('isEdge');

      expect(typeof info.name).toBe('string');
      expect(typeof info.version).toBe('string');
      expect(typeof info.isChrome).toBe('boolean');
      expect(typeof info.isFirefox).toBe('boolean');
      expect(typeof info.isSafari).toBe('boolean');
      expect(typeof info.isEdge).toBe('boolean');
    });
  });
});
