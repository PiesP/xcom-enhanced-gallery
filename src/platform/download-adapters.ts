// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { getUserscript } from '@shared/external/userscript/adapter';
import { createAdapter } from './adapter-factory';
import { MV3DownloadAdapter } from './mv3-download-adapters';
import type { DownloadAdapter } from './types';

/**
 * Returns the singleton download adapter for the current platform.
 *
 * - MV3 extension: {@link MV3DownloadAdapter}
 * - Userscript: the userscript API directly, which already satisfies the
 *   {@link DownloadAdapter} contract via `download()` and `downloadBlob()`.
 */
export const getDownloadAdapter = createAdapter<DownloadAdapter>(
  () => new MV3DownloadAdapter(),
  () => {
    const api = getUserscript();
    return {
      download: api.download,
      downloadBlob: api.downloadBlob,
      /** Userscript GM_download can download URLs directly — no blob fallback needed */
      needsBlobFallback: () => false,
    };
  }
);
