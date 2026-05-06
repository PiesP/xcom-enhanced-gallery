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

/**
 * Bootstrap stage definition for sequential initialization pipeline.
 *
 * Each stage has a label, run function, optional shouldRun predicate,
 * and an optional flag indicating whether failure is non-critical.
 */
export interface BootstrapStage {
  readonly label: string;
  readonly run: () => Promise<void> | void;
  readonly shouldRun?: () => boolean;
  readonly optional?: boolean;
}

/**
 * Result of executing a single bootstrap stage.
 *
 * Captures success/failure status, execution timing, and error details.
 */
export interface BootstrapStageResult {
  readonly label: string;
  readonly success: boolean;
  readonly skipped: boolean;
  readonly optional: boolean;
  readonly error: unknown;
  readonly durationMs: number;
}
