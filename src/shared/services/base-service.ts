/**
 * @fileoverview Base Service Implementation - Unified Service Lifecycle Pattern
 *
 * 🔹 System Role:
 * Abstract base class providing standardized lifecycle management for all services
 * implementing BaseService interface. Eliminates duplication across service hierarchy
 * by centralizing initialize/destroy/isInitialized logic with automatic logging.
 *
 * 🔹 Architecture:
 * ```
 * BaseServiceImpl (abstract)
 *   ├─ Template Method Pattern: initialize() → onInitialize()
 *   ├─ Template Method Pattern: destroy() → onDestroy()
 *   └─ State Management: _isInitialized flag
 *      ↑
 *      └─ Subclasses (ThemeService, LanguageService, etc)
 *         └─ Override onInitialize() and onDestroy() for custom logic
 *         └─ Phase 414: AnimationService removed (optional feature)
 * ```
 *
 * 🔹 Key Characteristics:
 * - **Abstract Base Class**: Cannot instantiate directly, must subclass
 * - **Template Method Pattern**: initialize() calls onInitialize() hook
 * - **Idempotent Lifecycle**: Multiple initialize() calls safe
 * - **Automatic Logging**: All state transitions logged via logger
 * - **Consistent Error Handling**: Failures logged and re-thrown
 * - **Graceful Destroy**: No errors if not initialized
 *
 * 🔹 State Management:
 * - `_isInitialized`: Tracks service readiness (private, subclass can read)
 * - `serviceName`: Descriptive name for logging (set by subclass)
 * - Protects against double-initialization
 *
 * 🔹 Lifecycle Flow:
 * ```
 * new ServiceImpl()       // Constructor called (service created)
 *   ↓
 * await initialize()     // onInitialize() hook called
 *   ↓ (success)
 * _isInitialized = true
 *   ↓ (logged)
 * // Service ready to use
 *   ↓
 * await destroy()        // onDestroy() hook called
 *   ↓
 * _isInitialized = false
 *   ↓ (logged)
 * // Service cleaned up
 * ```
 *
 * 🔹 Error Handling Strategy:
 * - Initialization errors: Caught, logged, re-thrown (fail-fast)
 * - Destruction errors: Caught and logged (don't propagate)
 * - Both preserve service state on error (idempotent)
 *
 * 🔹 Integration with Phase 309:
 * This base class works with Singleton services (e.g., PersistentStorage)
 * which don't use BaseService (lightweight wrappers), and complex services
 * (e.g., ThemeService) which use BaseService for lifecycle management.
 *
 * 🔹 Subclass Contract:
 * Subclasses must:
 * 1. Pass serviceName to super() constructor
 * 2. Implement onInitialize(): Setup resources, register listeners
 * 3. Implement onDestroy(): Cleanup, deregister listeners
 * 4. Call logger methods for diagnostics (logger already imported)
 *
 * 🔹 Usage Pattern:
 * ```typescript
 * // Subclass implementation
 * export class ThemeService extends BaseServiceImpl {
 *   constructor() {
 *     super('ThemeService');
 *   }
 *
 *   protected async onInitialize(): Promise<void> {
 *     const theme = await storage.get<Theme>('theme');
 *     applyTheme(theme);
 *     logger.info('Theme loaded: ' + theme.name);
 *   }
 *
 *   protected onDestroy(): void {
 *     removeThemeListener();
 *   }
 * }
 *
 * // Usage
 * const service = new ThemeService();
 * await service.initialize();     // Calls onInitialize()
 * if (service.isInitialized()) { // Check state
 *   applyCustomTheme();
 * }
 * service.destroy();               // Calls onDestroy()
 * ```
 *
 * 🔹 Related Services:
 * - PersistentStorage: Singleton (no BaseService)
 * - NotificationService: Singleton (no BaseService)
 * - ThemeService: BaseService subclass (uses BaseServiceImpl)
 * - LanguageService: BaseService subclass (uses BaseServiceImpl)
 *
 * @see {@link BaseService} for interface definition
 * @see {@link ARCHITECTURE.md} for Phase 309 Service Layer details
 */

import { logger } from '@shared/logging';
import type { BaseService } from '@shared/types/app.types';

/**
 * Base Service Implementation - Abstract service lifecycle base class
 *
 * 🔹 Purpose:
 * Provides common service lifecycle management (initialize, destroy, state tracking)
 * for all services implementing BaseService interface. Eliminates boilerplate code
 * by centralizing state management, logging, and error handling.
 *
 * 🔹 Template Method Pattern:
 * - initialize(): Manages state, logging, error handling → calls onInitialize()
 * - destroy(): Manages state, logging, error handling → calls onDestroy()
 * - Subclasses override onInitialize() and onDestroy() for custom logic
 *
 * 🔹 State Tracking:
 * - _isInitialized: Private flag (true after initialize(), false after destroy())
 * - serviceName: Unique identifier for logging (set by subclass)
 * - Prevents double-initialization with early exit check
 *
 * 🔹 Automatic Logging:
 * - initialize() start: `${serviceName} initializing...`
 * - initialize() success: `${serviceName} initialized`
 * - initialize() error: `${serviceName} initialization failed: ${error}`
 * - destroy() start: `${serviceName} destroying...`
 * - destroy() end: `${serviceName} destroyed`
 * - destroy() error: `${serviceName} destroy failed: ${error}` (non-fatal)
 *
 * 🔹 Error Handling Philosophy:
 * - Initialize failures: Re-throw (fail-fast, stop application startup)
 * - Destroy failures: Log only (don't block shutdown)
 * - Both idempotent: Safe to retry or call multiple times
 *
 * 🔹 Subclass Requirements:
 * 1. Call super(serviceName) in constructor
 * 2. Implement onInitialize(): Promise<void> | void
 * 3. Implement onDestroy(): void
 * 4. Access this.serviceName and logger in hook methods
 *
 * 🔹 Common Subclass Patterns:
 *
 * **Setup in onInitialize**:
 * ```typescript
 * protected async onInitialize(): Promise<void> {
 *   // Load configuration
 *   const config = await loadConfig();
 *
 *   // Register listeners
 *   window.addEventListener('storagechange', this.handleStorageChange);
 *
 *   // Apply initial state
 *   applySettings(config);
 *
 *   // Log completion
 *   logger.info(`${this.serviceName}: Settings applied`);
 * }
 * ```
 *
 * **Cleanup in onDestroy**:
 * ```typescript
 * protected onDestroy(): void {
 *   // Remove listeners
 *   window.removeEventListener('storagechange', this.handleStorageChange);
 *
 *   // Clear caches
 *   this.cache.clear();
 *
 *   // Cleanup resources
 *   logger.info(`${this.serviceName}: Cleanup complete`);
 * }
 * ```
 *
 * 🔹 Lifecycle Examples:
 *
 * **Successful Initialization**:
 * ```
 * service.initialize()
 *   → logger.info('ThemeService initializing...')
 *   → onInitialize() executes (user code)
 *   → _isInitialized = true
 *   → logger.info('ThemeService initialized')
 * ```
 *
 * **Initialization Error**:
 * ```
 * service.initialize()
 *   → logger.info('ThemeService initializing...')
 *   → onInitialize() throws Error
 *   → logger.error('ThemeService initialization failed: <error>')
 *   → Error re-thrown (stop startup)
 *   → _isInitialized = false (unchanged)
 * ```
 *
 * **Destruction**:
 * ```
 * service.destroy()
 *   → logger.info('ThemeService destroying...')
 *   → onDestroy() executes
 *   → _isInitialized = false
 *   → logger.info('ThemeService destroyed')
 * ```
 *
 * @abstract Cannot instantiate directly (abstract class)
 * @implements {BaseService} Provides BaseService interface implementation
 *
 * @example
 * ```typescript
 * // Full subclass example
 * class MyService extends BaseServiceImpl {
 *   private config: Config | null = null;
 *   private listener: EventListener | null = null;
 *
 *   constructor() {
 *     super('MyService');
 *   }
 *
 *   protected async onInitialize(): Promise<void> {
 *     this.config = await loadConfig();
 *     this.listener = (e) => handleConfigChange(e);
 *     window.addEventListener('config-change', this.listener);
 *   }
 *
 *   protected onDestroy(): void {
 *     if (this.listener) {
 *       window.removeEventListener('config-change', this.listener);
 *       this.listener = null;
 *     }
 *   }
 *
 *   // Public API methods
 *   public getConfig(): Config | null {
 *     if (!this.isInitialized()) {
 *       throw new Error('Service not initialized');
 *     }
 *     return this.config;
 *   }
 * }
 * ```
 *
 * @see {@link BaseService} for interface definition
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
      this._isInitialized = false;
      logger.info(`${this.serviceName} destroyed`);
    } catch (error) {
      logger.error(`${this.serviceName} destroy failed:`, error);
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
