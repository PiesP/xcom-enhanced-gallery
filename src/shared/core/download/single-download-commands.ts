/**
 * @fileoverview Single download command program
 * @description Pure command generation for the single-download flow.
 *
 * Design:
 * - This module is IO-free by design.
 * - It produces a small command list that an effectful interpreter can execute.
 */

import { planSingleDownload, type SingleDownloadPlan } from '@shared/core/download/download-plan';

export type SingleDownloadCommand =
  | {
      readonly type: 'REPORT_PROGRESS';
      readonly phase: 'preparing' | 'downloading' | 'complete';
      readonly percentage: number;
      readonly filename: string;
    }
  | {
      readonly type: 'DOWNLOAD_WITH_GM_DOWNLOAD';
      readonly url: string;
      readonly filename: string;
      readonly timeoutMs: number;
      readonly useBlobUrl: boolean;
    }
  | {
      readonly type: 'FAIL';
      readonly filename: string;
      readonly error: string;
    };

interface SingleDownloadCommandInput {
  readonly method: 'gm_download' | 'none';
  readonly mediaUrl: string;
  readonly filename: string;
  readonly hasProvidedBlob: boolean;
  readonly timeoutMs?: number;
}

function toActionCommand(
  plan: SingleDownloadPlan,
  timeoutMs: number
): Exclude<SingleDownloadCommand, { type: 'REPORT_PROGRESS' }> {
  if (plan.strategy === 'gm_download') {
    return {
      type: 'DOWNLOAD_WITH_GM_DOWNLOAD',
      url: plan.url,
      filename: plan.filename,
      timeoutMs,
      useBlobUrl: plan.useBlobUrl,
    };
  }

  return { type: 'FAIL', filename: plan.filename, error: plan.error };
}

/**
 * Create the command list for a single download.
 */
export function createSingleDownloadCommands(
  input: SingleDownloadCommandInput
): readonly SingleDownloadCommand[] {
  const timeoutMs = input.timeoutMs ?? 30_000;

  const plan = planSingleDownload({
    method: input.method,
    mediaUrl: input.mediaUrl,
    filename: input.filename,
    hasProvidedBlob: input.hasProvidedBlob,
  });

  const action = toActionCommand(plan, timeoutMs);

  // Avoid duplicate progress events: fetch/blob helpers already report.
  const shouldReportPreparing =
    action.type === 'DOWNLOAD_WITH_GM_DOWNLOAD' || action.type === 'FAIL';

  return shouldReportPreparing
    ? [
        {
          type: 'REPORT_PROGRESS',
          phase: 'preparing',
          percentage: 0,
          filename: input.filename,
        },
        action,
      ]
    : [action];
}
