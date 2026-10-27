// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vite-plus/test';

import {
  assertDownloadIncomplete,
  canRetryMv3PausePreparation,
} from '../../../validation/windows/install-profile.ts';

const bytes = 256 * 1024 * 1024;
const download = {
  url: 'blob:https://x.com/12345678-1234-1234-1234-123456789abc',
  filename: 'xeg-mv3-restart.bin',
  exists: true,
  id: 7,
  paused: true,
  state: 'in_progress',
  bytesReceived: bytes,
  totalBytes: bytes,
};

function missedPause() {
  try {
    assertDownloadIncomplete(download, 'before worker stop');
  } catch (error) {
    return error;
  }
  throw new Error('The original incomplete-download assertion must reject this fixture');
}

function cleanedPreparation(): Parameters<typeof canRetryMv3PausePreparation>[0] {
  return {
    source: {
      bytes,
      mimeType: 'application/octet-stream',
      productionMessageType: 'DOWNLOAD_BLOB_URL_REQUEST',
    },
    failureSnapshot: { download },
    cleanup: {
      errorCount: 0,
      download: { erasedIds: [7], historyRemoved: true, terminalState: 'interrupted' },
      trackingRemoved: true,
      pauseListener: {
        removed: true,
        controlCleared: true,
        requestOutcomeCleared: true,
        state: null,
      },
      blob: { revoked: true, globalCleared: true },
      addedFilesRemoved: true,
    },
  };
}

describe('MV3 Blob pause preparation', () => {
  it('permits another preparation only for the fully cleaned, pre-stop late pause', () => {
    expect(canRetryMv3PausePreparation(cleanedPreparation(), missedPause())).toBe(true);
    expect(() => assertDownloadIncomplete(download, 'before worker stop')).toThrow();
    expect(canRetryMv3PausePreparation(cleanedPreparation(), new Error('worker failed'))).toBe(
      false
    );
    expect(
      canRetryMv3PausePreparation({ ...cleanedPreparation(), beforeStop: {} }, missedPause())
    ).toBe(false);
    expect(
      canRetryMv3PausePreparation(
        {
          ...cleanedPreparation(),
          failureSnapshot: { download: { ...download, bytesReceived: bytes - 1 } },
        },
        missedPause()
      )
    ).toBe(false);
  });

  it('refuses another attempt when any owned resource cleanup is incomplete or failed', () => {
    for (const field of [
      'download',
      'trackingRemoved',
      'pauseListener',
      'blob',
      'addedFilesRemoved',
    ] as const) {
      const evidence = cleanedPreparation();
      delete evidence.cleanup[field];
      expect(canRetryMv3PausePreparation(evidence, missedPause()), field).toBe(false);
    }
    const evidence = cleanedPreparation();
    evidence.cleanup.errorCount = 1;
    expect(canRetryMv3PausePreparation(evidence, missedPause())).toBe(false);
  });
});
