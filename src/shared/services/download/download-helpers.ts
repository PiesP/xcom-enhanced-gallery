// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Download helper utilities
 */

import type { DownloadOptions, DownloadProgress } from '@shared/services/download/types';
import { computePercentage } from '@shared/utils/math/percentage';

/**
 * Report download progress to the optional callback.
 */
export function reportProgress(
  onProgress: DownloadOptions['onProgress'] | undefined,
  payload: Omit<DownloadProgress, 'percentage'> & { percentage?: number }
): void {
  if (!onProgress) return;
  const percentage = payload.percentage ?? computePercentage(payload.current, payload.total);
  onProgress({ ...payload, percentage });
}
