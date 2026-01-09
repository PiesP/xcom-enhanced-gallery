/**
 * @fileoverview Base Service Types - Lifecycle contract for services
 */

/**
 * Base service lifecycle interface
 *
 * Provides a contract for services implementing initialization and cleanup logic.
 */
export interface BaseService {
  /**
   * Initialize the service.
   *
   * Called during application bootstrap. Handles setup, resource allocation,
   * and dependency initialization. Can be sync or async.
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
   */
  isInitialized?(): boolean;
}
