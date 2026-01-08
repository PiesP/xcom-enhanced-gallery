/**
 * @fileoverview Lifecycle Utility Types
 * @description
 * Type definitions for resource lifecycle management shared across app/base/core layers.
 * Provides core interfaces for cleanup and lifecycle patterns used throughout the application.
 *
 * **Key Types**:
 * - `Cleanupable` - Simple cleanup contract for any resource requiring synchronous cleanup
 *
 * **Usage Context**:
 * Used by services, components, event managers, and utilities that need explicit cleanup.
 * These types enable composition-based lifecycle management and graceful resource teardown.
 *
 * **Related Types**:
 * - `BaseService` (@shared/types/core/base-service.types) - Full lifecycle interface
 * - `Lifecycle` (@shared/services/lifecycle) - Composition-based lifecycle management
 *
 * @see {@link https://github.com/xom-enhanced-gallery/blob/main/src/shared/services/lifecycle.ts} Lifecycle implementation
 *
 * @module shared/types/lifecycle
 * @version 2.0.0
 */

/**
 * Synchronously cleanupable resource interface.
 *
 * Minimal contract for resources that require explicit cleanup/teardown.
 * Implemented by services, event managers, subscriptions, and any resource
 * that needs synchronous cleanup when no longer needed.
 *
 * **Features**:
 * - Synchronous cleanup (blocking, not async)
 * - Single method contract (cleanup)
 * - Optional implementation of multiple cleanup phases
 *
 * **Usage**:
 * Implement this interface for resources that need explicit cleanup.
 * Call `cleanup()` during application teardown or when resource is no longer needed.
 *
 * **Example**:
 * ```typescript
 * import type { Cleanupable } from '@shared/types/lifecycle.types';
 *
 * class EventSubscription implements Cleanupable {
 *   constructor(private unsubscribe: () => void) {}
 *
 *   cleanup(): void {
 *     this.unsubscribe();
 *   }
 * }
 *
 * // Usage
 * const subscription = new EventSubscription(() => {
 *   eventManager.off('change', handler);
 * });
 *
 * // Later, when done
 * subscription.cleanup();
 * ```
 *
 * **Notes**:
 * - Cleanup methods should be idempotent (safe to call multiple times)
 * - Cleanup methods should not throw (errors should be logged but not propagated)
 * - For async cleanup, implement additional `destroy()` or use `Lifecycle` composition
 *
 * @see {@link @shared/services/lifecycle} - Composition-based lifecycle for full lifecycle management
 * @see {@link @shared/services/event-manager.ts} - Example: EventManager cleanup pattern
 */
export interface Cleanupable {
  /**
   * Synchronously cleanup and release resources.
   *
   * Called when the resource is no longer needed. Implementations should:
   * - Unsubscribe from events/listeners
   * - Release memory references
   * - Clear timers
   * - Close connections
   *
   * **Responsibilities**:
   * - Must be synchronous (no async operations)
   * - Should be idempotent (safe to call multiple times)
   * - Should not throw errors (log and continue)
   * - Should gracefully handle partial cleanup state
   *
   * @returns void
   *
   * @example
   * ```typescript
   * cleanup(): void {
   *   // Unsubscribe from events
   *   this.eventManager.removeEventListenerManaged(this.listenerId);
   *   // Clear references
   *   this.handlers.clear();
   *   // Mark as cleaned up
   *   this.isCleanedUp = true;
   * }
   * ```
   */
  cleanup(): void;
}
