/**
 * @fileoverview Base Service Types
 * @description Base service interface definition
 *
 * Defines the lifecycle contract for all services in the application.
 * Used to prevent circular dependencies while ensuring consistent
 * service initialization and cleanup patterns.
 */

/**
 * Base service lifecycle interface
 *
 * Provides a contract for services implementing initialization and cleanup logic.
 * All lifecycle methods are optional to accommodate simple services without state management.
 *
 * @property initialize - Called during service bootstrap to perform async initialization
 * @property destroy - Called during cleanup to release resources and unsubscribe from listeners
 * @property isInitialized - Returns current initialization state for conditional logic
 *
 * @example
 * ```typescript
 * export class ThemeService implements BaseService {
 *   async initialize(): Promise<void> {
 *     // async setup
 *   }
 *
 *   destroy(): void {
 *     // cleanup
 *   }
 *
 *   isInitialized(): boolean {
 *     return this.initialized;
 *   }
 * }
 * ```
 */
export interface BaseService {
  /**
   * Initialize the service.
   *
   * Called during application bootstrap. Handles setup, resource allocation,
   * and dependency initialization. Can be sync or async.
   *
   * @returns Promise that resolves when initialization completes (if async)
   */
  initialize?(): Promise<void> | void;

  /**
   * Destroy the service.
   *
   * Called during cleanup/unmounting. Releases resources, cancels subscriptions,
   * and clears event listeners to prevent memory leaks.
   */
  destroy?(): void;

  /**
   * Check if the service is initialized.
   *
   * @returns True if the service has completed initialization
   */
  isInitialized?(): boolean;
}
