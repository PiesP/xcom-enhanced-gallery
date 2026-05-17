/**
 * @fileoverview Bootstrap stage execution utilities
 */

import { bootstrapErrorReporter } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import type { BootstrapStage, BootstrapStageResult } from '@shared/types/lifecycle.types';

async function executeStage(stage: BootstrapStage): Promise<BootstrapStageResult> {
  const startTime = performance.now();

  if (stage.shouldRun && !stage.shouldRun()) {
    __DEV__ && logger.debug(`[bootstrap] ${stage.label} (skipped)`);
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
    await Promise.resolve(stage.run());
    const durationMs = performance.now() - startTime;
    __DEV__ && logger.debug(`[bootstrap] ${stage.label} (${durationMs.toFixed(1)}ms)`);
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

export async function executeStages(
  stages: readonly BootstrapStage[],
  options?: { stopOnFailure?: boolean }
): Promise<BootstrapStageResult[]> {
  const results: BootstrapStageResult[] = [];
  const stopOnFailure = options?.stopOnFailure ?? true;

  for (const stage of stages) {
    const result = await executeStage(stage);
    results.push(result);

    if (!result.success && !result.optional && stopOnFailure) {
      logger.error(`[bootstrap] Critical stage failed: ${stage.label}`);
      break;
    }
  }

  return results;
}
