import {
  isTestFeatureEnabled,
  isTestModeEnabled,
} from "./test-environment-config";

type ImplementationType = "mock" | "real";

export interface ServiceStatus {
  name: string;
  available: boolean;
  implementation: ImplementationType;
  reason: string;
}

export interface ServiceFactoryOptions {
  forceMock?: boolean;
  forceReal?: boolean;
  selector?: () => ImplementationType;
}

function pickImplementation(
  options?: ServiceFactoryOptions,
): ImplementationType {
  if (options?.selector) {
    return options.selector();
  }

  if (options?.forceMock) {
    return "mock";
  }

  if (options?.forceReal) {
    return "real";
  }

  if (isTestModeEnabled() && isTestFeatureEnabled("mockServices")) {
    return "mock";
  }

  return "real";
}

export function getServiceImplementation(
  _serviceName: string,
  options?: ServiceFactoryOptions,
): ImplementationType {
  return pickImplementation(options);
}

export function createConditionalService<T>(
  serviceName: string,
  realImpl: () => T,
  mockImpl: () => T,
  options?: ServiceFactoryOptions,
): T {
  const implementation = pickImplementation(options);
  const factory = implementation === "mock" ? mockImpl : realImpl;

  try {
    return factory();
  } catch (error) {
    if (error instanceof Error) {
      error.message = `[TestServiceFactory] ${serviceName}: ${error.message}`;
      throw error;
    }

    throw new Error(`[TestServiceFactory] ${serviceName}: ${String(error)}`);
  }
}

export function getServiceStatus(
  serviceName: string,
  options?: ServiceFactoryOptions,
): ServiceStatus {
  const implementation = pickImplementation(options);
  const testModeEnabled = isTestModeEnabled();

  return {
    name: serviceName,
    available: true,
    implementation,
    reason:
      implementation === "mock"
        ? `Test mode mock (enabled: ${testModeEnabled})`
        : `Real implementation (test mode: ${testModeEnabled})`,
  };
}

export function getAllServiceStatuses(serviceNames: string[]): ServiceStatus[] {
  return serviceNames.map((name) => getServiceStatus(name));
}

export function assertServiceIsMock(
  serviceName: string,
  options?: ServiceFactoryOptions,
): void {
  const implementation = pickImplementation(options);
  if (implementation !== "mock") {
    throw new Error(
      `Expected ${serviceName} to use mock implementation, but got ${implementation}`,
    );
  }
}

export function assertServiceIsReal(
  serviceName: string,
  options?: ServiceFactoryOptions,
): void {
  const implementation = pickImplementation(options);
  if (implementation !== "real") {
    throw new Error(
      `Expected ${serviceName} to use real implementation, but got ${implementation}`,
    );
  }
}
