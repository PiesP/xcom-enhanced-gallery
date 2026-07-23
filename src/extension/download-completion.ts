// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import type { ChromeDownloadDelta, ChromeDownloadsModule } from '@platform/chrome.d.ts';

type DownloadCompletionSource = Pick<ChromeDownloadsModule, 'onChanged' | 'search'>;

function readState(value: ChromeDownloadDelta['state'] | string | undefined): string | undefined {
  return typeof value === 'string' ? value : value?.current;
}

function readError(value: ChromeDownloadDelta['error'] | string | undefined): string | undefined {
  return typeof value === 'string' ? value : value?.current;
}

/**
 * Wait for a download to complete, including downloads that finished before
 * the onChanged listener was attached.
 */
export function waitForDownloadComplete(
  downloads: DownloadCompletionSource,
  downloadId: number
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = (): void => {
      downloads.onChanged.removeListener(listener);
      if (timerId !== null) clearTimeout(timerId);
    };

    const complete = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const interrupt = (error?: string): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Download interrupted: ${error ?? 'unknown'}`));
    };

    const inspectState = (state: string | undefined, error?: string): void => {
      if (state === 'complete') {
        complete();
      } else if (state === 'interrupted') {
        interrupt(error);
      }
    };

    const listener = (delta: ChromeDownloadDelta): void => {
      if (delta.id !== downloadId) return;
      inspectState(readState(delta.state), readError(delta.error));
    };

    downloads.onChanged.addListener(listener);

    // The event listener closes the normal race window. The state lookup
    // covers downloads that completed between downloads.download() resolving
    // and the listener registration above.
    void downloads.search({ id: downloadId }).then((items) => {
      const item = items[0];
      if (!item || settled) return;
      inspectState(item.state, item.error);
    });

    timerId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Download timed out after 5 minutes (id: ${downloadId})`));
    }, DOWNLOAD_TIMEOUT_MS);
  });
}
