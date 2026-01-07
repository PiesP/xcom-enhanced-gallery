/**
 * @fileoverview Bootstrap Stage Execution Utilities
 *
 * ## Purpose
 * Provides robust infrastructure for executing bootstrap initialization stages with comprehensive
 * timing measurement, error handling, and conditional execution support. Enables sequential stage
 * execution with failure recovery strategies and detailed result reporting.
 *
 * ## Key Responsibilities
 * - **Stage Execution**: Run individual bootstrap stages with error boundaries
 * - **Performance Tracking**: Measure and report execution duration for each stage
 * - **Conditional Execution**: Support predicate-based stage skipping via `shouldRun`
 * - **Error Handling**: Differentiate between optional and critical stage failures
 * - **Sequential Processing**: Execute multiple stages in order with failure propagation control
 *
 * ## Stage Lifecycle
 * Each bootstrap stage follows a consistent execution pattern:
 * 1. **Predicate Check**: Evaluate `shouldRun` if present; skip if returns false
 * 2. **Execution**: Invoke stage's `run()` function within error boundary
 * 3. **Timing**: Track execution duration using `performance.now()`
 * 4. **Result**: Return structured result with success status, duration, and optional error
 * 5. **Logging**: Debug logs for start, completion, skip, and failure (dev builds only)
 *
 * ## Error Handling Strategy
 * - **Optional Stages**: Failures logged as warnings; execution continues
 * - **Critical Stages**: Failures logged as errors; may halt pipeline if `stopOnFailure` enabled
 * - **Error Metadata**: Stage label and duration included in error reports for diagnostics
 * - **Result Propagation**: All results returned regardless of success for audit trail
 *
 * ## Bootstrap Context
 * Used by main bootstrap orchestrator to execute initialization pipeline. Stages typically
 * include service registration, event handler setup, environment verification, and application
 * initialization. The sequential execution model ensures proper dependency ordering.
 *
 * @module bootstrap/utils
 */

import { bootstrapErrorReporter } from '@shared/error/app-error-reporter';
import type { BootstrapStage, BootstrapStageResult } from '@shared/interfaces/handler.interfaces';
import { logger } from '@shared/logging/logger';

/**
 * Execute a single bootstrap stage with timing, error handling, and conditional skipping.
 *
 * Runs an individual bootstrap stage within an error boundary, tracking execution duration
 * and handling failures according to the stage's optional flag. Supports conditional execution
 * via `shouldRun` predicate for environment-specific or state-dependent stages.
 *
 * ## Execution Flow
 * 1. **Predicate Evaluation**: If `stage.shouldRun` exists, evaluate it
 *    - Returns false: Stage skipped, returns success result with 0ms duration
 *    - Returns true or undefined: Proceed to execution
 * 2. **Stage Execution**: Invoke `stage.run()` wrapped in try-catch
 *    - Supports both sync and async run functions via Promise.resolve()
 * 3. **Duration Tracking**: Measure elapsed time from start to completion
 * 4. **Result Construction**: Build structured result object with success status
 *
 * ## Error Handling
 * - **Optional Stage Failure**: Logged as warning, returns failed result but doesn't throw
 * - **Critical Stage Failure**: Logged as error, returns failed result but doesn't throw
 * - **Error Metadata**: Includes stage label and duration for diagnostic context
 * - **Non-throwing**: Function never throws; errors captured in result object
 *
 * ## Development Logging
 * When `__DEV__` is true, emits debug logs for:
 * - Stage start: "➡️ {label}"
 * - Stage completion: "✅ {label} ({duration}ms)"
 * - Stage skipped: "⏭️ {label} (skipped)"
 * - Production builds strip these logs for performance
 *
 * @param stage - Bootstrap stage configuration object
 * @param stage.label - Human-readable stage name for logging and error reporting
 * @param stage.run - Sync or async function to execute
 * @param stage.optional - If true, failure is non-fatal (logs warning instead of error)
 * @param stage.shouldRun - Optional predicate; if returns false, stage is skipped
 * @returns Promise resolving to structured result with success status, duration, and optional error
 *
 * @internal
 * @remarks
 * This function is internal to the module and called by {@link executeStages}. Direct usage
 * outside this module is unnecessary as {@link executeStages} provides the primary API.
 *
 * @example
 * ```typescript
 * // Basic stage execution
 * const result = await executeStage({
 *   label: 'Theme initialization',
 *   run: async () => {
 *     const theme = getThemeService();
 *     await theme.initialize();
 *   }
 * });
 *
 * if (!result.success) {
 *   console.error(`Stage failed: ${result.label}`, result.error);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Optional stage (won't halt pipeline on failure)
 * const result = await executeStage({
 *   label: 'Optional feature init',
 *   optional: true,
 *   run: async () => {
 *     await initializeOptionalFeature();
 *   }
 * });
 * // result.success may be false, but execution continues
 * ```
 *
 * @example
 * ```typescript
 * // Conditional stage execution
 * const result = await executeStage({
 *   label: 'Dev tools init',
 *   shouldRun: () => __DEV__,
 *   run: () => {
 *     initializeDevTools();
 *   }
 * });
 * // Skipped in production, executed in development
 * ```
 */
async function executeStage(stage: BootstrapStage): Promise<BootstrapStageResult> {
  const startTime = performance.now();

  // Check shouldRun predicate
  if (stage.shouldRun && !stage.shouldRun()) {
    if (__DEV__) {
      logger.debug(`[bootstrap] ⏭️ ${stage.label} (skipped)`);
    }

    return {
      label: stage.label,
      success: true,
      skipped: true,
      optional: stage.optional ?? false,
      error: undefined,
      durationMs: 0,
    };
  }

  try {
    if (__DEV__) {
      logger.debug(`[bootstrap] ➡️ ${stage.label}`);
    }

    await Promise.resolve(stage.run());

    const durationMs = performance.now() - startTime;

    if (__DEV__) {
      logger.debug(`[bootstrap] ✅ ${stage.label} (${durationMs.toFixed(1)}ms)`);
    }

    return {
      label: stage.label,
      success: true,
      skipped: false,
      optional: stage.optional ?? false,
      error: undefined,
      durationMs,
    };
  } catch (error) {
    const durationMs = performance.now() - startTime;

    if (stage.optional) {
      bootstrapErrorReporter.warn(error, {
        code: 'STAGE_OPTIONAL_FAILED',
        metadata: { stage: stage.label, durationMs },
      });
    } else {
      bootstrapErrorReporter.error(error, {
        code: 'STAGE_FAILED',
        metadata: { stage: stage.label, durationMs },
      });
    }

    return {
      label: stage.label,
      success: false,
      skipped: false,
      optional: stage.optional ?? false,
      error,
      durationMs,
    };
  }
}

/**
 * Execute multiple bootstrap stages in sequence with failure handling.
 *
 * Primary entry point for bootstrap stage orchestration. Executes an array of stages
 * sequentially, collecting results and optionally halting on critical failures. Provides
 * comprehensive audit trail of all stage executions for debugging and monitoring.
 *
 * ## Execution Model
 * - **Sequential Processing**: Stages executed one at a time in array order
 * - **Synchronous Flow**: Each stage completes before next begins (no parallelization)
 * - **Result Collection**: All stage results accumulated regardless of success/failure
 * - **Failure Handling**: Controlled by `stopOnFailure` option (default: true)
 *
 * ## Failure Propagation
 * When a stage fails:
 * 1. **Optional Stage**: Result recorded, execution continues to next stage
 * 2. **Critical Stage + stopOnFailure=true**: Result recorded, pipeline halted
 * 3. **Critical Stage + stopOnFailure=false**: Result recorded, execution continues
 *
 * ## Result Structure
 * Each result includes:
 * - `label`: Stage identifier from configuration
 * - `success`: Boolean indicating execution outcome
 * - `optional`: Boolean from stage configuration
 * - `durationMs`: Execution time in milliseconds
 * - `error`: Optional error object if stage failed
 *
 * ## Use Cases
 * - **Standard Bootstrap**: Execute all stages with halt-on-failure for critical errors
 * - **Resilient Bootstrap**: Continue through failures for diagnostic mode
 * - **Conditional Pipeline**: Skip stages based on runtime conditions via `shouldRun`
 * - **Performance Profiling**: Analyze stage durations to identify bottlenecks
 *
 * ## Development Mode
 * In `__DEV__` builds, emits detailed debug logs for each stage transition and timing.
 * Critical stage failures trigger error-level log with stage label.
 *
 * @param stages - Readonly array of bootstrap stage configurations to execute
 * @param options - Execution behavior configuration (optional)
 * @param options.stopOnFailure - If true (default), halt pipeline on first critical stage failure
 * @returns Promise resolving to array of stage results (one per stage, in execution order)
 *
 * @example
 * ```typescript
 * // Standard bootstrap with halt-on-failure
 * const stages = [
 *   { label: 'Services', run: () => initializeServices() },
 *   { label: 'Events', run: () => wireEvents() },
 *   { label: 'Gallery', run: () => initializeGallery() },
 * ];
 *
 * const results = await executeStages(stages);
 * const failed = results.filter(r => !r.success);
 *
 * if (failed.length > 0) {
 *   console.error('Bootstrap failed:', failed);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Resilient bootstrap (continues on failure)
 * const results = await executeStages(stages, {
 *   stopOnFailure: false,
 * });
 *
 * // All stages execute regardless of failures
 * const successCount = results.filter(r => r.success).length;
 * console.log(`${successCount}/${results.length} stages succeeded`);
 * ```
 *
 * @example
 * ```typescript
 * // Mixed critical and optional stages
 * const stages = [
 *   { label: 'Core', run: () => initCore() }, // critical
 *   { label: 'Analytics', optional: true, run: () => initAnalytics() }, // optional
 *   { label: 'UI', run: () => initUI() }, // critical
 * ];
 *
 * const results = await executeStages(stages);
 * // Analytics failure won't halt pipeline; Core/UI failures will
 * ```
 *
 * @example
 * ```typescript
 * // Performance profiling
 * const results = await executeStages(stages);
 * const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);
 * const slowest = results.sort((a, b) => b.durationMs - a.durationMs)[0];
 *
 * console.log(`Total bootstrap time: ${totalMs.toFixed(1)}ms`);
 * console.log(`Slowest stage: ${slowest?.label} (${slowest?.durationMs.toFixed(1)}ms)`);
 * ```
 *
 * @remarks
 * This function never throws; all stage errors are captured in result objects. The returned
 * array always contains results for all executed stages (may be incomplete if halted early).
 *
 * @see {@link BootstrapStage} for stage configuration interface
 * @see {@link BootstrapStageResult} for result object structure
 */
export async function executeStages(
  stages: readonly BootstrapStage[],
  options?: {
    /** Stop on first non-optional failure */
    stopOnFailure?: boolean;
  }
): Promise<BootstrapStageResult[]> {
  const results: BootstrapStageResult[] = [];
  const stopOnFailure = options?.stopOnFailure ?? true;

  for (const stage of stages) {
    const result = await executeStage(stage);
    results.push(result);

    if (!result.success && !result.optional && stopOnFailure) {
      logger.error(`[bootstrap] ❌ Critical stage failed: ${stage.label}`);
      break;
    }
  }

  return results;
}
