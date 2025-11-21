/**
 * @fileoverview Lifecycle utility types shared between app/base/core layers.
 */

/**
 * Synchronously cleanupable resource interface.
 */
export interface Cleanupable {
  cleanup(): void;
}
