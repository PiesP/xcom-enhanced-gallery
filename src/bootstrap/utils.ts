/**
 * @fileoverview Bootstrap utilities for stage execution
 * @description Provides utilities for bootstrap stage execution with timing and error handling.
 */

import { bootstrapErrorReporter } from '@shared/error';
import type { BootstrapStage, BootstrapStageResult } from '@shared/interfaces';
import { logger } from '@shared/logging';

/**
 * Execute a single bootstrap stage with timing and error handling
 *
 * @param stage - The bootstrap stage to execute
 * @returns Stage execution result
 *
 * @example
 * ```typescript
 * const result = await executeStage({
 *   label: 'Theme initialization',
 *   run: async () => {
 *     const theme = getThemeService();
 *     await theme.initialize();
 *   }
 * });
 *
 * if (!result.success) {
 *   console.error(`Stage failed: ${result.label}`);
 * }
 * ```
 */
export async function executeStage(stage: BootstrapStage): Promise<BootstrapStageResult> {
  const startTime = performance.now();

  // Check shouldRun predicate
    if (__DEV__) {
      logger.debug(`[bootstrap] ⏭️ ${stage.label} (skipped)`);
    }

    return {
      label: stage.label,
      success: true,
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
      error,
      durationMs,
    };
  }
}

/**
 * Execute multiple bootstrap stages in sequence
 *
 * @param stages - Array of bootstrap stages
 * @param options - Execution options
 * @returns Array of stage results
 */
export async function executeStages(
  stages: readonly BootstrapStage[],
  options?: {
    /** Stop on first non-optional failure */
    stopOnFailure?: boolean;
  },
): Promise<BootstrapStageResult[]> {
  const results: BootstrapStageResult[] = [];
  const stopOnFailure = options?.stopOnFailure ?? true;

  for (const stage of stages) {
    const result = await executeStage(stage);
    results.push(result);

    if (!result.success && !stage.optional && stopOnFailure) {
      logger.error(`[bootstrap] ❌ Critical stage failed: ${stage.label}`);
      break;
    }
  }

  return results;
}
