/**
 * DownloadService (Consolidated)
 *
 * **Role**: Media download management (Single/Bulk/ZIP)
 * **Note**: This file now re-exports DownloadOrchestrator as DownloadService
 * to maintain backward compatibility while consolidating logic.
 */

import { DownloadOrchestrator } from "./download/download-orchestrator";

export { DownloadOrchestrator as DownloadService };
export const downloadService = DownloadOrchestrator.getInstance();
export type {
  DownloadOptions,
  SingleDownloadResult,
  BulkDownloadResult,
} from "./download/download-orchestrator";
