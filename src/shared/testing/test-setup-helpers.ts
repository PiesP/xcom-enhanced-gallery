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
} from "@shared/external/test/test-environment-config";

/**
 * Test setup context - Phase 314-7
 */
export interface TestSetupContext {
  testName: string;
  setupTime: number;
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
  options?: Partial<TestModeOptions>,
): TestSetupContext {
  const context: TestSetupContext = {
    testName,
    setupTime: Date.now(),
  };

  enableTestMode(options);
  setCurrentTest(testName);

  testContextStack.push(context);
  return context;
}

function detachContext(
  context?: TestSetupContext,
): TestSetupContext | undefined {
  if (!context) {
    return testContextStack.pop();
  }

  const index = testContextStack.lastIndexOf(context);
  if (index !== -1) {
    testContextStack.splice(index, 1);
  }

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
  const activeContext = detachContext(context);
  const setupTime = activeContext?.setupTime ?? Date.now();

  clearCurrentTest();
  disableTestMode();

  return {
    testName: activeContext?.testName ?? "unknown",
    duration: Date.now() - setupTime,
    success: Boolean(activeContext),
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
  options?: Partial<TestModeOptions>,
): Promise<T> {
  const context = setupTestEnvironment(testName, options);

  try {
    return await fn();
  } finally {
    cleanupTestEnvironment(context);
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
  options?: Partial<TestModeOptions>,
): T {
  const context = setupTestEnvironment(testName, options);

  try {
    return fn();
  } finally {
    cleanupTestEnvironment(context);
  }
}

/**
 * Clear all test contexts (emergency cleanup) - Phase 314-7
 *
 * Use only if normal cleanup failed or in test teardown.
 */
export function clearAllTestContexts(): void {
  testContextStack.length = 0;
  disableTestMode();
  resetTestConfig();
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
    const leaked = testContextStack.map((c) => c.testName).join(", ");
    throw new Error(`Leaked test contexts detected: ${leaked}`);
  }
}
