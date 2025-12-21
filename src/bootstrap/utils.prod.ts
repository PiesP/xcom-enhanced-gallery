import { bootstrapErrorReporter } from '@shared/error/app-error-reporter';
import type { BootstrapStage, BootstrapStageResult } from '@shared/interfaces';

export async function executeStage(stage: BootstrapStage): Promise<BootstrapStageResult> {
  if (stage.shouldRun && !stage.shouldRun()) {
    return {
      label: stage.label,
      success: true,
      optional: Boolean(stage.optional),
      durationMs: 0,
    };
  }

  try {
    await Promise.resolve(stage.run());
    return {
      label: stage.label,
      success: true,
      optional: Boolean(stage.optional),
      durationMs: 0,
    };
  } catch (error) {
    if (stage.optional) {
      bootstrapErrorReporter.warn(error, {
        code: 'STAGE_OPTIONAL_FAILED',
        metadata: { stage: stage.label },
      });
    } else {
      bootstrapErrorReporter.error(error, {
        code: 'STAGE_FAILED',
        metadata: { stage: stage.label },
      });
    }

    return {
      label: stage.label,
      success: false,
      optional: Boolean(stage.optional),
      error,
      durationMs: 0,
    };
  }
}

export async function executeStages(
  stages: readonly BootstrapStage[],
  options?: {
    stopOnFailure?: boolean;
  }
): Promise<BootstrapStageResult[]> {
  const results: BootstrapStageResult[] = [];
  const stopOnFailure = options?.stopOnFailure ?? true;

  for (const stage of stages) {
    const result = await executeStage(stage);
    results.push(result);

    if (!result.success && !result.optional && stopOnFailure) {
      break;
    }
  }

  return results;
}
