/**
 * Unit tests for test-environment-config
 *
 * @fileoverview 테스트 환경 설정 및 상태 관리 테스트
 * @see src/shared/external/test/test-environment-config.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  enableTestMode,
  disableTestMode,
  isTestModeEnabled,
  getTestConfig,
  setTestConfig,
  resetTestConfig,
  setCurrentTest,
  clearCurrentTest,
  getTestMetadata,
  isTestFeatureEnabled,
  type TestModeOptions,
  type TestEnvironmentConfig,
} from '../../../../../src/shared/external';

describe('test-environment-config', () => {
  // ==========================================
  // Setup & Teardown
  // ==========================================

  beforeEach(() => {
    resetTestConfig();
  });

  // ==========================================
  // Test Mode Enable/Disable
  // ==========================================

  describe('enableTestMode / disableTestMode', () => {
    it('should enable test mode', () => {
      const config = enableTestMode();
      expect(config.enabled).toBe(true);
      expect(isTestModeEnabled()).toBe(true);
    });

    it('should disable test mode', () => {
      enableTestMode();
      const config = disableTestMode();
      expect(config.enabled).toBe(false);
      expect(isTestModeEnabled()).toBe(false);
    });

    it('should apply options when enabling', () => {
      const options: Partial<TestModeOptions> = {
        mockServices: true,
        verbose: true,
        autoCleanup: false,
        simulateNetworkDelay: true,
        networkDelayMs: 100,
      };
      const config = enableTestMode(options);
      expect(config.options.mockServices).toBe(true);
      expect(config.options.verbose).toBe(true);
      expect(config.options.autoCleanup).toBe(false);
      expect(config.options.simulateNetworkDelay).toBe(true);
      expect(config.options.networkDelayMs).toBe(100);
    });

    it('should merge options when enabling with partial options', () => {
      enableTestMode({ mockServices: true });
      const config = enableTestMode({ verbose: true });
      expect(config.options.mockServices).toBe(true);
      expect(config.options.verbose).toBe(true);
    });
  });

  // ==========================================
  // Config Management
  // ==========================================

  describe('getTestConfig / setTestConfig / resetTestConfig', () => {
    it('should get current config', () => {
      enableTestMode({ mockServices: true });
      const config = getTestConfig();
      expect(config.enabled).toBe(true);
      expect(config.options.mockServices).toBe(true);
    });

    it('should set partial config with merge', () => {
      enableTestMode({ mockServices: true });
      setTestConfig({ options: { ...getTestConfig().options, verbose: true } });
      const config = getTestConfig();
      expect(config.options.mockServices).toBe(true);
      expect(config.options.verbose).toBe(true);
    });

    it('should reset config to defaults', () => {
      enableTestMode({
        mockServices: true,
        verbose: true,
        autoCleanup: false,
      });
      resetTestConfig();
      const config = getTestConfig();
      expect(config.enabled).toBe(false); // default is disabled unless in test
      expect(config.options.mockServices).toBe(true); // reset to defaults
      expect(config.options.verbose).toBe(false);
      expect(config.options.autoCleanup).toBe(true);
    });

    it('should maintain metadata structure on reset', () => {
      enableTestMode();
      setCurrentTest('test1');
      resetTestConfig();
      const config = getTestConfig();
      expect(config.metadata).toBeDefined();
      expect(config.metadata.testCount).toBe(0);
      expect(config.metadata.cleanupCount).toBe(0);
      expect(config.metadata.startTime).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Current Test Tracking
  // ==========================================

  describe('setCurrentTest / clearCurrentTest', () => {
    it('should set current test name', () => {
      setCurrentTest('my-test');
      const metadata = getTestMetadata();
      expect(metadata.currentTest).toBe('my-test');
    });

    it('should clear current test name', () => {
      setCurrentTest('my-test');
      clearCurrentTest();
      const metadata = getTestMetadata();
      expect(metadata.currentTest).toBeUndefined();
    });

    it('should increment testCount on setCurrentTest', () => {
      setCurrentTest('test1');
      setCurrentTest('test2');
      setCurrentTest('test3');
      const metadata = getTestMetadata();
      expect(metadata.testCount).toBe(3);
    });

    it('should increment cleanupCount on clearCurrentTest', () => {
      setCurrentTest('test1');
      clearCurrentTest();
      setCurrentTest('test2');
      clearCurrentTest();
      const metadata = getTestMetadata();
      expect(metadata.cleanupCount).toBe(2);
    });
  });

  // ==========================================
  // Test Metadata
  // ==========================================

  describe('getTestMetadata', () => {
    it('should return metadata with uptime', () => {
      const metadata = getTestMetadata();
      expect(metadata.testCount).toBeDefined();
      expect(metadata.cleanupCount).toBeDefined();
      expect(metadata.uptime).toBeGreaterThanOrEqual(0);
      expect(metadata.isTestMode).toBeDefined();
    });

    it('should calculate uptime correctly', async () => {
      const metadata1 = getTestMetadata();
      const uptime1 = metadata1.uptime;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      const metadata2 = getTestMetadata();
      const uptime2 = metadata2.uptime;

      expect(uptime2).toBeGreaterThan(uptime1);
    });

    it('should include currentTest in metadata', () => {
      setCurrentTest('current-test');
      const metadata = getTestMetadata();
      expect(metadata.currentTest).toBe('current-test');
    });

    it('should include isTestMode in metadata', () => {
      enableTestMode();
      const metadata = getTestMetadata();
      expect(metadata.isTestMode).toBe(true);

      disableTestMode();
      const metadata2 = getTestMetadata();
      expect(metadata2.isTestMode).toBe(false);
    });
  });

  // ==========================================
  // Feature Detection
  // ==========================================

  describe('isTestFeatureEnabled', () => {
    it('should return false if test mode is disabled', () => {
      disableTestMode();
      expect(isTestFeatureEnabled('mockServices')).toBe(false);
      expect(isTestFeatureEnabled('autoCleanup')).toBe(false);
    });

    it('should return false for disabled features', () => {
      enableTestMode({ mockServices: false, verbose: false });
      expect(isTestFeatureEnabled('mockServices')).toBe(false);
      expect(isTestFeatureEnabled('verbose')).toBe(false);
    });

    it('should return true for enabled features', () => {
      enableTestMode({ mockServices: true, verbose: true });
      expect(isTestFeatureEnabled('mockServices')).toBe(true);
      expect(isTestFeatureEnabled('verbose')).toBe(true);
    });

    it('should check multiple features independently', () => {
      enableTestMode({
        mockServices: true,
        verbose: false,
        autoCleanup: true,
        simulateNetworkDelay: false,
      });

      expect(isTestFeatureEnabled('mockServices')).toBe(true);
      expect(isTestFeatureEnabled('verbose')).toBe(false);
      expect(isTestFeatureEnabled('autoCleanup')).toBe(true);
      expect(isTestFeatureEnabled('simulateNetworkDelay')).toBe(false);
    });
  });

  // ==========================================
  // State Consistency
  // ==========================================

  describe('state consistency', () => {
    it('should maintain consistent state across operations', () => {
      enableTestMode({ mockServices: true });
      setCurrentTest('test1');

      let config = getTestConfig();
      expect(config.enabled).toBe(true);
      expect(config.currentTest).toBe('test1');

      clearCurrentTest();
      config = getTestConfig();
      expect(config.enabled).toBe(true);
      expect(config.currentTest).toBeUndefined();
    });

    it('should handle rapid enable/disable cycles', () => {
      for (let i = 0; i < 5; i++) {
        enableTestMode();
        expect(isTestModeEnabled()).toBe(true);
        disableTestMode();
        expect(isTestModeEnabled()).toBe(false);
      }
    });

    it('should preserve metadata across config changes', () => {
      enableTestMode();
      setCurrentTest('test1');
      const metadata1 = getTestMetadata();

      disableTestMode();
      const metadata2 = getTestMetadata();

      expect(metadata2.testCount).toBe(metadata1.testCount);
      expect(metadata2.cleanupCount).toBe(metadata1.cleanupCount);
    });
  });

  // ==========================================
  // Type Safety (compile-time checks)
  // ==========================================

  describe('type definitions', () => {
    it('should have correct TestModeOptions interface', () => {
      const options: TestModeOptions = {
        mockServices: true,
        verbose: false,
        autoCleanup: true,
        simulateNetworkDelay: false,
        networkDelayMs: 100,
      };
      expect(options.mockServices).toBe(true);
    });

    it('should have correct TestEnvironmentConfig interface', () => {
      const config: TestEnvironmentConfig = {
        enabled: true,
        options: {
          mockServices: true,
          verbose: false,
          autoCleanup: true,
          simulateNetworkDelay: false,
          networkDelayMs: 0,
        },
        currentTest: undefined,
        metadata: {
          startTime: Date.now(),
          testCount: 0,
          cleanupCount: 0,
        },
      };
      expect(config.enabled).toBe(true);
    });
  });
});
