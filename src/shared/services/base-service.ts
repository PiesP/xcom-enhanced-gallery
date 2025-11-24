/**
 * @fileoverview Base Service Implementation - Unified Service Lifecycle Pattern
 * Abstract base class providing standardized lifecycle management.
 */

import { logger } from "@shared/logging";
import type { BaseService } from "@shared/types/app.types";

/**
 * Base Service Implementation - Abstract service lifecycle base class
 *
 * 🔹 Purpose:
 * Provides common service lifecycle management (initialize, destroy, state tracking)
 * for all services implementing BaseService interface.
 *
 * 🔹 Template Method Pattern:
 * - initialize(): Manages state, logging, error handling → calls onInitialize()
 * - destroy(): Manages state, logging, error handling → calls onDestroy()
 */

export abstract class BaseServiceImpl implements BaseService {
  protected _isInitialized = false;
  protected readonly serviceName: string;

  protected constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Service initialization
   *
   * 🔹 Process:
   * 1. Check if already initialized (return early)
   * 2. Log initialization start
   * 3. Call onInitialize() hook (subclass implementation)
   * 4. On success: Set _isInitialized = true, log completion
   * 5. On error: Log error and re-throw (fail-fast)
   *
   * 🔹 Idempotency:
   * Safe to call multiple times. Early exit prevents double-initialization.
   *
   * 🔹 Error Handling:
   * Initialization failures are fail-fast:
   * - Error logged with service name
   * - Error re-thrown to caller
   * - Application can catch and handle appropriately
   * - _isInitialized remains false (not partially initialized)
   *
   * 🔹 Logging Output:
   * Success:
   * ```
   * [info] ThemeService initializing...
   * [info] ThemeService initialized
   * ```
   * Failure:
   * ```
   * [info] ThemeService initializing...
   * [error] ThemeService initialization failed: Network timeout
   * [error] <stack trace>
   * ```
   *
   * @throws {Error} If initialization fails (error from onInitialize)
   *
   * @example
   * ```typescript
   * const service = new MyService();
   * try {
   *   await service.initialize();
   * } catch (error) {
   *   console.log('Service failed to initialize');
   * }
   * ```
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    logger.info(`${this.serviceName} initializing...`);

    try {
      await this.onInitialize();
      this._isInitialized = true;
      logger.info(`${this.serviceName} initialized`);
    } catch (error) {
      logger.error(`${this.serviceName} initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Service cleanup (destruction)
   *
   * 🔹 Process:
   * 1. Check if initialized (return early if not)
   * 2. Log destruction start
   * 3. Call onDestroy() hook (subclass implementation)
   * 4. Set _isInitialized = false
   * 5. Log completion
   * 6. If error: Log but don't re-throw (graceful degradation)
   *
   * 🔹 Idempotency:
   * Safe to call multiple times. Early exit prevents double-cleanup.
   *
   * 🔹 Error Handling:
   * Destruction failures are non-fatal (graceful degradation):
   * - Error logged with service name
   * - Error NOT re-thrown (don't block shutdown)
   * - _isInitialized set to false regardless
   * - Application shutdown continues
   *
   * 🔹 Logging Output:
   * Success:
   * ```
   * [info] ThemeService destroying...
   * [info] ThemeService destroyed
   * ```
   * Error (non-fatal):
   * ```
   * [info] ThemeService destroying...
   * [error] ThemeService destroy failed: <error>
   * [error] <stack trace>
   * [info] ThemeService destroyed (state cleaned up)
   * ```
   *
   * 🔹 Contrast with initialize():
   * - initialize(): Fail-fast (error re-thrown)
   * - destroy(): Graceful (error logged, not thrown)
   * - Rationale: Can't fail startup with destroy errors, must finish cleanup
   *
   * @example
   * ```typescript
   * const service = new MyService();
   * await service.initialize();
   * // ... use service ...
   * service.destroy(); // Always completes, never throws
   * ```
   */
  public destroy(): void {
    if (!this._isInitialized) {
      return;
    }

    logger.info(`${this.serviceName} destroying...`);

    try {
      this.onDestroy();
      logger.info(`${this.serviceName} destroyed`);
    } catch (error) {
      logger.error(`${this.serviceName} destroy failed:`, error);
    } finally {
      this._isInitialized = false;
    }
  }

  /**
   * Check initialization status
   *
   * 🔹 Purpose:
   * Allow consumers to check if service is ready before use.
   *
   * 🔹 Return Value:
   * - true: initialize() completed successfully, service ready
   * - false: Not initialized or destroy() was called
   *
   * 🔹 Use Cases:
   * - Guard against using uninitialized service
   * - Conditional initialization: if (!isInitialized()) await initialize()
   * - Feature gates: if (isInitialized()) enableFeature()
   * - Lifecycle checks: if (!isInitialized()) logger.error('Service not ready')
   *
   * 🔹 Relationship to _isInitialized:
   * Simply returns current _isInitialized flag state.
   * No side effects, pure query method.
   *
   * @returns true if service is initialized and ready to use
   *
   * @example
   * ```typescript
   * const service = new MyService();
   *
   * // Before initialization
   * console.log(service.isInitialized()); // false
   *
   * await service.initialize();
   * console.log(service.isInitialized()); // true
   *
   * // Public methods should check
   * public getConfig(): Config {
   *   if (!this.isInitialized()) {
   *     throw new Error('Service not initialized');
   *   }
   *   return this.config;
   * }
   *
   * // After destruction
   * service.destroy();
   * console.log(service.isInitialized()); // false
   * ```
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Subclass initialization hook
   *
   * 🔹 Purpose:
   * Abstract method for subclasses to implement service-specific initialization logic.
   *
   * 🔹 Called By:
   * initialize() method calls this after logging startup message.
   * If this throws, error is logged and re-thrown (fail-fast).
   *
   * 🔹 Responsibilities:
   * Subclass should:
   * - Load configuration/settings
   * - Register event listeners
   * - Apply initial state
   * - Prepare resources for service use
   * - Log completion with logger
   *
   * 🔹 Error Handling:
   * - Errors are caught by initialize() and re-thrown
   * - Initialization is fail-fast (don't partially initialize)
   * - Subclass doesn't need try-catch (base class handles)
   *
   * 🔹 Async Support:
   * Can be async (Promise<void>) or sync (void).
   * initialize() waits for Promise if returned.
   *
   * 🔹 Typical Implementation:
   * ```typescript
   * protected async onInitialize(): Promise<void> {
   *   const config = await storage.get<Config>('config');
   *   this.config = config;
   *   window.addEventListener('change', this.handleChange);
   *   logger.info(`${this.serviceName}: Ready`);
   * }
   * ```
   *
   * @throws {Error} If initialization fails (will be logged and re-thrown)
   */
  protected abstract onInitialize(): Promise<void> | void;

  /**
   * Subclass destruction hook
   *
   * 🔹 Purpose:
   * Abstract method for subclasses to implement service-specific cleanup logic.
   *
   * 🔹 Called By:
   * destroy() method calls this after logging destruction message.
   * Errors are caught and logged (graceful degradation).
   *
   * 🔹 Responsibilities:
   * Subclass should:
   * - Remove event listeners
   * - Clear caches
   * - Close connections
   * - Release resources
   * - Log completion with logger
   *
   * 🔹 Error Handling:
   * - Errors are caught and logged only (not re-thrown)
   * - Cleanup attempts continue even if errors occur
   * - Subclass doesn't need try-catch (base class handles)
   *
   * 🔹 Sync Only:
   * Must be synchronous (not async).
   * If async cleanup needed, call async helper and wait via Promise.
   *
   * 🔹 Typical Implementation:
   * ```typescript
   * protected onDestroy(): void {
   *   window.removeEventListener('change', this.handleChange);
   *   this.cache.clear();
   *   this.config = null;
   *   logger.info(`${this.serviceName}: Cleaned up`);
   * }
   * ```
   */
  protected abstract onDestroy(): void;
}
