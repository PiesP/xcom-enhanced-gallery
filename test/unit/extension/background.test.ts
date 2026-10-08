import { beforeEach, describe, expect, it, vi } from 'vitest';

type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void
) => boolean | undefined;

type StartupListener = () => void | Promise<void>;

type DownloadChangedListener = (delta: {
  id: number;
  state?: string | { current: string };
}) => void;

const state = vi.hoisted(() => ({
  cancelDownload: vi.fn(),
  listener: null as MessageListener | null,
  createNotification: vi.fn(),
  download: vi.fn(),
  searchDownload: vi.fn(),
  waitForDownloadComplete: vi.fn(),
  downloadChangedListener: null as DownloadChangedListener | null,
  startupListener: null as StartupListener | null,
  storageValues: {} as Record<string, unknown>,
  storageSetError: null as unknown,
  storageSetFailuresRemaining: 1,
}));

vi.mock('@platform/chrome-runtime', () => ({
  browserApi: {
    runtime: {
      id: 'extension-id',
      onMessage: {
        addListener: vi.fn((listener: MessageListener) => {
          state.listener = listener;
        }),
        removeListener: vi.fn(),
      },
      onInstalled: { addListener: vi.fn(), removeListener: vi.fn() },
      onStartup: {
        addListener: vi.fn((listener: StartupListener) => {
          state.startupListener = listener;
        }),
        removeListener: vi.fn(),
      },
      onSuspend: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    storage: {
      local: {
        get: vi.fn(async (keys: string | string[] | null) => {
          if (keys === null) return { ...state.storageValues };
          const requested = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(
            requested
              .filter((key) => Object.hasOwn(state.storageValues, key))
              .map((key) => [key, state.storageValues[key]])
          );
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          if (state.storageSetError !== null) {
            const error = state.storageSetError;
            state.storageSetFailuresRemaining -= 1;
            if (state.storageSetFailuresRemaining <= 0) state.storageSetError = null;
            throw error;
          }
          Object.assign(state.storageValues, items);
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) delete state.storageValues[key];
        }),
        getKeys: vi.fn(async () => Object.keys(state.storageValues)),
      },
    },
    downloads: {
      download: state.download,
      cancel: state.cancelDownload,
      search: state.searchDownload,
      onChanged: {
        addListener: vi.fn((listener: DownloadChangedListener) => {
          state.downloadChangedListener = listener;
        }),
        removeListener: vi.fn(),
      },
    },
    notifications: { create: state.createNotification },
  },
}));

vi.mock('@extension/download-completion', () => ({
  waitForDownloadComplete: state.waitForDownloadComplete,
}));

import '@extension/background';

function sendMessage(message: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const keepChannelOpen = state.listener?.(message, { id: 'extension-id' }, resolve);
    if (keepChannelOpen !== true) reject(new Error('Message channel was not kept open'));
  });
}

function deferred<T>(): {
  promise: Promise<T>;
  reject: (reason: unknown) => void;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

beforeEach(() => {
  state.cancelDownload.mockReset().mockResolvedValue(undefined);
  state.createNotification.mockReset();
  state.download.mockReset();
  state.searchDownload.mockReset().mockResolvedValue([{ id: 101, state: 'interrupted' }]);
  state.waitForDownloadComplete.mockReset().mockResolvedValue(undefined);
  state.storageSetError = null;
  state.storageSetFailuresRemaining = 1;
});

describe.each([
  { label: 'a missing extension id', sender: {} },
  { label: 'a different extension id', sender: { id: 'attacker-extension' } },
])('background sender authorization with $label', ({ sender }) => {
  it.each([
    {
      label: 'URL download',
      message: {
        type: 'DOWNLOAD_REQUEST',
        payload: { url: 'https://pbs.twimg.com/media/test.jpg', filename: 'test.jpg' },
      },
    },
    {
      label: 'Blob download',
      message: {
        type: 'DOWNLOAD_BLOB_URL_REQUEST',
        payload: { objectUrl: 'blob:https://x.com/test-resource', filename: 'test.jpg' },
      },
    },
    {
      label: 'download cancellation',
      message: { type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId: 'request-1' } },
    },
    {
      label: 'Blob status',
      message: {
        type: 'DOWNLOAD_BLOB_STATUS_REQUEST',
        payload: { requestId: 'request-1', objectUrl: 'blob:https://x.com/resource' },
      },
    },
    {
      label: 'notification',
      message: {
        type: 'SHOW_NOTIFICATION',
        payload: { id: 'notice-1', title: 'Title', message: 'Message' },
      },
    },
  ])('rejects $label before invoking privileged APIs', ({ message }) => {
    const sendResponse = vi.fn();

    const keepChannelOpen = state.listener?.(message, sender, sendResponse);

    expect(keepChannelOpen).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Unauthorized sender' });
    expect(state.download).not.toHaveBeenCalled();
    expect(state.cancelDownload).not.toHaveBeenCalled();
    expect(state.createNotification).not.toHaveBeenCalled();
    expect(state.waitForDownloadComplete).not.toHaveBeenCalled();
  });
});

it('restores ownership before cancellation so a terminal event prevents a retry', async () => {
  const requestId = `restore-terminal-during-cancel-${crypto.randomUUID()}`;
  const storageKey = 'xeg.download-tracking.v1';
  const existingRecords = state.storageValues[storageKey];
  state.storageValues[storageKey] = {
    ...(typeof existingRecords === 'object' && existingRecords !== null ? existingRecords : {}),
    [requestId]: {
      downloadId: 707,
      cancellationRequested: true,
      cancellationRequestedAt: Date.now(),
    },
  };
  state.searchDownload
    .mockResolvedValueOnce([{ id: 707, state: 'in_progress' }])
    .mockRejectedValue(new Error('download lookup unavailable'));
  state.cancelDownload.mockImplementation(async (downloadId: number) => {
    state.downloadChangedListener?.({ id: downloadId, state: 'interrupted' });
  });

  vi.resetModules();
  await import('@extension/background');

  await vi.waitFor(() => {
    const records = state.storageValues[storageKey] as Record<string, unknown>;
    expect(records).not.toHaveProperty(requestId);
  });
  expect(state.cancelDownload).toHaveBeenCalledTimes(1);
  expect(state.cancelDownload).toHaveBeenCalledWith(707);
  expect(state.searchDownload).toHaveBeenCalledTimes(2);
});

describe('background notification messages', () => {
  it('returns an error response when notifications.create rejects', async () => {
    const rejection = Promise.reject(new Error('notifications unavailable'));
    void rejection.catch(() => undefined);
    state.createNotification.mockReturnValueOnce(rejection);
    const sendResponse = vi.fn();

    const keepChannelOpen = state.listener?.(
      {
        type: 'SHOW_NOTIFICATION',
        payload: { id: 'notice-1', title: 'Download', message: 'Complete' },
      },
      { id: 'extension-id' },
      sendResponse
    );

    expect(keepChannelOpen).toBe(true);
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'notifications unavailable',
      });
    });
  });
});

describe('background blob lifetime status', () => {
  const objectUrl = 'blob:https://x.com/lifetime-resource';
  const statusRequest = (requestId: string, cancelRequested = false) => ({
    type: 'DOWNLOAD_BLOB_STATUS_REQUEST',
    payload: { requestId, objectUrl, ...(cancelRequested ? { cancelRequested: true } : {}) },
  });

  it('cancels a proven stored-ID download even when cancellation persistence fails', async () => {
    const requestId = `status-stored-write-failure-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { downloadId: 1101, cancellationRequested: false },
    };
    let cancelled = false;
    state.cancelDownload.mockImplementation(async () => { cancelled = true; });
    state.searchDownload.mockImplementation(async () => [{
      id: 1101, url: objectUrl, state: cancelled ? 'interrupted' : 'in_progress',
    }]);
    vi.resetModules();
    await import('@extension/background');
    await vi.waitFor(() => expect(state.searchDownload).toHaveBeenCalledWith({ id: 1101 }));
    state.storageSetError = new Error('storage quota exceeded');

    await expect(sendMessage(statusRequest(requestId, true))).resolves.toEqual({
      success: true, data: { requestId, status: 'terminal' },
    });
    expect(state.cancelDownload).toHaveBeenCalledWith(1101);
  });

  it('retains the recovered RAM ID after bind persistence fails and later cancels it', async () => {
    const requestId = `status-bind-write-failure-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { cancellationRequested: false },
    };
    let cancelled = false;
    state.cancelDownload.mockImplementation(async () => { cancelled = true; });
    state.searchDownload.mockImplementation(async () => [{
      id: 1102, url: objectUrl, state: cancelled ? 'interrupted' : 'in_progress',
    }]);
    vi.resetModules();
    await import('@extension/background');
    state.storageSetError = new Error('storage quota exceeded');

    await expect(sendMessage(statusRequest(requestId))).resolves.toEqual({
      success: true, data: { requestId, status: 'active' },
    });
    expect(state.searchDownload).toHaveBeenCalledWith({ url: objectUrl });
    state.searchDownload.mockClear();
    await expect(sendMessage(statusRequest(requestId, true))).resolves.toEqual({
      success: true, data: { requestId, status: 'terminal' },
    });
    expect(state.searchDownload).toHaveBeenCalledWith({ id: 1102 });
    expect(state.searchDownload).not.toHaveBeenCalledWith({ url: objectUrl });
    expect(state.cancelDownload).toHaveBeenCalledWith(1102);
  });

  it('cancels a newly recovered exact-URL ID despite both bind and intent write failures', async () => {
    const requestId = `status-rebind-cancel-write-failure-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { cancellationRequested: false },
    };
    let cancelled = false;
    state.cancelDownload.mockImplementation(async () => { cancelled = true; });
    state.searchDownload.mockImplementation(async () => [{
      id: 1104, url: objectUrl, state: cancelled ? 'interrupted' : 'in_progress',
    }]);
    vi.resetModules();
    await import('@extension/background');
    state.storageSetError = new Error('storage quota exceeded');
    state.storageSetFailuresRemaining = 2;

    await expect(sendMessage(statusRequest(requestId, true))).resolves.toEqual({
      success: true, data: { requestId, status: 'terminal' },
    });
    expect(state.searchDownload).toHaveBeenCalledWith({ url: objectUrl });
    expect(state.cancelDownload).toHaveBeenCalledWith(1104);
  });

  it('reports proven terminal status when tracking removal cannot persist', async () => {
    const requestId = `status-terminal-write-failure-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { cancellationRequested: false },
    };
    state.searchDownload.mockResolvedValue([{ id: 1103, url: objectUrl, state: 'complete' }]);
    vi.resetModules();
    await import('@extension/background');
    state.storageSetError = new Error('storage quota exceeded');

    await expect(sendMessage(statusRequest(requestId))).resolves.toEqual({
      success: true, data: { requestId, status: 'terminal' },
    });
    expect(state.cancelDownload).not.toHaveBeenCalled();
  });

  it.each(['complete', 'interrupted'])('removes an unbound request after exact URL %s is observed', async (terminalState) => {
    const requestId = `status-unbound-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { cancellationRequested: false },
    };
    state.searchDownload.mockResolvedValue([{ id: 918, url: objectUrl, state: terminalState }]);
    vi.resetModules();
    await import('@extension/background');
    await expect(sendMessage(statusRequest(requestId))).resolves.toEqual({
      success: true, data: { requestId, status: 'terminal' },
    });
    expect(state.storageValues[storageKey]).not.toHaveProperty(requestId);
  });

  it('does not treat a mismatched download ID result as terminal', async () => {
    const requestId = `status-mismatch-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { downloadId: 714, cancellationRequested: false },
    };
    state.searchDownload.mockResolvedValue([{ id: 714, url: 'blob:https://x.com/other', state: 'complete' }]);

    vi.resetModules();
    await import('@extension/background');
    await expect(sendMessage(statusRequest(requestId, true))).resolves.toEqual({
      success: true,
      data: { requestId, status: 'unknown' },
    });
    expect(state.cancelDownload).not.toHaveBeenCalled();
  });

  it('rediscovers a native download after a pre-ID worker restart and keeps cancellation linked', async () => {
    const requestId = `status-pre-id-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { cancellationRequested: true, cancellationRequestedAt: Date.now() - 60_000 },
    };
    state.searchDownload.mockImplementation((query: { id?: number; url?: string }) => {
      if (query.url === objectUrl) {
        return Promise.resolve([{ id: 815, url: objectUrl, state: 'in_progress' }]);
      }
      return Promise.resolve([{ id: 815, url: objectUrl, state: 'interrupted' }]);
    });

    vi.resetModules();
    await import('@extension/background');
    await expect(sendMessage(statusRequest(requestId, true))).resolves.toEqual({
      success: true,
      data: { requestId, status: 'terminal' },
    });
    expect(state.searchDownload).toHaveBeenCalledWith({ url: objectUrl });
    expect(state.cancelDownload).toHaveBeenCalledWith(815);
    expect(state.storageValues[storageKey]).not.toHaveProperty(requestId);
  });

  it('treats empty URL search results as unknown after a terminal record was removed', async () => {
    const requestId = `status-empty-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {
      [requestId]: { downloadId: 916, cancellationRequested: false },
    };
    state.searchDownload.mockResolvedValue([]);

    vi.resetModules();
    await import('@extension/background');
    await expect(sendMessage(statusRequest(requestId))).resolves.toEqual({
      success: true,
      data: { requestId, status: 'unknown' },
    });
    expect(state.searchDownload).toHaveBeenCalledWith({ url: objectUrl });
  });

  it('confirms a terminal exact URL after the persisted record is gone', async () => {
    const requestId = `status-terminal-${crypto.randomUUID()}`;
    const storageKey = 'xeg.download-tracking.v1';
    state.storageValues[storageKey] = {};
    state.searchDownload.mockResolvedValue([{ id: 917, url: objectUrl, state: 'complete' }]);

    vi.resetModules();
    await import('@extension/background');
    await expect(sendMessage(statusRequest(requestId))).resolves.toEqual({
      success: true,
      data: { requestId, status: 'terminal' },
    });
    expect(state.searchDownload).toHaveBeenCalledWith({ url: objectUrl });
  });
});

describe.each([
  {
    label: 'URL',
    request: (requestId: string) => ({
      type: 'DOWNLOAD_REQUEST',
      payload: {
        url: 'https://pbs.twimg.com/media/test.jpg',
        filename: 'test.jpg',
        requestId,
      },
    }),
  },
  {
    label: 'blob URL',
    request: (requestId: string) => ({
      type: 'DOWNLOAD_BLOB_URL_REQUEST',
      payload: {
        objectUrl: 'blob:https://x.com/resource-profile',
        filename: 'test.jpg',
        requestId,
      },
    }),
  },
])('background $label download cancellation', ({ request }) => {
  it('forgets a pre-ID cancellation when download ID allocation rejects', async () => {
    const requestId = `cancel-before-id-${crypto.randomUUID()}`;
    const firstDownload = deferred<number>();
    state.download.mockReturnValueOnce(firstDownload.promise);

    const failedResponse = sendMessage(request(requestId));
    await expect(
      sendMessage({ type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId } })
    ).resolves.toEqual({ success: true });
    firstDownload.reject(new Error('download ID unavailable'));
    await expect(failedResponse).resolves.toEqual({
      success: false,
      error: 'download ID unavailable',
      data: { requestId, terminal: true },
    });

    state.download.mockResolvedValueOnce(101);
    await expect(sendMessage(request(requestId))).resolves.toEqual({ success: true });

    expect(state.cancelDownload).not.toHaveBeenCalled();
  });

  it('does not cancel again after a pre-ID cancellation reaches a terminal state', async () => {
    const requestId = `cancel-before-id-terminal-${crypto.randomUUID()}`;
    const allocation = deferred<number>();
    state.download.mockReturnValueOnce(allocation.promise);
    state.waitForDownloadComplete.mockRejectedValueOnce(
      new Error('Download interrupted: USER_CANCELED')
    );

    const downloadResponse = sendMessage(request(requestId));
    await expect(
      sendMessage({ type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId } })
    ).resolves.toEqual({ success: true });
    allocation.resolve(151);

    await expect(downloadResponse).resolves.toEqual({
      success: false,
      error: 'Download interrupted: USER_CANCELED',
      data: { requestId, terminal: true },
    });
    expect(state.cancelDownload).toHaveBeenCalledTimes(1);
    expect(state.cancelDownload).toHaveBeenCalledWith(151);
    expect(state.storageValues['xeg.download-tracking.v1']).not.toHaveProperty(requestId);
  });

  it('cancels and checks a download that times out after receiving an ID', async () => {
    const requestId = `cancel-on-timeout-${crypto.randomUUID()}`;
    state.download.mockResolvedValueOnce(202);
    const timeoutError = new Error('Download timed out after 5 minutes (id: 202)');
    timeoutError.name = 'DownloadTimeoutError';
    state.waitForDownloadComplete.mockRejectedValueOnce(timeoutError);

    await expect(sendMessage(request(requestId))).resolves.toEqual({
      success: false,
      error: 'Download timed out after 5 minutes (id: 202)',
      data: { requestId, terminal: true },
    });

    expect(state.cancelDownload).toHaveBeenCalledWith(202);
    expect(state.searchDownload).toHaveBeenCalledWith({ id: 202 });
  });

  it('cancels and retains ownership when completion inspection fails after receiving an ID', async () => {
    const requestId = `cancel-on-inspection-failure-${crypto.randomUUID()}`;
    state.download.mockResolvedValueOnce(212);
    state.waitForDownloadComplete.mockRejectedValueOnce(
      new Error('Failed to inspect download 212: downloads unavailable')
    );
    state.cancelDownload.mockRejectedValueOnce(new Error('download is still active'));
    state.searchDownload
      .mockResolvedValueOnce([{ id: 212, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 212, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 212, state: 'interrupted' }]);

    await expect(
      sendMessage({
        type: 'DOWNLOAD_REQUEST',
        payload: {
          url: 'https://pbs.twimg.com/media/test.jpg',
          filename: 'test.jpg',
          requestId,
        },
      })
    ).resolves.toEqual({
      success: false,
      error: 'Failed to inspect download 212: downloads unavailable',
      data: { requestId, terminal: false },
    });

    expect(state.cancelDownload).toHaveBeenCalledTimes(2);
    expect(state.searchDownload).toHaveBeenCalledTimes(2);

    await expect(
      sendMessage({ type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId } })
    ).resolves.toEqual({ success: true });
    expect(state.cancelDownload).toHaveBeenCalledTimes(3);
  });

  it('keeps an unconfirmed timeout addressable for a later cancellation retry', async () => {
    const requestId = `cancel-retry-${crypto.randomUUID()}`;
    state.download.mockResolvedValueOnce(303);
    state.waitForDownloadComplete.mockRejectedValueOnce(
      Object.assign(new Error('Download timed out after 5 minutes (id: 303)'), {
        name: 'DownloadTimeoutError',
      })
    );
    state.cancelDownload.mockRejectedValueOnce(new Error('download is still active'));
    state.searchDownload
      .mockResolvedValueOnce([{ id: 303, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 303, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 303, state: 'interrupted' }]);

    await expect(sendMessage(request(requestId))).resolves.toEqual({
      success: false,
      error: 'Download timed out after 5 minutes (id: 303)',
      data: { requestId, terminal: false },
    });

    await expect(
      sendMessage({ type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId } })
    ).resolves.toEqual({ success: true });

    expect(state.cancelDownload).toHaveBeenCalledTimes(3);
    expect(state.cancelDownload).toHaveBeenNthCalledWith(1, 303);
    expect(state.cancelDownload).toHaveBeenNthCalledWith(2, 303);
    expect(state.cancelDownload).toHaveBeenNthCalledWith(3, 303);
    expect(state.searchDownload).toHaveBeenCalledTimes(3);
  });

  it('does not retry cancellation after a terminal event precedes owner settlement', async () => {
    const requestId = `terminal-before-owner-${crypto.randomUUID()}`;
    state.download.mockResolvedValueOnce(404);
    state.waitForDownloadComplete.mockRejectedValueOnce(
      Object.assign(new Error('Download timed out after 5 minutes (id: 404)'), {
        name: 'DownloadTimeoutError',
      })
    );
    state.cancelDownload.mockImplementationOnce(() => {
      state.downloadChangedListener?.({ id: 404, state: 'interrupted' });
      return Promise.resolve();
    });
    state.searchDownload
      .mockRejectedValueOnce(new Error('download lookup unavailable'))
      .mockRejectedValueOnce(new Error('download lookup still unavailable'));

    await expect(
      sendMessage({
        type: 'DOWNLOAD_REQUEST',
        payload: {
          url: 'https://pbs.twimg.com/media/test.jpg',
          filename: 'test.jpg',
          requestId,
        },
      })
    ).resolves.toEqual({
      success: false,
      error: 'Download timed out after 5 minutes (id: 404)',
      data: { requestId, terminal: true },
    });

    await expect(
      sendMessage({ type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId } })
    ).resolves.toEqual({ success: true });
    expect(state.cancelDownload).toHaveBeenCalledTimes(1);
  });

  it('does not repeat a successful restore before handling a late cancellation', async () => {
    const requestId = `cancel-after-restart-${crypto.randomUUID()}`;
    state.download.mockResolvedValueOnce(505);
    state.waitForDownloadComplete.mockRejectedValueOnce(
      Object.assign(new Error('Download timed out after 5 minutes (id: 505)'), {
        name: 'DownloadTimeoutError',
      })
    );
    state.searchDownload
      .mockResolvedValueOnce([{ id: 505, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 505, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 505, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 505, state: 'interrupted' }]);

    await expect(sendMessage(request(requestId))).resolves.toEqual({
      success: false,
      error: 'Download timed out after 5 minutes (id: 505)',
      data: { requestId, terminal: false },
    });

    state.searchDownload.mockClear();
    await state.startupListener?.();
    expect(state.searchDownload).not.toHaveBeenCalled();
    await expect(
      sendMessage({ type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId } })
    ).resolves.toEqual({ success: true });

    expect(state.cancelDownload).toHaveBeenCalledTimes(4);
    expect(state.cancelDownload).toHaveBeenLastCalledWith(505);
  });

  it('does not report cancellation success when its persistence fails', async () => {
    const requestId = `cancel-persistence-failure-${crypto.randomUUID()}`;
    state.download.mockResolvedValueOnce(606);
    state.waitForDownloadComplete.mockRejectedValueOnce(
      Object.assign(new Error('Download timed out after 5 minutes (id: 606)'), {
        name: 'DownloadTimeoutError',
      })
    );
    state.cancelDownload.mockRejectedValueOnce(new Error('download is still active'));
    state.searchDownload
      .mockResolvedValueOnce([{ id: 606, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 606, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 606, state: 'interrupted' }]);

    await expect(sendMessage(request(requestId))).resolves.toEqual({
      success: false,
      error: 'Download timed out after 5 minutes (id: 606)',
      data: { requestId, terminal: false },
    });

    state.storageSetError = new Error('storage quota exceeded');
    await expect(
      sendMessage({ type: 'DOWNLOAD_CANCEL_REQUEST', payload: { requestId } })
    ).resolves.toEqual({
      success: false,
      error: 'Download tracking storage write failed: storage quota exceeded',
      data: { requestId, terminal: true },
    });

    expect(state.cancelDownload).toHaveBeenCalledTimes(3);
    expect(state.cancelDownload).toHaveBeenLastCalledWith(606);
  });
});
