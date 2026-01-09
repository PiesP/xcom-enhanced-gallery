/**
 * @fileoverview Lifecycle Utility Types
 *
 * Type definitions for resource cleanup and lifecycle management.
 */

/**
 * Synchronously cleanupable resource interface
 */
export interface Cleanupable {
  /**
   * Synchronously cleanup and release resources.
   *
   * Must be synchronous, idempotent, and not throw errors.
   */
  cleanup(): void;
}
