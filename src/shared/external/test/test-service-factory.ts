/**
 * @fileoverview Test Service Factory - Phase 314-7
 * @description Conditional mock/real service selection based on test environment
 * @module shared/external/test/test-service-factory
 */

import { isTestModeEnabled, isTestFeatureEnabled } from './test-environment-config';
import { logger } from '../../logging';

/**
 * Service availability status - Phase 314-7
 */
export interface ServiceStatus {
  name: string;
  available: boolean;
  implementation: 'real' | 'mock';
  reason: string;
}

/**
 * Service factory options - Phase 314-7
 */
export interface ServiceFactoryOptions {
  /** Override automatic mock detection */
  forceMock?: boolean;
  /** Override automatic real detection */
  forceReal?: boolean;
  /** Custom implementation selection logic */
  selector?: () => 'mock' | 'real';
}

/**
 * Get service implementation type - Phase 314-7
 *
 * Determines whether to use mock or real implementation based on:
 * 1. Custom selector if provided
 * 2. forceMock/forceReal options
 * 3. Test mode and mockServices option
 * 4. Environment detection
 *
 * @param serviceName Name of service for logging
 * @param options Factory options
 * @returns 'mock' or 'real' implementation
 */
export function getServiceImplementation(
  serviceName: string,
  options?: ServiceFactoryOptions
): 'mock' | 'real' {
  // 1. Custom selector has highest priority
  if (options?.selector) {
    const selected = options.selector();
    logger.debug(`[TestServiceFactory] ${serviceName}: custom selector → ${selected}`);
    return selected;
  }

  // 2. Explicit force options
  if (options?.forceMock) {
    logger.debug(`[TestServiceFactory] ${serviceName}: forced to mock`);
    return 'mock';
  }
  if (options?.forceReal) {
    logger.debug(`[TestServiceFactory] ${serviceName}: forced to real`);
    return 'real';
  }

  // 3. Test mode with mock services enabled
  const testModeEnabled = isTestModeEnabled();
  const mockServicesEnabled = isTestFeatureEnabled('mockServices');

  if (testModeEnabled && mockServicesEnabled) {
    logger.debug(`[TestServiceFactory] ${serviceName}: test mode mock → mock`);
    return 'mock';
  }

  // 4. Default to real
  logger.debug(`[TestServiceFactory] ${serviceName}: default → real`);
  return 'real';
}

/**
 * Create service with conditional implementation - Phase 314-7
 *
 * @template T Service type
 * @param serviceName Name of service
 * @param realImpl Real implementation factory
 * @param mockImpl Mock implementation factory
 * @param options Factory options
 * @returns Selected implementation instance
 *
 * @example
 * ```typescript
 * const httpService = createConditionalService(
 *   'HttpRequestService',
 *   () => new HttpRequestService(),
 *   () => new MockHttpRequestService(),
 *   { forceMock: process.env.FORCE_MOCK === 'true' }
 * );
 * ```
 */
export function createConditionalService<T>(
  serviceName: string,
  realImpl: () => T,
  mockImpl: () => T,
  options?: ServiceFactoryOptions
): T {
  const implementation = getServiceImplementation(serviceName, options);

  try {
    if (implementation === 'mock') {
      const service = mockImpl();
      logger.debug(`[TestServiceFactory] ${serviceName}: created mock instance`);
      return service;
    } else {
      const service = realImpl();
      logger.debug(`[TestServiceFactory] ${serviceName}: created real instance`);
      return service;
    }
  } catch (error) {
    logger.error(
      `[TestServiceFactory] ${serviceName}: failed to create ${implementation} instance`,
      error
    );
    // Fallback to other implementation on error
    try {
      if (implementation === 'mock') {
        logger.warn(
          `[TestServiceFactory] ${serviceName}: mock creation failed, falling back to real`
        );
        return realImpl();
      } else {
        logger.warn(
          `[TestServiceFactory] ${serviceName}: real creation failed, falling back to mock`
        );
        return mockImpl();
      }
    } catch (fallbackError) {
      logger.error(`[TestServiceFactory] ${serviceName}: fallback also failed`, fallbackError);
      throw error;
    }
  }
}

/**
 * Get service status information - Phase 314-7
 *
 * @param serviceName Name of service
 * @param options Factory options
 * @returns Service status information
 */
export function getServiceStatus(
  serviceName: string,
  options?: ServiceFactoryOptions
): ServiceStatus {
  const implementation = getServiceImplementation(serviceName, options);
  const testModeEnabled = isTestModeEnabled();

  return {
    name: serviceName,
    available: true,
    implementation,
    reason:
      implementation === 'mock'
        ? `Test mode mock (enabled: ${testModeEnabled})`
        : `Real implementation (test mode: ${testModeEnabled})`,
  };
}

/**
 * Get all configured services status - Phase 314-7
 *
 * @param serviceNames Names of services to check
 * @returns Array of service statuses
 */
export function getAllServiceStatuses(serviceNames: string[]): ServiceStatus[] {
  return serviceNames.map(name => getServiceStatus(name));
}

/**
 * Assert service is using mock - Phase 314-7 (Testing helper)
 *
 * @param serviceName Name of service
 * @param options Factory options
 * @throws Error if service is not using mock
 */
export function assertServiceIsMock(serviceName: string, options?: ServiceFactoryOptions): void {
  const implementation = getServiceImplementation(serviceName, options);
  if (implementation !== 'mock') {
    throw new Error(
      `Expected ${serviceName} to use mock implementation, but got ${implementation}`
    );
  }
}

/**
 * Assert service is using real - Phase 314-7 (Testing helper)
 *
 * @param serviceName Name of service
 * @param options Factory options
 * @throws Error if service is not using real
 */
export function assertServiceIsReal(serviceName: string, options?: ServiceFactoryOptions): void {
  const implementation = getServiceImplementation(serviceName, options);
  if (implementation !== 'real') {
    throw new Error(
      `Expected ${serviceName} to use real implementation, but got ${implementation}`
    );
  }
}
