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
            state.storageSetError = null;
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
    });

    expect(state.cancelDownload).toHaveBeenCalledTimes(3);
    expect(state.cancelDownload).toHaveBeenLastCalledWith(606);
  });
});
