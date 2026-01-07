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
 * Bootstrap stage execution function signature.
 */
export type BootstrapStageRunner = () => Promise<void> | void;

/**
 * Optional predicate determining whether a stage should run.
 */
export type BootstrapStagePredicate = () => boolean;

/**
 * Bootstrap stage definition
 */
export interface BootstrapStage {
  /** Human-readable stage label */
  readonly label: string;
  /** Stage execution function */
  readonly run: BootstrapStageRunner;
  /** Conditional execution predicate (default: true) */
  readonly shouldRun?: BootstrapStagePredicate;
  /** Whether this stage is optional (can fail without blocking) */
  readonly optional?: boolean;
}

interface BootstrapStageResultBase {
  /** Stage label */
  readonly label: string;
  /** Whether stage is optional (failure does not block bootstrap) */
  readonly optional: boolean;
  /** Duration in milliseconds */
  readonly durationMs: number;
}

/**
 * Stage result when a stage is skipped before execution.
 */
export interface SkippedBootstrapStageResult extends BootstrapStageResultBase {
  /** Stage completed successfully */
  readonly success: true;
  /** Stage was skipped (predicate returned false) */
  readonly skipped: true;
  /** Error is not present for skipped stages */
  readonly error?: undefined;
}

/**
 * Stage result when execution succeeds.
 */
export interface SuccessfulBootstrapStageResult extends BootstrapStageResultBase {
  /** Stage completed successfully */
  readonly success: true;
  /** Stage executed (not skipped) */
  readonly skipped: false;
  /** Error is not present for successful stages */
  readonly error?: undefined;
}

/**
 * Stage result when execution fails.
 */
export interface FailedBootstrapStageResult extends BootstrapStageResultBase {
  /** Stage failed */
  readonly success: false;
  /** Stage executed (not skipped) */
  readonly skipped: false;
  /** Error encountered during execution */
  readonly error: unknown;
}

/**
 * Discriminated union for bootstrap stage outcomes.
 */
export type BootstrapStageResult =
  | SkippedBootstrapStageResult
  | SuccessfulBootstrapStageResult
  | FailedBootstrapStageResult;
