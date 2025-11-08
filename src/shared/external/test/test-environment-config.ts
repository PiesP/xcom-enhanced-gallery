/**
 * Test Environment Configuration
 *
 * **Purpose**: Global test environment configuration and mode management
 * **Architecture**: Shared Layer test infrastructure (`src/shared/external/test/`)
 * **Scope**: Test-only module (`src/shared/testing/`, test code)
 * **Policy**: Internal implementation (no barrel export)
 *
 * **Features**:
 * - Enable/disable mock services globally
 * - Test metadata tracking (count, uptime, current test name)
 * - Network delay simulation for testing
 * - Automatic cleanup options
 *
 * **Usage Example**:
 * ```typescript
 * import { enableTestMode, getTestConfig } from '@shared/external/test/test-environment-config';
 *
 * // Enable test mode
 * enableTestMode({ mockServices: true, autoCleanup: true });
 *
 * // Get configuration
 * const config = getTestConfig();
 * console.log(config.enabled); // true
 * ```
 *
 * **Barrel Export Policy**: None (direct imports from `@shared/external/test/<filename>`)
 *
 * @internal Test infrastructure only - Do not use in production code
 * @version 2.0.0 - Phase 371: Language policy enforcement + @internal marking
 * @module shared/external/test/test-environment-config
 * @see ../README.md - Directory overview
 * @see ./test-service-factory.ts - Service factory pattern
 */

/**
 * Test mode options - Phase 371+
 *
 * Test environment configuration options
 * @internal
 */
export interface TestModeOptions {
  /** Enable mock services globally */
  mockServices: boolean;
  /** Enable detailed test logging */
  verbose: boolean;
  /** Automatically cleanup after each test */
  autoCleanup: boolean;
  /** Simulate network delays in tests */
  simulateNetworkDelay: boolean;
  /** Default network delay in milliseconds */
  networkDelayMs: number;
}

/**
 * Test environment configuration - Phase 371+
 *
 * Complete test environment configuration state
 * @internal
 */
export interface TestEnvironmentConfig {
  /** Is test mode enabled */
  enabled: boolean;
  /** Test mode options */
  options: TestModeOptions;
  /** Current test name (set during test execution) */
  currentTest: string | undefined;
  /** Test metadata */
  metadata: {
    startTime: number;
    testCount: number;
    cleanupCount: number;
  };
}

/**
 * Default test mode options - Phase 371+
 * @internal
 */
const DEFAULT_TEST_OPTIONS: TestModeOptions = {
  mockServices: true,
  verbose: false,
  autoCleanup: true,
  simulateNetworkDelay: false,
  networkDelayMs: 0,
};

/**
 * Default test configuration - Phase 371+
 * @internal
 */
const DEFAULT_CONFIG: TestEnvironmentConfig = {
  enabled:
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as Record<string, unknown>).__VITEST__ !== 'undefined',
  options: { ...DEFAULT_TEST_OPTIONS },
  currentTest: undefined,
  metadata: {
    startTime: Date.now(),
    testCount: 0,
    cleanupCount: 0,
  },
};

/** Global test configuration instance - Phase 370+ */
let testConfig: TestEnvironmentConfig = { ...DEFAULT_CONFIG };

/**
 * Get current test environment configuration - Phase 371+
 *
 * Retrieve the current test environment configuration state
 *
 * @returns Current test configuration
 * @internal
 */
export function getTestConfig(): TestEnvironmentConfig {
  return testConfig;
}

/**
 * Set test environment configuration - Phase 371+
 *
 * Update test configuration partially (deep merge with current)
 *
 * @param config Partial configuration to merge with current
 * @returns Updated configuration
 * @internal
 */
export function setTestConfig(config: Partial<TestEnvironmentConfig>): TestEnvironmentConfig {
  testConfig = {
    ...testConfig,
    ...config,
    options: {
      ...testConfig.options,
      ...(config.options || {}),
    },
    metadata: {
      ...testConfig.metadata,
      ...(config.metadata || {}),
    },
  };
  return testConfig;
}

/**
 * Reset test configuration to defaults - Phase 371+
 *
 * Reset all test configuration to initial default values
 *
 * @returns Default configuration
 * @internal
 */
export function resetTestConfig(): TestEnvironmentConfig {
  testConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  return testConfig;
}

/**
 * Enable test mode - Phase 371+
 *
 * Activate test mode and optionally set test mode options
 *
 * @param options Optional test mode options to apply
 * @returns Updated configuration
 * @internal
 */
export function enableTestMode(options?: Partial<TestModeOptions>): TestEnvironmentConfig {
  return setTestConfig({
    enabled: true,
    options: {
      ...testConfig.options,
      ...(options || {}),
    },
  });
}

/**
 * Disable test mode - Phase 371+
 *
 * Deactivate test mode and revert to production mode
 *
 * @returns Updated configuration
 * @internal
 */
export function disableTestMode(): TestEnvironmentConfig {
  return setTestConfig({
    enabled: false,
  });
}

/**
 * Check if test mode is enabled - Phase 371+
 *
 * Determine whether test mode is currently active
 *
 * @returns True if test mode is enabled
 * @internal
 */
export function isTestModeEnabled(): boolean {
  return testConfig.enabled;
}

/**
 * Set current test name - Phase 371+
 *
 * Record the currently executing test name and increment test counter
 *
 * @param testName Name of current test
 * @internal
 */
export function setCurrentTest(testName: string): void {
  testConfig.currentTest = testName;
  testConfig.metadata.testCount += 1;
}

/**
 * Clear current test - Phase 371+
 *
 * Remove the current test name and increment cleanup counter
 *
 * @internal
 */
export function clearCurrentTest(): void {
  testConfig.currentTest = undefined;
  testConfig.metadata.cleanupCount += 1;
}

/**
 * Get test metadata - Phase 371+
 *
 * Retrieve test execution metadata including uptime, counts, and status
 *
 * @returns Test execution metadata with calculated uptime
 * @internal
 */
export function getTestMetadata() {
  const uptime = Date.now() - testConfig.metadata.startTime;
  return {
    ...testConfig.metadata,
    uptime,
    isTestMode: testConfig.enabled,
    currentTest: testConfig.currentTest,
  };
}

/**
 * Check if test mode feature is available - Phase 371+
 *
 * Determine whether a specific test mode feature (option) is enabled
 *
 * @param feature Feature name to check (e.g., 'mockServices', 'autoCleanup')
 * @returns True if feature is enabled
 * @internal
 *
 * @example
 * ```typescript
 * if (isTestFeatureEnabled('mockServices')) {
 *   console.log('Mock services are enabled for this test');
 * }
 * ```
 */
export function isTestFeatureEnabled(feature: keyof TestModeOptions): boolean {
  if (!isTestModeEnabled()) return false;
  return (testConfig.options[feature] as boolean) === true;
}
