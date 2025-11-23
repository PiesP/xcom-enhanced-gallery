// Central test environment state shared across test helpers.
// Import directly from this module; it is not re-exported from '@shared/external'.

export interface TestModeOptions {
  mockServices: boolean;
  verbose: boolean;
  autoCleanup: boolean;
  simulateNetworkDelay: boolean;
  networkDelayMs: number;
}

export interface TestEnvironmentConfig {
  enabled: boolean;
  options: TestModeOptions;
  currentTest: string | undefined;
  metadata: {
    startTime: number;
    testCount: number;
    cleanupCount: number;
  };
}

const DETECTED_VITEST =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as Record<string, unknown>).__VITEST__ !== "undefined";

const DEFAULT_TEST_OPTIONS: TestModeOptions = {
  mockServices: true,
  verbose: false,
  autoCleanup: true,
  simulateNetworkDelay: false,
  networkDelayMs: 0,
};

function createDefaultConfig(): TestEnvironmentConfig {
  return {
    enabled: DETECTED_VITEST,
    options: { ...DEFAULT_TEST_OPTIONS },
    currentTest: undefined,
    metadata: {
      startTime: Date.now(),
      testCount: 0,
      cleanupCount: 0,
    },
  };
}

let testConfig: TestEnvironmentConfig = createDefaultConfig();

export function getTestConfig(): TestEnvironmentConfig {
  return testConfig;
}

export function setTestConfig(
  config: Partial<TestEnvironmentConfig>,
): TestEnvironmentConfig {
  testConfig = {
    ...testConfig,
    ...config,
    options: {
      ...testConfig.options,
      ...(config.options ?? {}),
    },
    metadata: {
      ...testConfig.metadata,
      ...(config.metadata ?? {}),
    },
  };

  return testConfig;
}

export function resetTestConfig(): TestEnvironmentConfig {
  testConfig = createDefaultConfig();
  return testConfig;
}

export function enableTestMode(
  options?: Partial<TestModeOptions>,
): TestEnvironmentConfig {
  return setTestConfig({
    enabled: true,
    options: {
      ...testConfig.options,
      ...(options ?? {}),
    },
  });
}

export function disableTestMode(): TestEnvironmentConfig {
  return setTestConfig({ enabled: false });
}

export function isTestModeEnabled(): boolean {
  return testConfig.enabled;
}

export function setCurrentTest(testName: string): void {
  testConfig.currentTest = testName;
  testConfig.metadata.testCount += 1;
}

export function clearCurrentTest(): void {
  testConfig.currentTest = undefined;
  testConfig.metadata.cleanupCount += 1;
}

export function getTestMetadata() {
  return {
    ...testConfig.metadata,
    uptime: Date.now() - testConfig.metadata.startTime,
    isTestMode: testConfig.enabled,
    currentTest: testConfig.currentTest,
  };
}

export function isTestFeatureEnabled(feature: keyof TestModeOptions): boolean {
  if (!testConfig.enabled) {
    return false;
  }

  return Boolean(testConfig.options[feature]);
}
