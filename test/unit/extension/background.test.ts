import { beforeEach, describe, expect, it, vi } from 'vitest';

type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void
) => boolean | undefined;

const state = vi.hoisted(() => ({
  cancelDownload: vi.fn(),
  listener: null as MessageListener | null,
  createNotification: vi.fn(),
  download: vi.fn(),
  waitForDownloadComplete: vi.fn(),
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
      onStartup: { addListener: vi.fn(), removeListener: vi.fn() },
      onSuspend: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    downloads: {
      download: state.download,
      cancel: state.cancelDownload,
      search: vi.fn(),
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
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
  state.waitForDownloadComplete.mockReset().mockResolvedValue(undefined);
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
});
