// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, expect, it } from 'vitest';
import { DownloadTrackingStore } from '@extension/download-tracking';
import type { StorageAdapter } from '@platform/types';

function createStorage(): {
  storage: StorageAdapter;
  values: Record<string, unknown>;
} {
  const values: Record<string, unknown> = {};
  return {
    values,
    storage: {
      get: async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
        return key in values ? (values[key] as T) : defaultValue;
      },
      set: async <T>(key: string, value: T): Promise<void> => {
        values[key] = value;
      },
      remove: async (key: string): Promise<void> => {
        delete values[key];
      },
      listKeys: async (): Promise<string[]> => Object.keys(values),
    },
  };
}

describe('DownloadTrackingStore', () => {
  it('restores the request-to-download relationship in a new worker instance', async () => {
    const firstWorker = createStorage();
    const firstStore = new DownloadTrackingStore(firstWorker.storage);
    await firstStore.registerRequest('request-1');
    await firstStore.bindDownload('request-1', 42);

    const secondStore = new DownloadTrackingStore(firstWorker.storage);
    await secondStore.ready();

    expect(secondStore.get('request-1')).toEqual({
      downloadId: 42,
      cancellationRequested: false,
    });
  });

  it('persists cancellation intent before a download ID is available', async () => {
    const worker = createStorage();
    const store = new DownloadTrackingStore(worker.storage);

    await store.requestCancellation('request-2');

    const restored = new DownloadTrackingStore(worker.storage);
    await restored.ready();
    expect(restored.get('request-2')).toEqual({ cancellationRequested: true });
  });
});
