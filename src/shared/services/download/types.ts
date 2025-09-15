/**
 * Download progress type (single source)
 *
 * Consumers should import this type from '@shared/services/download/types'.
 */
export interface DownloadProgress {
  phase: 'preparing' | 'downloading' | 'complete';
  current: number;
  total: number;
  percentage: number;
  filename?: string;
}
