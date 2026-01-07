/**
 * @fileoverview Single download command program
 * @description Pure command generation for the single-download flow.
 *
 * Design:
 * - This module is IO-free by design.
 * - It produces a small command list that an effectful interpreter can execute.
 */

import { planSingleDownload, type SingleDownloadPlan } from '@shared/core/download/download-plan';

/**
 * Command union type for single download operations
 * @typedef SingleDownloadCommand
 * @description Represents possible commands for executing a single download
 */
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

/**
 * Input parameters for single download command generation
 * @interface SingleDownloadCommandInput
 */
interface SingleDownloadCommandInput {
  /** Download method to use ('gm_download' or 'none') */
  readonly method: 'gm_download' | 'none';
  /** URL of the media to download */
  readonly mediaUrl: string;
  /** Target filename for the downloaded file */
  readonly filename: string;
  /** Whether a blob has been prefetched for this download */
  readonly hasProvidedBlob: boolean;
  /** Download timeout in milliseconds (default: 30000) */
  readonly timeoutMs?: number;
}

/**
 * Convert a download plan into an actionable command
 *
 * @param plan - Download plan from planning stage
 * @param timeoutMs - Download timeout in milliseconds
 * @returns Action command (DOWNLOAD_WITH_GM_DOWNLOAD or FAIL)
 *
 * @remarks
 * - Maps successful plans to DOWNLOAD_WITH_GM_DOWNLOAD commands
 * - Maps failed plans to FAIL commands with error details
 *
 * @internal
 */
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
 * Create the command list for a single download
 *
 * @param input - Download configuration input
 * @returns Array of commands to execute for the download
 *
 * @remarks
 * - Generates a planning phase and an action command
 * - Progress reporting is conditionally included based on command type
 * - Fetch/blob helpers already report progress, so duplicates are avoided
 * - Default timeout is 30 seconds (30_000 ms)
 *
 * @example
 * ```typescript
 * const commands = createSingleDownloadCommands({
 *   method: 'gm_download',
 *   mediaUrl: 'https://example.com/image.jpg',
 *   filename: 'photo.jpg',
 *   hasProvidedBlob: false,
 *   timeoutMs: 60000,
 * });
 * // Returns: [{ type: 'REPORT_PROGRESS', ... }, { type: 'DOWNLOAD_WITH_GM_DOWNLOAD', ... }]
 * ```
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
