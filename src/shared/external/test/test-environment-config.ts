/**
 * @fileoverview Test Environment Configuration - Phase 314-7
 * @description Global test mode settings and configuration management
 * @module shared/external/test/test-environment-config
 */

/**
 * Test mode options - Phase 314-7
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
 * Test environment configuration - Phase 314-7
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
 * Default test mode options - Phase 314-7
 */
const DEFAULT_TEST_OPTIONS: TestModeOptions = {
  mockServices: true,
  verbose: false,
  autoCleanup: true,
  simulateNetworkDelay: false,
  networkDelayMs: 0,
};

/**
 * Default test configuration - Phase 314-7
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

/** Global test configuration instance - Phase 314-7 */
let testConfig: TestEnvironmentConfig = { ...DEFAULT_CONFIG };

/**
 * Get current test environment configuration - Phase 314-7
 *
 * @returns Current test configuration
 */
export function getTestConfig(): TestEnvironmentConfig {
  return testConfig;
}

/**
 * Set test environment configuration - Phase 314-7
 *
 * @param config Partial configuration to merge with current
 * @returns Updated configuration
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
 * Reset test configuration to defaults - Phase 314-7
 *
 * @returns Default configuration
 */
export function resetTestConfig(): TestEnvironmentConfig {
  testConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  return testConfig;
}

/**
 * Enable test mode - Phase 314-7
 *
 * @param options Optional test mode options
 * @returns Updated configuration
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
 * Disable test mode - Phase 314-7
 *
 * @returns Updated configuration
 */
export function disableTestMode(): TestEnvironmentConfig {
  return setTestConfig({
    enabled: false,
  });
}

/**
 * Check if test mode is enabled - Phase 314-7
 *
 * @returns True if test mode is enabled
 */
export function isTestModeEnabled(): boolean {
  return testConfig.enabled;
}

/**
 * Set current test name - Phase 314-7
 *
 * @param testName Name of current test
 */
export function setCurrentTest(testName: string): void {
  testConfig.currentTest = testName;
  testConfig.metadata.testCount += 1;
}

/**
 * Clear current test - Phase 314-7
 */
export function clearCurrentTest(): void {
  testConfig.currentTest = undefined;
  testConfig.metadata.cleanupCount += 1;
}

/**
 * Get test metadata - Phase 314-7
 *
 * @returns Test execution metadata
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
 * Check if test mode feature is available - Phase 314-7
 *
 * @param feature Feature name to check
 * @returns True if feature is enabled
 */
export function isTestFeatureEnabled(feature: keyof TestModeOptions): boolean {
  if (!isTestModeEnabled()) return false;
  return (testConfig.options[feature] as boolean) === true;
}
