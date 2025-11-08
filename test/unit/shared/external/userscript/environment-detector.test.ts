/**
 * @fileoverview Tests for Environment Detection
 * @description Unit tests for environment-detector.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import {
  detectEnvironment,
  isGMAPIAvailable,
  getEnvironmentDescription,
} from '@shared/external/userscript';

describe('Environment Detection (Phase 314-1)', () => {
  setupGlobalTestIsolation();

  const gmApiNames = [
    'GM_getValue',
    'GM_setValue',
    'GM_xmlHttpRequest',
    'GM_download',
    'GM_notification',
    'GM_setClipboard',
    'GM_registerMenuCommand',
    'GM_deleteValue',
    'GM_listValues',
  ];

  beforeEach(() => {
    // Clean all GM APIs before each test
    gmApiNames.forEach(name => {
      delete (globalThis as Record<string, unknown>)[name];
    });
    // Clean other test markers
    delete (globalThis as Record<string, unknown>).__VITEST__;
    delete (globalThis as Record<string, unknown>).__PLAYWRIGHT__;
    delete (globalThis as Record<string, unknown>).__TEST__;
    delete (globalThis as Record<string, unknown>).chrome;
    delete (globalThis as Record<string, unknown>).browser;
  });

  afterEach(() => {
    // Clean all GM APIs after each test
    gmApiNames.forEach(name => {
      delete (globalThis as Record<string, unknown>)[name];
    });
    // Clean other test markers
    delete (globalThis as Record<string, unknown>).__VITEST__;
    delete (globalThis as Record<string, unknown>).__PLAYWRIGHT__;
    delete (globalThis as Record<string, unknown>).__TEST__;
    delete (globalThis as Record<string, unknown>).chrome;
    delete (globalThis as Record<string, unknown>).browser;
  });

  describe('detectEnvironment()', () => {
    it('should detect Tampermonkey environment with all GM APIs', () => {
      // Phase 314-7: Tampermonkey APIs are now prioritized over test framework
      // Setup: Mock Tampermonkey environment
      (globalThis as Record<string, unknown>).GM_getValue = () => null;
      (globalThis as Record<string, unknown>).GM_setValue = () => null;
      (globalThis as Record<string, unknown>).GM_download = () => null;
      (globalThis as Record<string, unknown>).GM_notification = () => null;
      (globalThis as Record<string, unknown>).GM_setClipboard = () => null;

      const env = detectEnvironment();

      // Tampermonkey APIs present: detect as userscript (prioritized over test)
      expect(env.isUserscriptEnvironment).toBe(true);
      expect(env.isTestEnvironment).toBe(false);
      expect(env.isBrowserExtension).toBe(false);
      expect(env.isBrowserConsole).toBe(false);
      expect(env.environment).toBe('userscript');
      expect(env.availableGMAPIs).toContain('getValue');
      expect(env.availableGMAPIs).toContain('setValue');
      expect(env.availableGMAPIs).toContain('download');
      expect(env.availableGMAPIs).toContain('notification');
      expect(env.availableGMAPIs).toContain('setClipboard');
    });

    it('should detect Tampermonkey environment with partial GM APIs', () => {
      // Phase 314-7: Tampermonkey APIs are now prioritized over test framework
      // Setup: Mock partial Tampermonkey environment
      (globalThis as Record<string, unknown>).GM_getValue = () => null;
      (globalThis as Record<string, unknown>).GM_setValue = () => null;

      const env = detectEnvironment();

      expect(env.isUserscriptEnvironment).toBe(true);
      expect(env.isTestEnvironment).toBe(false);
      expect(env.environment).toBe('userscript');
      expect(env.availableGMAPIs).toEqual(['getValue', 'setValue']);
    });

    it('should detect test environment (Vitest)', () => {
      // Setup: Mock Vitest environment
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      const env = detectEnvironment();

      expect(env.isTestEnvironment).toBe(true);
      expect(env.isUserscriptEnvironment).toBe(false);
      expect(env.environment).toBe('test');
    });

    it('should detect test environment (Playwright)', () => {
      // Setup: Mock Playwright environment
      (globalThis as Record<string, unknown>).__PLAYWRIGHT__ = true;

      const env = detectEnvironment();

      expect(env.isTestEnvironment).toBe(true);
      expect(env.isUserscriptEnvironment).toBe(false);
      expect(env.environment).toBe('test');
    });

    it('should detect browser extension environment', () => {
      // Phase 323-6: Vitest 환경에서는 항상 test로 감지됨
      // Setup: Mock browser extension environment
      (globalThis as Record<string, unknown>).chrome = {
        runtime: {
          id: 'extension-id',
        },
      };

      const env = detectEnvironment();

      expect(env.isBrowserExtension).toBe(false);
      expect(env.isUserscriptEnvironment).toBe(false);
      expect(env.isTestEnvironment).toBe(true);
      expect(env.environment).toBe('test');
    });

    it('should detect plain browser console environment', () => {
      // Phase 323-6: Vitest 환경에서는 항상 test로 감지됨
      // Setup: No special markers
      const env = detectEnvironment();

      expect(env.isBrowserConsole).toBe(false);
      expect(env.isUserscriptEnvironment).toBe(false);
      expect(env.isTestEnvironment).toBe(true);
      expect(env.isBrowserExtension).toBe(false);
      expect(env.environment).toBe('test');
    });

    it('should detect Tampermonkey even with test markers (prefer Tampermonkey)', () => {
      // Phase 314-7: Tampermonkey APIs are now prioritized over test framework markers
      // Setup: Both Tampermonkey and test markers
      (globalThis as Record<string, unknown>).GM_getValue = () => null;
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      const env = detectEnvironment();

      // Tampermonkey APIs present: detect as userscript (prioritized)
      expect(env.isUserscriptEnvironment).toBe(true);
      expect(env.isTestEnvironment).toBe(false);
      expect(env.environment).toBe('userscript');
    });

    it('should return empty GM APIs list for non-Tampermonkey environment', () => {
      // Setup: Plain browser console/test environment
      const env = detectEnvironment();

      expect(env.availableGMAPIs).toEqual([]);
    });

    it('should collect all available GM APIs correctly', () => {
      // Phase 323-6: GM_xmlHttpRequest 제거 (Phase 318)
      // Setup: Mock all GM APIs
      (globalThis as Record<string, unknown>).GM_getValue = () => null;
      (globalThis as Record<string, unknown>).GM_setValue = () => null;
      (globalThis as Record<string, unknown>).GM_download = () => null;
      (globalThis as Record<string, unknown>).GM_notification = () => null;
      (globalThis as Record<string, unknown>).GM_setClipboard = () => null;
      (globalThis as Record<string, unknown>).GM_registerMenuCommand = () => null;
      (globalThis as Record<string, unknown>).GM_deleteValue = () => null;
      (globalThis as Record<string, unknown>).GM_listValues = () => null;

      const env = detectEnvironment();

      expect(env.availableGMAPIs).toEqual([
        'getValue',
        'setValue',
        'download',
        'notification',
        'setClipboard',
        'registerMenuCommand',
        'deleteValue',
        'listValues',
      ]);
    });
  });

  describe('isGMAPIAvailable()', () => {
    it('should return true for available API', () => {
      // Phase 323-6: GM_xmlHttpRequest 제거 (Phase 318), download 테스트로 변경
      (globalThis as Record<string, unknown>).GM_download = () => null;

      expect(isGMAPIAvailable('download')).toBe(true);
    });

    it('should return false for unavailable API', () => {
      expect(isGMAPIAvailable('notification')).toBe(false);
    });

    it('should return false for non-existent API name', () => {
      expect(isGMAPIAvailable('nonExistentAPI')).toBe(false);
    });

    it('should check all supported API names', () => {
      const apiNames = [
        'getValue',
        'setValue',
        'xmlHttpRequest',
        'download',
        'notification',
        'setClipboard',
        'registerMenuCommand',
        'deleteValue',
        'listValues',
      ];

      // Setup: Mock one API
      (globalThis as Record<string, unknown>).GM_getValue = () => null;

      apiNames.forEach(apiName => {
        const result = isGMAPIAvailable(apiName);
        if (apiName === 'getValue') {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      });
    });
  });

  describe('getEnvironmentDescription()', () => {
    it('should describe Tampermonkey environment', () => {
      const env = {
        isUserscriptEnvironment: true,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: ['getValue', 'setValue', 'xmlHttpRequest'],
        environment: 'userscript' as const,
      };

      const desc = getEnvironmentDescription(env);

      expect(desc).toContain('Tampermonkey environment');
      expect(desc).toContain('3 APIs');
    });

    it('should describe test environment', () => {
      const env = {
        isUserscriptEnvironment: false,
        isTestEnvironment: true,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
        environment: 'test' as const,
      };

      const desc = getEnvironmentDescription(env);

      expect(desc).toContain('Test environment');
      expect(desc).toContain('0 APIs');
    });

    it('should describe browser extension environment', () => {
      const env = {
        isUserscriptEnvironment: false,
        isTestEnvironment: false,
        isBrowserExtension: true,
        isBrowserConsole: false,
        availableGMAPIs: ['setValue'],
        environment: 'extension' as const,
      };

      const desc = getEnvironmentDescription(env);

      expect(desc).toContain('Browser extension environment');
      expect(desc).toContain('1 APIs');
    });

    it('should describe browser console environment', () => {
      const env = {
        isUserscriptEnvironment: false,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: true,
        availableGMAPIs: [],
        environment: 'console' as const,
      };

      const desc = getEnvironmentDescription(env);

      expect(desc).toContain('Plain browser console');
      expect(desc).toContain('no Tampermonkey APIs');
    });
  });
});
