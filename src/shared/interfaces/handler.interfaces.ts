/**
 * @fileoverview Unified handler lifecycle interfaces
 * @description Standardized interfaces for service and feature handler initialization.
 *
 * Phase: Refactoring - Handler interface unification
 *
 * This module provides:
 * - Consistent lifecycle contract for all handlers
 * - Standard initialization result types
 * - Service registration patterns
 */

// ============================================================================
// Bootstrap Stage Interface
// ============================================================================

/**
 * Bootstrap stage definition
 */
export interface BootstrapStage {
  /** Human-readable stage label */
  readonly label: string;
  /** Stage execution function */
  readonly run: () => Promise<void> | void;
  /** Conditional execution predicate (default: true) */
  readonly shouldRun?: () => boolean;
  /** Whether this stage is optional (can fail without blocking) */
  readonly optional?: boolean;
}

/**
 * Bootstrap stage result
 */
export interface BootstrapStageResult {
  /** Stage label */
  readonly label: string;
  /** Whether stage completed successfully */
  readonly success: boolean;
  /** Whether stage is optional (failure does not block bootstrap) */
  readonly optional: boolean;
  /** Error if stage failed */
  readonly error?: unknown;
  /** Duration in milliseconds */
  readonly durationMs: number;
}
