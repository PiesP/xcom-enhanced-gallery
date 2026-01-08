/**
 * @fileoverview Unified handler lifecycle interfaces
 * @description Standardized interfaces for service and feature handler initialization
 */

/**
 * Bootstrap stage execution function signature
 */
export type BootstrapStageRunner = () => Promise<void> | void;

/**
 * Optional predicate determining whether a stage should run
 */
export type BootstrapStagePredicate = () => boolean;

/**
 * Bootstrap stage definition
 */
export interface BootstrapStage {
  readonly label: string;
  readonly run: BootstrapStageRunner;
  readonly shouldRun?: BootstrapStagePredicate;
  readonly optional?: boolean;
}

interface BootstrapStageResultBase {
  readonly label: string;
  readonly optional: boolean;
  readonly durationMs: number;
}

/**
 * Stage result when skipped before execution (predicate returned false)
 */
export interface SkippedBootstrapStageResult extends BootstrapStageResultBase {
  readonly success: true;
  readonly skipped: true;
  readonly error?: undefined;
}

/**
 * Stage result when execution succeeds
 */
export interface SuccessfulBootstrapStageResult extends BootstrapStageResultBase {
  readonly success: true;
  readonly skipped: false;
  readonly error?: undefined;
}

/**
 * Stage result when execution fails
 */
export interface FailedBootstrapStageResult extends BootstrapStageResultBase {
  readonly success: false;
  readonly skipped: false;
  readonly error: unknown;
}

/**
 * Discriminated union for bootstrap stage outcomes
 */
export type BootstrapStageResult =
  | SkippedBootstrapStageResult
  | SuccessfulBootstrapStageResult
  | FailedBootstrapStageResult;
