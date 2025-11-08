/**
 * @fileoverview Test Setup Helpers Tests - Phase 314-7
 * @description Test lifecycle management and isolation utilities
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  withTestIsolation,
  withTestIsolationSync,
  clearAllTestContexts,
  getTestExecutionSummary,
  assertNoLeakedTestContexts,
} from '../../../src/shared/testing/test-setup-helpers';
import {
  isTestModeEnabled,
  resetTestConfig,
} from '../../../src/shared/external/test/test-environment-config';

describe('Test Setup Helpers - Phase 314-7', () => {
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

    clearAllTestContexts();
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

    clearAllTestContexts();
    resetTestConfig();
  });

  describe('setupTestEnvironment', () => {
    it('should enable test mode', () => {
      setupTestEnvironment('Test Name');

      expect(isTestModeEnabled()).toBe(true);
    });

    it('should set current test name', () => {
      const ctx = setupTestEnvironment('My Test');

      expect(ctx.testName).toBe('My Test');
    });

    it('should record setup time', () => {
      const before = Date.now();
      const ctx = setupTestEnvironment('Test');
      const after = Date.now();

      expect(ctx.setupTime).toBeGreaterThanOrEqual(before);
      expect(ctx.setupTime).toBeLessThanOrEqual(after);
    });

    it('should apply options', () => {
      setupTestEnvironment('Test', {
        mockServices: true,
        verbose: true,
      });

      // Test mode should be enabled
      expect(isTestModeEnabled()).toBe(true);
    });
  });

  describe('cleanupTestEnvironment', () => {
    it('should disable test mode', () => {
      setupTestEnvironment('Test');
      cleanupTestEnvironment();

      expect(isTestModeEnabled()).toBe(false);
    });

    it('should return cleanup result', () => {
      setupTestEnvironment('My Test');
      const result = cleanupTestEnvironment();

      expect(result).toHaveProperty('testName');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('success');
      expect(result.testName).toBe('My Test');
    });

    it('should calculate cleanup duration', () => {
      setupTestEnvironment('Test');
      const result = cleanupTestEnvironment();

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('withTestIsolation', () => {
    it('should execute function with isolation', async () => {
      let executed = false;

      await withTestIsolation('Test', async () => {
        executed = true;
        expect(isTestModeEnabled()).toBe(true);
      });

      expect(executed).toBe(true);
      expect(isTestModeEnabled()).toBe(false);
    });

    it('should return function result', async () => {
      const result = await withTestIsolation('Test', async () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should cleanup on success', async () => {
      await withTestIsolation('Test', async () => {
        // Function body
      });

      expect(isTestModeEnabled()).toBe(false);
    });

    it('should cleanup on error', async () => {
      try {
        await withTestIsolation('Test', async () => {
          throw new Error('Test error');
        });
      } catch {
        // Error expected
      }

      expect(isTestModeEnabled()).toBe(false);
    });

    it('should propagate errors', async () => {
      await expect(
        withTestIsolation('Test', async () => {
          throw new Error('Expected error');
        })
      ).rejects.toThrow('Expected error');
    });
  });

  describe('withTestIsolationSync', () => {
    it('should execute function with isolation', () => {
      let executed = false;

      withTestIsolationSync('Test', () => {
        executed = true;
        expect(isTestModeEnabled()).toBe(true);
      });

      expect(executed).toBe(true);
      expect(isTestModeEnabled()).toBe(false);
    });

    it('should return function result', () => {
      const result = withTestIsolationSync('Test', () => {
        return 'sync-result';
      });

      expect(result).toBe('sync-result');
    });

    it('should cleanup on error', () => {
      try {
        withTestIsolationSync('Test', () => {
          throw new Error('Sync error');
        });
      } catch {
        // Error expected
      }

      expect(isTestModeEnabled()).toBe(false);
    });

    it('should propagate errors', () => {
      expect(() => {
        withTestIsolationSync('Test', () => {
          throw new Error('Expected sync error');
        });
      }).toThrow('Expected sync error');
    });
  });

  describe('getTestExecutionSummary', () => {
    it('should return execution summary', () => {
      setupTestEnvironment('Test 1');

      const summary = getTestExecutionSummary();

      expect(summary).toHaveProperty('isTestMode');
      expect(summary).toHaveProperty('testsRun');
      expect(summary).toHaveProperty('cleanupsPerformed');
      expect(summary).toHaveProperty('uptime');
      expect(summary).toHaveProperty('pendingContexts');
    });

    it('should track test execution count', () => {
      setupTestEnvironment('Test 1');
      setupTestEnvironment('Test 2');

      const summary = getTestExecutionSummary();

      expect(summary.testsRun).toBeGreaterThanOrEqual(2);
    });

    it('should show pending contexts', () => {
      setupTestEnvironment('Test 1');

      const summary = getTestExecutionSummary();

      expect(summary.pendingContexts).toBeGreaterThan(0);
    });
  });

  describe('assertNoLeakedTestContexts', () => {
    it('should pass when no contexts are leaked', () => {
      expect(() => {
        assertNoLeakedTestContexts();
      }).not.toThrow();
    });

    it('should throw when contexts are leaked', () => {
      setupTestEnvironment('Leaked Test');

      expect(() => {
        assertNoLeakedTestContexts();
      }).toThrow();
    });

    it('should include test name in error', () => {
      setupTestEnvironment('My Leaked Test');

      expect(() => {
        assertNoLeakedTestContexts();
      }).toThrow(/My Leaked Test/);
    });
  });

  describe('clearAllTestContexts', () => {
    it('should clear all contexts', () => {
      setupTestEnvironment('Test 1');
      setupTestEnvironment('Test 2');

      clearAllTestContexts();

      expect(() => {
        assertNoLeakedTestContexts();
      }).not.toThrow();
    });

    it('should disable test mode', () => {
      setupTestEnvironment('Test');

      clearAllTestContexts();

      expect(isTestModeEnabled()).toBe(false);
    });
  });

  describe('Integration: Multiple tests', () => {
    it('should isolate multiple sequential tests', async () => {
      const results: string[] = [];

      await withTestIsolation('Test 1', async () => {
        results.push('test1-setup');
        expect(isTestModeEnabled()).toBe(true);
      });

      results.push('between-tests');

      await withTestIsolation('Test 2', async () => {
        results.push('test2-setup');
        expect(isTestModeEnabled()).toBe(true);
      });

      results.push('test-end');

      expect(results).toEqual(['test1-setup', 'between-tests', 'test2-setup', 'test-end']);
      expect(isTestModeEnabled()).toBe(false);
    });

    it('should track execution summary across tests', async () => {
      await withTestIsolation('Test 1', async () => {
        // test code
      });

      await withTestIsolation('Test 2', async () => {
        // test code
      });

      const summary = getTestExecutionSummary();

      expect(summary.testsRun).toBeGreaterThanOrEqual(2);
      expect(summary.cleanupsPerformed).toBeGreaterThanOrEqual(2);
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

  // Final cleanup
  clearAllTestContexts();
  resetTestConfig();
});
