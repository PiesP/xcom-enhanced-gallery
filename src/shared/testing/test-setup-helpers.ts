/**
 * @fileoverview Test Setup Helpers - Phase 314-7
 * @description Test lifecycle management and isolation utilities
 * @module shared/testing/test-setup-helpers
 */

import {
  enableTestMode,
  disableTestMode,
  setCurrentTest,
  clearCurrentTest,
  resetTestConfig,
  getTestMetadata,
  type TestModeOptions,
} from '../external/test/test-environment-config';
import { logger } from '../logging';

/**
 * Test setup context - Phase 314-7
 */
export interface TestSetupContext {
  testName: string;
  setupTime: number;
  cleanupTime?: number;
  duration?: number;
  error?: Error;
}

/** Stack of active test contexts - Phase 314-7 */
const testContextStack: TestSetupContext[] = [];

/**
 * Setup test environment before each test - Phase 314-7
 *
 * Enables test mode and sets up test context for isolation and tracking.
 *
 * @param testName Name of the test for tracking
 * @param options Test mode options
 * @returns Test setup context
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   setupTestEnvironment('Should fetch data successfully', {
 *     mockServices: true,
 *     autoCleanup: true,
 *   });
 * });
 * ```
 */
export function setupTestEnvironment(
  testName: string,
  options?: Partial<TestModeOptions>
): TestSetupContext {
  const context: TestSetupContext = {
    testName,
    setupTime: Date.now(),
  };

  try {
    // Enable test mode with provided options
    enableTestMode(options);

    // Set current test name for tracking
    setCurrentTest(testName);

    logger.debug(`[TestSetup] ✅ Setup complete for: ${testName}`);
  } catch (error) {
    context.error = error instanceof Error ? error : new Error(String(error));
    logger.error(`[TestSetup] ❌ Setup failed for: ${testName}`, context.error);
  }

  testContextStack.push(context);
  return context;
}

/**
 * Cleanup test environment after each test - Phase 314-7
 *
 * Disables test mode and clears test context.
 *
 * @param context Optional context from setupTestEnvironment
 * @returns Cleanup metadata
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   cleanupTestEnvironment();
 * });
 * ```
 */
export function cleanupTestEnvironment(context?: TestSetupContext): {
  testName: string;
  duration: number;
  success: boolean;
} {
  const activeContext = context || testContextStack.pop();

  const result = {
    testName: activeContext?.testName || 'unknown',
    duration: Date.now() - (activeContext?.setupTime || 0),
    success: !activeContext?.error,
  };

  try {
    // Clear current test
    clearCurrentTest();

    // Disable test mode
    disableTestMode();

    logger.debug(`[TestSetup] ✅ Cleanup complete for: ${result.testName} (${result.duration}ms)`);
  } catch (error) {
    logger.error(`[TestSetup] ❌ Cleanup failed for: ${result.testName}`, error);
    result.success = false;
  }

  return result;
}

/**
 * Create beforeEach hook for test setup - Phase 314-7
 *
 * Returns a function suitable for use with test framework's beforeEach.
 *
 * @param options Test mode options
 * @returns Function to use in beforeEach
 *
 * @example
 * ```typescript
 * describe('My Service', () => {
 *   beforeEach(createBeforeEachHook({ mockServices: true }));
 *
 *   it('should work', () => {
 *     // test code
 *   });
 * });
 * ```
 */
export function createBeforeEachHook(options?: Partial<TestModeOptions>) {
  return function beforeEachHook(this: { currentTest?: { title: string } }) {
    const testName = this?.currentTest?.title || 'anonymous-test';
    setupTestEnvironment(testName, options);
  };
}

/**
 * Create afterEach hook for test cleanup - Phase 314-7
 *
 * Returns a function suitable for use with test framework's afterEach.
 *
 * @returns Function to use in afterEach
 *
 * @example
 * ```typescript
 * describe('My Service', () => {
 *   afterEach(createAfterEachHook());
 *
 *   it('should work', () => {
 *     // test code
 *   });
 * });
 * ```
 */
export function createAfterEachHook() {
  return function afterEachHook() {
    cleanupTestEnvironment();
  };
}

/**
 * Execute function with test isolation - Phase 314-7
 *
 * Automatically sets up and cleans up test environment.
 *
 * @template T Return type
 * @param testName Name of test for tracking
 * @param fn Function to execute
 * @param options Test mode options
 * @returns Result of fn
 * @throws If fn throws or setup/cleanup fails
 *
 * @example
 * ```typescript
 * it('should fetch data', async () => {
 *   const result = await withTestIsolation('fetch-test', async () => {
 *     return await httpService.get(url);
 *   }, { mockServices: true });
 *   expect(result).toBeDefined();
 * });
 * ```
 */
export async function withTestIsolation<T>(
  testName: string,
  fn: () => T | Promise<T>,
  options?: Partial<TestModeOptions>
): Promise<T> {
  const setupContext = setupTestEnvironment(testName, options);

  try {
    const result = await fn();
    logger.debug(`[TestSetup] ✅ Test isolation complete: ${testName}`);
    return result;
  } catch (error) {
    setupContext.error = error instanceof Error ? error : new Error(String(error));
    logger.error(`[TestSetup] ❌ Test isolation failed: ${testName}`, error);
    throw error;
  } finally {
    cleanupTestEnvironment(setupContext);
  }
}

/**
 * Synchronous variant of withTestIsolation - Phase 314-7
 *
 * @template T Return type
 * @param testName Name of test for tracking
 * @param fn Function to execute
 * @param options Test mode options
 * @returns Result of fn
 * @throws If fn throws or setup/cleanup fails
 */
export function withTestIsolationSync<T>(
  testName: string,
  fn: () => T,
  options?: Partial<TestModeOptions>
): T {
  const setupContext = setupTestEnvironment(testName, options);

  try {
    const result = fn();
    logger.debug(`[TestSetup] ✅ Test isolation complete: ${testName}`);
    return result;
  } catch (error) {
    setupContext.error = error instanceof Error ? error : new Error(String(error));
    logger.error(`[TestSetup] ❌ Test isolation failed: ${testName}`, error);
    throw error;
  } finally {
    cleanupTestEnvironment(setupContext);
  }
}

/**
 * Clear all test contexts (emergency cleanup) - Phase 314-7
 *
 * Use only if normal cleanup failed or in test teardown.
 */
export function clearAllTestContexts(): void {
  const count = testContextStack.length;
  testContextStack.length = 0;
  disableTestMode();
  resetTestConfig();
  logger.warn(`[TestSetup] ⚠️  Cleared ${count} test contexts`);
}

/**
 * Get test execution summary - Phase 314-7
 *
 * @returns Summary of test execution metadata
 */
export function getTestExecutionSummary() {
  const metadata = getTestMetadata();
  return {
    isTestMode: metadata.isTestMode,
    testsRun: metadata.testCount,
    cleanupsPerformed: metadata.cleanupCount,
    uptime: metadata.uptime,
    pendingContexts: testContextStack.length,
    currentTest: metadata.currentTest,
  };
}

/**
 * Assert no leaked test contexts - Phase 314-7
 *
 * Useful for detecting test isolation issues.
 *
 * @throws Error if there are pending test contexts
 */
export function assertNoLeakedTestContexts(): void {
  if (testContextStack.length > 0) {
    const leaked = testContextStack.map(c => c.testName).join(', ');
    throw new Error(`Leaked test contexts detected: ${leaked}`);
  }
}
