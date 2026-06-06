// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { SingleDownloadResult } from '@shared/services/download/types';

/**
 * Abstraction for download backends. Implementations: GM_download (userscript),
 * chrome.downloads (MV3), fetch+blob (fallback), etc.
 */
export interface DownloadProvider {
  /** Human-readable identifier for logging/debugging */
  readonly name: string;

  /** Detect whether this provider is available in the current runtime */
  detect(): boolean;

  /**
   * Download a single file by URL.
   * @param url - Media URL to download
   * @param filename - Suggested filename including extension
   * @returns Result indicating success or failure
   */
  download(url: string, filename: string): Promise<SingleDownloadResult>;
}
