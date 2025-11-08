/**
 * Test Service Factory
 *
 * **Purpose**: Factory pattern for selecting mock vs real service implementations in test environments
 * **Architecture**: Shared Layer test infrastructure (`src/shared/external/test/`)
 * **Scope**: Test-only module (test code, not production)
 * **Policy**: Internal implementation (no barrel export)
 *
 * **Features**:
 * - Conditional implementation selection (mock vs real)
 * - Service status querying and validation
 * - Automatic fallback on creation errors
 * - Test helper assertion functions
 *
 * **Usage Example**:
 * ```typescript
 * import { createConditionalService } from '@shared/external/test/test-service-factory';
 *
 * // Conditional mock or real service creation
 * const httpService = createConditionalService(
 *   'HttpRequestService',
 *   () => new HttpRequestService(),        // Real implementation
 *   () => new MockHttpRequestService(),    // Mock implementation
 *   { forceMock: isTestMode }
 * );
 * ```
 *
 * **Selection Priority** (highest to lowest):
 * 1. Custom selector function (if provided)
 * 2. forceMock / forceReal flags
 * 3. Test mode + mockServices option
 * 4. Default: 'real' implementation
 *
 * **Barrel Export Policy**: None (direct imports from `@shared/external/test/<filename>`)
 *
 * @internal Test infrastructure only - Do not use in production code
 * @version 2.0.0 - Phase 371: Language policy enforcement + @internal marking
 * @module shared/external/test/test-service-factory
 * @see ../README.md - Directory overview
 * @see ./test-environment-config.ts - Test mode configuration
 */

import { isTestModeEnabled, isTestFeatureEnabled } from './test-environment-config';
import { logger } from '../../logging';

/**
 * Service availability status - Phase 371+
 *
 * Service availability information and implementation type
 * @internal
 */
export interface ServiceStatus {
  name: string;
  available: boolean;
  implementation: 'real' | 'mock';
  reason: string;
}

/**
 * Service factory options - Phase 371+
 *
 * Configuration for service implementation selection logic
 *
 * **Selection Priority** (highest to lowest):
 * 1. `selector` (custom function) - Highest priority
 * 2. `forceMock` / `forceReal` - Explicit override
 * 3. Automatic test mode detection
 * 4. Default: 'real' implementation
 *
 * @internal
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
 * Get service implementation type - Phase 371+
 *
 * Determine which implementation (mock or real) to use based on selection logic
 *
 * **Selection Priority**:
 * 1. Custom selector (highest)
 * 2. forceMock/forceReal explicit flags
 * 3. Automatic test mode detection
 * 4. Default: 'real'
 *
 * @param serviceName Name of service for logging
 * @param options Factory options
 * @returns 'mock' or 'real' implementation type
 * @internal
 *
 * @example
 * ```typescript
 * const impl = getServiceImplementation('HttpService', { forceMock: true });
 * console.log(impl); // 'mock'
 * ```
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
 * Create service with conditional implementation - Phase 371+
 *
 * Create service instance with automatic implementation selection (mock or real)
 *
 * **Features**:
 * - Conditional implementation selection (via getServiceImplementation)
 * - Automatic fallback on error (tries opposite implementation)
 * - Detailed debug logging
 *
 * **Fallback Behavior**:
 * - Mock creation fails → Try real implementation
 * - Real creation fails → Try mock implementation
 * - Both fail → Throw original error
 *
 * @template T Service type
 * @param serviceName Name of service for logging
 * @param realImpl Real implementation factory
 * @param mockImpl Mock implementation factory
 * @param options Factory options (controls selection logic)
 * @returns Selected implementation instance
 * @throws Error if both implementations fail
 * @internal
 *
 * @example
 * ```typescript
 * // Basic usage with automatic test mode detection
 * const httpService = createConditionalService(
 *   'HttpRequestService',
 *   () => new HttpRequestService(),
 *   () => new MockHttpRequestService()
 * );
 *
 * // Force mock implementation
 * const testService = createConditionalService(
 *   'HttpRequestService',
 *   () => new HttpRequestService(),
 *   () => new MockHttpRequestService(),
 *   { forceMock: true }
 * );
 *
 * // Custom selection logic
 * const customService = createConditionalService(
 *   'HttpRequestService',
 *   () => new HttpRequestService(),
 *   () => new MockHttpRequestService(),
 *   {
 *     selector: () => process.env.USE_MOCK === 'true' ? 'mock' : 'real'
 *   }
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
 * Get service status information - Phase 371+
 *
 * Query service availability and implementation type details
 *
 * @param serviceName Name of service
 * @param options Factory options
 * @returns Service status information
 * @internal
 *
 * @example
 * ```typescript
 * const status = getServiceStatus('HttpService');
 * console.log(status);
 * // {
 * //   name: 'HttpService',
 * //   available: true,
 * //   implementation: 'real',
 * //   reason: 'Real implementation (test mode: false)'
 * // }
 * ```
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
 * Get all configured services status - Phase 371+
 *
 * Query status of multiple services in a single call
 *
 * @param serviceNames Names of services to check
 * @returns Array of service statuses
 * @internal
 *
 * @example
 * ```typescript
 * const statuses = getAllServiceStatuses([
 *   'HttpService',
 *   'StorageService',
 *   'NotificationService'
 * ]);
 * ```
 */
export function getAllServiceStatuses(serviceNames: string[]): ServiceStatus[] {
  return serviceNames.map(name => getServiceStatus(name));
}

/**
 * Assert service is using mock - Phase 371+
 *
 * Verify service is using mock implementation (test assertion helper)
 *
 * @param serviceName Name of service
 * @param options Factory options
 * @throws Error if service is not using mock implementation
 * @internal
 *
 * @example
 * ```typescript
 * // Force mock usage in test setup
 * beforeEach(() => {
 *   assertServiceIsMock('HttpService', { forceMock: true });
 * });
 * ```
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
 * Assert service is using real - Phase 371+
 *
 * Verify service is using real implementation (test assertion helper)
 *
 * @param serviceName Name of service
 * @param options Factory options
 * @throws Error if service is not using real implementation
 * @internal
 *
 * @example
 * ```typescript
 * // Force real implementation in production test
 * beforeEach(() => {
 *   assertServiceIsReal('HttpService');
 * });
 * ```
 */
export function assertServiceIsReal(serviceName: string, options?: ServiceFactoryOptions): void {
  const implementation = getServiceImplementation(serviceName, options);
  if (implementation !== 'real') {
    throw new Error(
      `Expected ${serviceName} to use real implementation, but got ${implementation}`
    );
  }
}
