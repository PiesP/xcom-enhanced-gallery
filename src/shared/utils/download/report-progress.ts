// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { DownloadOptions, DownloadProgress } from '@shared/services/download/types';

export function reportProgress(
  onProgress: DownloadOptions['onProgress'] | undefined,
  payload: Omit<DownloadProgress, 'percentage'> & { percentage?: number }
): void {
  if (!onProgress) return;
  const percentage =
    payload.percentage ??
    (payload.total <= 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((payload.current / payload.total) * 100))));
  onProgress({ ...payload, percentage });
}
