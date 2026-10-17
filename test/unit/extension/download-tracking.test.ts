// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DOWNLOAD_PRE_ID_CANCELLATION_TTL_MS } from '@constants/performance';
import { DownloadTrackingStore } from '@extension/download-tracking';
import type { StorageAdapter } from '@platform/types';
import { describe, expect, it } from 'vite-plus/test';

function createStorage(): {
  storage: StorageAdapter;
  values: Record<string, unknown>;
  failNextRead: (error: unknown) => void;
  failNextWrite: (error: unknown) => void;
  deferNextRead: () => Promise<unknown>;
  resolveDeferredRead: (value: unknown) => void;
} {
  const values: Record<string, unknown> = {};
  let readError: unknown;
  let writeError: unknown;
  let deferredRead:
    | {
        resolveStarted: () => void;
        resolveValue?: (value: unknown) => void;
      }
    | undefined;
  const failNextRead = (error: unknown): void => {
    readError = error;
  };
  const failNextWrite = (error: unknown): void => {
    writeError = error;
  };
  const deferNextRead = (): Promise<unknown> =>
    new Promise((resolve) => {
      deferredRead = { resolveStarted: () => resolve(undefined) };
    });
  const resolveDeferredRead = (value: unknown): void => {
    const pendingRead = deferredRead;
    deferredRead = undefined;
    pendingRead?.resolveValue?.(value);
  };

  return {
    values,
    failNextRead,
    failNextWrite,
    deferNextRead,
    resolveDeferredRead,
    storage: {
      get: async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
        if (readError !== undefined) {
          const error = readError;
          readError = undefined;
          throw error;
        }
        if (deferredRead !== undefined) {
          const pendingRead = deferredRead;
          pendingRead.resolveStarted();
          return (await new Promise<unknown>((resolve) => {
            pendingRead.resolveValue = resolve;
          })) as T | undefined;
        }
        return key in values ? (values[key] as T) : defaultValue;
      },
      set: async <T>(key: string, value: T): Promise<void> => {
        if (writeError !== undefined) {
          const error = writeError;
          writeError = undefined;
          throw error;
        }
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
  const urlHash = 'a'.repeat(64);

  it('keeps a direct owner and terminal result across worker restart without storing a media URL', async () => {
    const worker = createStorage();
    const first = new DownloadTrackingStore(worker.storage);
    expect(await first.registerDirectRequest('direct-1', 7, urlHash)).toBe('new');
    expect(await first.bindDirectDownload('direct-1', 42, 7, urlHash)).toBe(false);
    first.finishDirectAllocation('direct-1');
    await first.markDirectTerminal('direct-1', 'complete');

    const restarted = new DownloadTrackingStore(worker.storage);
    await restarted.ready();
    expect(restarted.get('direct-1')).toMatchObject({
      route: 'direct',
      ownerTabId: 7,
      urlHash,
      downloadId: 42,
      terminalState: 'complete',
      cancellationRequested: false,
    });
    expect(JSON.stringify(worker.values)).not.toContain('pbs.twimg.com');
    expect(await restarted.registerDirectRequest('direct-1', 7, urlHash)).toBe('existing');
    expect(await restarted.registerDirectRequest('direct-1', 8, urlHash)).toBe('wrong-owner');
    expect(await restarted.registerDirectRequest('direct-1', 7, 'b'.repeat(64))).toBe(
      'wrong-owner'
    );
  });

  it('honors same-owner cancellation before an ID without allowing a second dispatch', async () => {
    const worker = createStorage();
    const store = new DownloadTrackingStore(worker.storage);
    expect(await store.requestDirectCancellation('direct-2', 3, urlHash)).toBe(true);
    expect(await store.registerDirectRequest('direct-2', 3, urlHash)).toBe('cancelled');
    expect(await store.requestDirectCancellation('direct-2', 4, urlHash)).toBe(false);
    expect(await store.bindDirectDownload('direct-2', 55, 3, urlHash)).toBe(true);
    expect(store.get('direct-2')?.ownerTabId).toBe(3);
  });

  it('expires direct terminal tombstones but keeps an active assigned download', async () => {
    const worker = createStorage();
    let now = 1_000;
    const store = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await store.registerDirectRequest('direct-terminal', 1, urlHash);
    await store.markDirectTerminal('direct-terminal', 'never-started');
    await store.registerDirectRequest('direct-active', 1, 'b'.repeat(64));
    await store.bindDirectDownload('direct-active', 72, 1, 'b'.repeat(64));

    now += 10 * 60_000;

    const restarted = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await restarted.ready();
    expect(restarted.get('direct-terminal')).toBeUndefined();
    expect(restarted.get('direct-active')?.downloadId).toBe(72);
  });

  it('preserves a live delayed direct allocation and its cancellation past the pre-ID TTL', async () => {
    const worker = createStorage();
    let now = 5_000;
    const store = new DownloadTrackingStore(worker.storage, undefined, () => now);
    expect(await store.registerDirectRequest('slow', 9, urlHash)).toBe('new');
    now += 10 * 60_000 + 1;
    // A separate operation must not prune the live native allocation.
    expect(await store.registerDirectRequest('other', 9, 'b'.repeat(64))).toBe('new');
    expect(await store.requestDirectCancellation('slow', 9, urlHash)).toBe(true);
    expect(await store.bindDirectDownload('slow', 77, 9, urlHash)).toBe(true);
    store.finishDirectAllocation('slow');
    expect(store.get('slow')).toMatchObject({
      route: 'direct',
      ownerTabId: 9,
      urlHash,
      downloadId: 77,
      cancellationRequested: true,
    });
    expect(await store.bindDirectDownload('missing', 78, 9, urlHash)).toBeUndefined();
    expect(store.get('missing')).toBeUndefined();
  });

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
    const now = 1_000;
    const store = new DownloadTrackingStore(worker.storage, undefined, () => now);

    await store.requestCancellation('request-2');

    const restored = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await restored.ready();
    expect(restored.get('request-2')).toEqual({
      cancellationRequested: true,
      cancellationRequestedAt: now,
    });
  });

  it('serializes a reload before a concurrent mutation', async () => {
    const worker = createStorage();
    const store = new DownloadTrackingStore(worker.storage);
    await store.registerRequest('request-existing');

    const pendingRead = worker.deferNextRead();
    const reload = store.reload();
    await pendingRead;

    const register = store.registerRequest('request-new');
    worker.resolveDeferredRead({
      'request-existing': { cancellationRequested: false },
    });

    await Promise.all([reload, register]);
    expect(store.get('request-new')).toEqual({ cancellationRequested: false });
  });

  it('rejects storage write failures without reporting a successful transition', async () => {
    const worker = createStorage();
    const store = new DownloadTrackingStore(worker.storage);
    worker.failNextWrite(new Error('quota exceeded'));

    await expect(store.requestCancellation('request-write-failure')).rejects.toThrow(
      'Download tracking storage write failed: quota exceeded'
    );
    expect(store.get('request-write-failure')).toEqual(
      expect.objectContaining({ cancellationRequested: true })
    );

    await store.requestCancellation('request-write-failure');
    const restored = new DownloadTrackingStore(worker.storage);
    await restored.ready();
    expect(restored.get('request-write-failure')).toEqual(
      expect.objectContaining({ cancellationRequested: true })
    );
  });

  it('preserves storage contents across a read failure and retries later', async () => {
    const worker = createStorage();
    worker.values['xeg.download-tracking.v1'] = {
      'request-read-failure': { downloadId: 41, cancellationRequested: false },
    };
    worker.failNextRead(new Error('storage unavailable'));
    const store = new DownloadTrackingStore(worker.storage);

    await expect(store.ready()).rejects.toThrow(
      'Download tracking storage read failed: storage unavailable'
    );
    expect(worker.values['xeg.download-tracking.v1']).toEqual({
      'request-read-failure': { downloadId: 41, cancellationRequested: false },
    });

    await store.reload();
    expect(store.get('request-read-failure')).toEqual({
      downloadId: 41,
      cancellationRequested: false,
    });
  });

  it('does not replace an unpersisted snapshot with an older reload', async () => {
    const worker = createStorage();
    const store = new DownloadTrackingStore(worker.storage);
    worker.failNextWrite(new Error('temporary write failure'));

    await expect(store.registerRequest('request-dirty')).rejects.toThrow('temporary write failure');
    await store.reload();

    expect(store.get('request-dirty')).toEqual({ cancellationRequested: false });
  });

  it('expires and removes a pre-ID cancellation marker after its bounded lifetime', async () => {
    const worker = createStorage();
    let now = 1_000;
    const store = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await store.requestCancellation('request-expired');

    now += DOWNLOAD_PRE_ID_CANCELLATION_TTL_MS;
    const restored = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await restored.ready();

    expect(restored.get('request-expired')).toBeUndefined();
    expect(worker.values['xeg.download-tracking.v1']).toEqual({});
  });

  it('does not apply an expired pre-ID cancellation to a late download ID', async () => {
    const worker = createStorage();
    let now = 2_000;
    const store = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await store.requestCancellation('request-late-id');

    now += DOWNLOAD_PRE_ID_CANCELLATION_TTL_MS;
    await expect(store.bindDownload('request-late-id', 77)).resolves.toBe(false);
    expect(store.get('request-late-id')).toEqual({
      downloadId: 77,
      cancellationRequested: false,
    });
  });

  it('keeps an active download relationship beyond the pre-ID TTL', async () => {
    const worker = createStorage();
    let now = 3_000;
    const store = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await store.registerRequest('request-active');
    await store.bindDownload('request-active', 88);
    await store.requestCancellation('request-active');

    now += DOWNLOAD_PRE_ID_CANCELLATION_TTL_MS * 2;
    const restored = new DownloadTrackingStore(worker.storage, undefined, () => now);
    await restored.ready();

    expect(restored.get('request-active')).toEqual({
      downloadId: 88,
      cancellationRequested: true,
      cancellationRequestedAt: 3_000,
    });
  });

  it('normalizes legacy pre-ID markers with a bounded grace timestamp', async () => {
    const worker = createStorage();
    worker.values['xeg.download-tracking.v1'] = {
      'request-legacy': { cancellationRequested: true },
    };
    const now = 4_000;
    const store = new DownloadTrackingStore(worker.storage, undefined, () => now);

    await store.ready();

    expect(store.get('request-legacy')).toEqual({
      cancellationRequested: true,
      cancellationRequestedAt: now,
    });
    expect(worker.values['xeg.download-tracking.v1']).toEqual({
      'request-legacy': { cancellationRequested: true, cancellationRequestedAt: now },
    });
  });
});
