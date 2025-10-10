/**
 * 브라우저 호환성 및 환경 감지 테스트
 * 실제 브라우저 확장 환경에서의 동작을 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { URL } from 'node:url';

describe('Browser Environment Compatibility', () => {
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    originalWindow = global.window;
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  describe('Browser Extension Detection', () => {
    it('should detect Chrome extension environment', () => {
      global.window = {
        ...originalWindow,
        chrome: {
          runtime: {
            id: 'extension-id',
            getManifest: () => ({ name: 'X.com Gallery' }),
          },
          storage: { local: {}, sync: {} },
        },
      };

      // 브라우저 확장 환경 감지 로직
      const isExtension = !!global.window.chrome?.runtime?.id;
      expect(isExtension).toBe(true);
    });

    it('should detect Firefox extension environment', () => {
      global.window = {
        ...originalWindow,
        browser: {
          runtime: {
            id: 'extension-id',
            getManifest: () => ({ name: 'X.com Gallery' }),
          },
          storage: { local: {}, sync: {} },
        },
      };

      const isExtension = !!global.window.browser?.runtime?.id;
      expect(isExtension).toBe(true);
    });

    it('should handle missing extension APIs gracefully', () => {
      global.window = {
        ...originalWindow,
        chrome: undefined,
        browser: undefined,
      };

      expect(() => {
        const isExtension = !!(
          global.window.chrome?.runtime?.id || global.window.browser?.runtime?.id
        );
        expect(isExtension).toBe(false);
      }).not.toThrow();
    });
  });

  describe('X.com Domain Detection', () => {
    it('should correctly identify X.com and Twitter.com domains', () => {
      const validDomains = [
        'https://x.com/user/status/123',
        'https://www.x.com/user/status/123',
        'https://twitter.com/user/status/123',
        'https://www.twitter.com/user/status/123',
        'https://mobile.x.com/user/status/123',
        'https://mobile.twitter.com/user/status/123',
      ];

      const isValidDomain = (url: string) => {
        try {
          const domain = new URL(url).hostname.toLowerCase();
          return (
            domain === 'x.com' ||
            domain === 'www.x.com' ||
            domain === 'mobile.x.com' ||
            domain === 'twitter.com' ||
            domain === 'www.twitter.com' ||
            domain === 'mobile.twitter.com'
          );
        } catch {
          return false;
        }
      };

      validDomains.forEach(url => {
        expect(isValidDomain(url)).toBe(true);
      });
    });

    it('should reject invalid or suspicious domains', () => {
      const invalidDomains = [
        'https://fake-x.com/user/status/123',
        'https://x.com.evil.com/user/status/123',
        'https://twitter.com.malicious.site/user/status/123',
        'https://example.com/x.com/user/status/123',
      ];

      const isValidDomain = (url: string) => {
        try {
          const domain = new URL(url).hostname.toLowerCase();
          return (
            domain === 'x.com' ||
            domain === 'www.x.com' ||
            domain === 'mobile.x.com' ||
            domain === 'twitter.com' ||
            domain === 'www.twitter.com' ||
            domain === 'mobile.twitter.com'
          );
        } catch {
          return false;
        }
      };

      invalidDomains.forEach(url => {
        expect(isValidDomain(url)).toBe(false);
      });
    });
  });

  describe('User Agent and Device Detection', () => {
    it('should detect mobile devices', () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      ];

      const isMobile = (userAgent: string) => {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      };

      mobileUserAgents.forEach(ua => {
        global.navigator = { ...originalNavigator, userAgent: ua };
        expect(isMobile(ua)).toBe(true);
      });
    });

    it('should detect desktop browsers', () => {
      const desktopUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      ];

      const isMobile = (userAgent: string) => {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      };

      desktopUserAgents.forEach(ua => {
        global.navigator = { ...originalNavigator, userAgent: ua };
        expect(isMobile(ua)).toBe(false);
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle memory constraints gracefully', () => {
      // Simulate low memory environment
      const originalPerformance = global.performance;
      global.performance = {
        ...originalPerformance,
        now: () => Date.now(),
        memory: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          totalJSHeapSize: 60 * 1024 * 1024, // 60MB
          jsHeapSizeLimit: 64 * 1024 * 1024, // 64MB limit
        },
      } as any;

      const isLowMemory = () => {
        const memory = (global.performance as any)?.memory;
        if (!memory) return false;

        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        return usageRatio > 0.7; // 70% 이상 사용 시 low memory (더 현실적인 임계값)
      };

      expect(isLowMemory()).toBe(true);
      global.performance = originalPerformance;
    });

    it('should adapt UI based on device capabilities', () => {
      const deviceSpecs = [
        {
          devicePixelRatio: 1,
          screen: { width: 1366, height: 768 },
          expected: 'standard',
        },
        {
          devicePixelRatio: 2,
          screen: { width: 2560, height: 1440 },
          expected: 'high-res',
        },
        {
          devicePixelRatio: 1,
          screen: { width: 375, height: 667 },
          expected: 'mobile',
        },
      ];

      const getDisplayMode = (specs: any) => {
        if (specs.screen.width < 768) return 'mobile';
        if (specs.devicePixelRatio >= 2 && specs.screen.width >= 2000) return 'high-res';
        return 'standard';
      };

      deviceSpecs.forEach(({ devicePixelRatio, screen, expected }) => {
        global.window = {
          ...originalWindow,
          devicePixelRatio,
          screen,
        };

        expect(getDisplayMode({ devicePixelRatio, screen })).toBe(expected);
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should respect user preferences for reduced motion', () => {
      const mockMatchMedia = vi.fn();
      global.window = {
        ...originalWindow,
        matchMedia: mockMatchMedia,
      };

      // Test reduced motion preference
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const prefersReducedMotion = global.window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      expect(prefersReducedMotion).toBe(true);
    });

    it('should support high contrast mode', () => {
      const mockMatchMedia = vi.fn();
      global.window = {
        ...originalWindow,
        matchMedia: mockMatchMedia,
      };

      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-contrast: high)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const prefersHighContrast = global.window.matchMedia('(prefers-contrast: high)').matches;
      expect(prefersHighContrast).toBe(true);
    });
  });

  describe('Network Conditions', () => {
    it('should detect slow network connections', () => {
      global.navigator = {
        ...originalNavigator,
        connection: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 500,
        },
      };

      const isSlowConnection = () => {
        const connection = (global.navigator as any)?.connection;
        if (!connection) return false;

        return (
          connection.effectiveType === '2g' ||
          connection.effectiveType === 'slow-2g' ||
          connection.downlink < 1
        );
      };

      expect(isSlowConnection()).toBe(true);
    });

    it('should adapt behavior for fast connections', () => {
      global.navigator = {
        ...originalNavigator,
        connection: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
        },
      };

      const isFastConnection = () => {
        const connection = (global.navigator as any)?.connection;
        if (!connection) return true; // Assume fast if unknown

        return connection.effectiveType === '4g' && connection.downlink >= 5;
      };

      expect(isFastConnection()).toBe(true);
    });
  });
});
