/**
 * @fileoverview Bootstrap stage execution utilities with timing and error handling.
 *
 * Provides infrastructure for sequential stage execution with performance tracking,
 * error boundaries, and conditional execution support. Handles optional vs critical
 * stage failures appropriately.
 *
 * @module bootstrap/utils
 */

import { bootstrapErrorReporter } from '@shared/error/app-error-reporter';
import type { BootstrapStage, BootstrapStageResult } from '@shared/interfaces/handler.interfaces';
import { logger } from '@shared/logging/logger';

/**
 * @internal Execute a single bootstrap stage with timing and error handling.
 *
 * Evaluates `shouldRun` if present; if false, stage is skipped.
 * Captures errors in result object; never throws.
 * Optional stages log failures as warnings; critical stages log as errors.
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
 * Stages execute sequentially in array order. Optional stage failures are logged as warnings
 * and don't halt execution. Critical failures halt pipeline if `stopOnFailure: true` (default).
 *
 * @param stages - Bootstrap stage configurations
 * @param options - Execution options
 * Options: stopOnFailure - Halt on critical failure (default: true)
 * @returns Array of stage results in execution order; never throws
 *
 * @example
 * ```ts
 * const stages = [
 *   { label: 'Services', run: () => initializeServices() },
 *   { label: 'Gallery', run: () => initializeGallery() },
 * ];
 * const results = await executeStages(stages);
 * ```
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
