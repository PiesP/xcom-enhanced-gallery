/**
 * @fileoverview Test Harness - Lightweight service initialization for tests
 * @version 1.0.0 - Test environment container management
 * @phase 402: Enhanced documentation for test infrastructure
 *
 * Provides simplified service registration, retrieval, and lifecycle management
 * for test suites. Acts as a bridge to CoreService with convenient test-focused APIs.
 *
 * **Test Only**: Not used in runtime code. Consumed by test harness utilities
 * and test suites for service initialization and mocking.
 *
 * **Key Responsibilities**:
 * - Initialize core services for test environments
 * - Provide type-safe service registration
 * - Offer both strict and lenient service retrieval (get vs tryGet)
 * - Reset singleton state between test cases
 *
 * **Usage Pattern**:
 * 1. Create harness: const harness = createTestHarness()
 * 2. Initialize: await harness.initCoreServices()
 * 3. Register mocks: harness.register(SERVICE_KEYS.MyService, mockInstance)
 * 4. Retrieve: const service = harness.get<MyService>(SERVICE_KEYS.MyService)
 * 5. Cleanup: harness.reset() - resets singleton for next test
 *
 * **Comparison with Direct CoreService**:
 * - harness.get<T>(): Throws if not found (strict validation)
 * - harness.tryGet<T>(): Returns null if not found (lenient)
 * - harness.reset(): Clears all registrations (test isolation)
 *
 * **Memory Safety**:
 * - Each test should call reset() in teardown
 * - Prevents service pollution between tests
 * - Critical for test independence and reliability
 *
 * **Type Safety**:
 * - Generic type parameter <T> ensures compile-time checking
 * - SERVICE_KEYS constants prevent string-based runtime errors
 * - Typed get/tryGet methods validate at compile time
 */
import { bridgeGetService, bridgeTryGet, bridgeRegister } from './service-bridge';
import { CoreService } from '../services/service-manager';

/**
 * @class TestHarness
 * Lightweight container for test environment service management.
 *
 * Provides a simplified interface to CoreService optimized for test scenarios.
 * Handles service initialization, registration, retrieval, and cleanup.
 *
 * **Design Pattern**: Facade pattern - simplifies CoreService API for tests
 * **Lifecycle**: Create → Initialize → Register Mocks → Test → Reset
 * **Thread Safety**: Assumes single-threaded test execution
 *
 * **Methods**:
 * - initCoreServices(): Async initialization of core services
 * - register(): Register mock or test service instance
 * - get(): Retrieve service (throws if not found)
 * - tryGet(): Retrieve service (returns null if not found)
 * - reset(): Clear all registrations (test isolation)
 *
 * **Type Safety**: All methods use generic type parameters for compile-time safety
 */
export class TestHarness {
  /**
   * Core services initialization
   * Dynamically imports and registers all core services (lazy loading).
   * Safe to call multiple times - idempotent operation.
   *
   * @async
   * @returns Promise that resolves when services initialized
   * @throws Error if service registration fails
   *
   * **Side Effects**:
   * - Imports service-initialization module
   * - Registers all services with CoreService
   * - May initialize external dependencies (DB, API clients)
   *
   * **Usage**: Call once per test suite or before each test
   */
  async initCoreServices(): Promise<void> {
    const { registerCoreServices } = await import('../services/service-initialization');
    await registerCoreServices();
  }

  /**
   * Service registration for test mocks and instances
   * Register a mock or test service instance by key.
   *
   * @template T Service type/interface
   * @param key Service key (from SERVICE_KEYS constant)
   * @param instance Service instance to register
   *
   * **Type Safety**: Generic T ensures instance conforms to key type
   * **Override Behavior**: Overwrites any previously registered service at key
   * **Visibility**: Service immediately available via get() or tryGet()
   *
   * **Common Use Cases**:
   * - Mock external APIs (HTTP clients, storage)
   * - Spy on service interactions
   * - Inject test-specific behavior
   *
   * **Precondition**: initCoreServices() must be called first
   */
  register<T>(key: string, instance: T): void {
    bridgeRegister<T>(key, instance);
  }

  /**
   * Strict service retrieval - throws if not found
   * Retrieve registered service instance by key.
   *
   * @template T Service type/interface
   * @param key Service key (from SERVICE_KEYS constant)
   * @returns Service instance of type T
   * @throws Error if service not registered under key
   *
   * **Type Safety**: Generic T ensures return type matches registration
   * **Semantics**: Fail-fast approach - errors caught immediately
   * **Use When**: Service must exist (programming error otherwise)
   *
   * **Contrast with tryGet()**:
   * - get(): Throws on missing (strict validation)
   * - tryGet(): Returns null on missing (lenient handling)
   *
   * **Precondition**: Service must be registered first
   */
  get<T>(key: string): T {
    return bridgeGetService<T>(key);
  }

  /**
   * Lenient service retrieval - returns null if not found
   * Safely retrieve service instance, handling missing service case.
   *
   * @template T Service type/interface
   * @param key Service key (from SERVICE_KEYS constant)
   * @returns Service instance of type T, or null if not registered
   * @throws Never - always succeeds, returns null on missing
   *
   * **Type Safety**: Generic T ensures return type matches registration
   * **Semantics**: Null-safe approach - graceful handling of missing services
   * **Use When**: Service may not be registered or is optional
   *
   * **Null Checking Pattern**:
   * - if (service) use service
   * - else use fallback
   *
   * **Contrast with get()**:
   * - get(): Throws on missing (strict validation)
   * - tryGet(): Returns null on missing (lenient handling)
   *
   * **Safety**: Always check return value before use
   */
  tryGet<T>(key: string): T | null {
    return bridgeTryGet<T>(key);
  }

  /**
   * Lifecycle reset - clears all registrations
   * Reset singleton state for next test. Essential for test isolation.
   *
   * @returns void
   * **Side Effects**:
   * - Clears all registered services from CoreService
   * - Resets singleton to initial state
   * - Enables subsequent tests to start fresh
   *
   * **Critical for Tests**: Prevents service pollution between tests
   * **Timing**: Call in teardown (afterEach hook)
   * **Idempotent**: Safe to call multiple times
   *
   * **Without Reset**: Previous test's mocks affect next test (flaky tests)
   * **Pattern**: Setup → Test → Cleanup (reset)
   */
  reset(): void {
    CoreService.resetInstance();
  }
}

/**
 * Factory function to create test harness instance
 * Creates and returns new TestHarness for test suite.
 *
 * @returns New TestHarness instance
 * **Pattern**: Factory pattern - encapsulates instance creation
 * **Idempotent**: Each call returns new independent instance
 * **Usage**: Typically called in beforeEach or describe block
 *
 * **Design Benefit**: Isolates test setup logic, improves readability
 * **Convenience**: Shorter than new TestHarness() constructor call
 */
export function createTestHarness(): TestHarness {
  return new TestHarness();
}
