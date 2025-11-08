/**
 * @fileoverview Test Environment Configuration Tests - Phase 314-7
 * @description Global test mode settings and configuration
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  getTestConfig,
  setTestConfig,
  resetTestConfig,
  enableTestMode,
  disableTestMode,
  isTestModeEnabled,
  setCurrentTest,
  clearCurrentTest,
  getTestMetadata,
  isTestFeatureEnabled,
  type TestEnvironmentConfig,
} from '../../../src/shared/external/test/test-environment-config';

describe('Test Environment Configuration - Phase 314-7', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    // Clean all mock GM APIs first
    const gmApis = [
      'GM_getValue',
      'GM_setValue',
      'GM_download',
      'GM_notification',
      'GM_setClipboard',
      'GM_registerMenuCommand',
      'GM_deleteValue',
      'GM_listValues',
    ];
    gmApis.forEach(api => {
      delete (globalThis as Record<string, unknown>)[api];
    });

    resetTestConfig();
  });

  afterEach(() => {
    // Clean all mock GM APIs
    const gmApis = [
      'GM_getValue',
      'GM_setValue',
      'GM_download',
      'GM_notification',
      'GM_setClipboard',
      'GM_registerMenuCommand',
      'GM_deleteValue',
      'GM_listValues',
    ];
    gmApis.forEach(api => {
      delete (globalThis as Record<string, unknown>)[api];
    });

    resetTestConfig();
  });

  describe('getTestConfig', () => {
    it('should return current test configuration', () => {
      const config = getTestConfig();

      expect(config).toBeDefined();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('options');
      expect(config).toHaveProperty('metadata');
    });

    it('should have required options properties', () => {
      const config = getTestConfig();

      expect(config.options).toHaveProperty('mockServices');
      expect(config.options).toHaveProperty('verbose');
      expect(config.options).toHaveProperty('autoCleanup');
      expect(config.options).toHaveProperty('simulateNetworkDelay');
      expect(config.options).toHaveProperty('networkDelayMs');
    });
  });

  describe('setTestConfig', () => {
    it('should update test configuration', () => {
      setTestConfig({ enabled: true });
      const config = getTestConfig();

      expect(config.enabled).toBe(true);
    });

    it('should merge options', () => {
      const opts: any = { mockServices: true, verbose: true };
      setTestConfig({ options: opts });
      const config = getTestConfig();

      expect(config.options.mockServices).toBe(true);
      expect(config.options.verbose).toBe(true);
    });

    it('should preserve non-updated properties', () => {
      const originalNetworkDelay = getTestConfig().options.networkDelayMs;
      const opts: any = { mockServices: true };
      setTestConfig({ options: opts });

      expect(getTestConfig().options.networkDelayMs).toBe(originalNetworkDelay);
    });
  });

  describe('enableTestMode / disableTestMode', () => {
    it('should enable test mode', () => {
      enableTestMode();

      expect(isTestModeEnabled()).toBe(true);
      expect(getTestConfig().enabled).toBe(true);
    });

    it('should disable test mode', () => {
      enableTestMode();
      disableTestMode();

      expect(isTestModeEnabled()).toBe(false);
      expect(getTestConfig().enabled).toBe(false);
    });

    it('should accept options when enabling', () => {
      enableTestMode({ mockServices: true, verbose: true });

      const config = getTestConfig();
      expect(config.options.mockServices).toBe(true);
      expect(config.options.verbose).toBe(true);
    });
  });

  describe('Test name tracking', () => {
    it('should set current test name', () => {
      setCurrentTest('My Test');

      expect(getTestConfig().currentTest).toBe('My Test');
    });

    it('should increment test count when setting test name', () => {
      const beforeCount = getTestConfig().metadata.testCount;
      setCurrentTest('Test 1');
      setCurrentTest('Test 2');

      expect(getTestConfig().metadata.testCount).toBe(beforeCount + 2);
    });

    it('should clear current test', () => {
      setCurrentTest('My Test');
      clearCurrentTest();

      expect(getTestConfig().currentTest).toBeUndefined();
    });

    it('should increment cleanup count when clearing', () => {
      const beforeCount = getTestConfig().metadata.cleanupCount;
      setCurrentTest('My Test');
      clearCurrentTest();

      expect(getTestConfig().metadata.cleanupCount).toBe(beforeCount + 1);
    });
  });

  describe('getTestMetadata', () => {
    it('should return test metadata', () => {
      const metadata = getTestMetadata();

      expect(metadata).toHaveProperty('uptime');
      expect(metadata).toHaveProperty('testCount');
      expect(metadata).toHaveProperty('cleanupCount');
      expect(metadata).toHaveProperty('isTestMode');
    });

    it('should calculate uptime', () => {
      const beforeTime = Date.now();
      const metadata = getTestMetadata();
      const afterTime = Date.now();

      expect(metadata.uptime).toBeGreaterThanOrEqual(0);
      expect(metadata.uptime).toBeLessThanOrEqual(afterTime - beforeTime + 500);
    });

    it('should track test names in metadata', () => {
      enableTestMode();
      setCurrentTest('Test 1');

      const metadata = getTestMetadata();
      expect(metadata.currentTest).toBe('Test 1');
    });
  });

  describe('isTestFeatureEnabled', () => {
    it('should return false when test mode is disabled', () => {
      disableTestMode();

      expect(isTestFeatureEnabled('mockServices')).toBe(false);
    });

    it('should return feature enabled status', () => {
      enableTestMode({ mockServices: true });

      expect(isTestFeatureEnabled('mockServices')).toBe(true);
    });

    it('should return feature disabled status', () => {
      enableTestMode({ mockServices: false });

      expect(isTestFeatureEnabled('mockServices')).toBe(false);
    });
  });

  describe('resetTestConfig', () => {
    it('should reset configuration to defaults', () => {
      enableTestMode({ mockServices: true, verbose: true });
      setCurrentTest('Test');

      resetTestConfig();

      const config = getTestConfig();
      expect(config.currentTest).toBeUndefined();
    });
  });
});

// Global cleanup: Remove all mock GM APIs from globalThis after all tests
afterAll(() => {
  // Vitest cleanup functions
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();

  // Manual cleanup: Remove all mock GM APIs
  const gmApis = [
    'GM_getValue',
    'GM_setValue',
    'GM_download',
    'GM_notification',
    'GM_setClipboard',
    'GM_registerMenuCommand',
    'GM_deleteValue',
    'GM_listValues',
  ];
  gmApis.forEach(api => {
    delete (globalThis as Record<string, unknown>)[api];
  });

  // Final reset
  resetTestConfig();
});
