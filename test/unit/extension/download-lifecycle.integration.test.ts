import { DOWNLOAD_CANCEL_RETRY_DELAY_MS, DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import { MV3DownloadAdapter } from '@platform/mv3-download-adapters';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void
) => boolean | undefined;

type DownloadChangedListener = (delta: {
  id: number;
  state?: string | { current: string };
}) => void;

const state = vi.hoisted(() => ({
  cancelDownload: vi.fn(),
  download: vi.fn(),
  searchDownload: vi.fn(),
  downloadChangedListener: null as DownloadChangedListener | null,
  listener: null as MessageListener | null,
  messages: [] as unknown[],
  storageValues: {} as Record<string, unknown>,
}));

vi.mock('@platform/chrome-runtime', () => ({
  browserApi: {
    runtime: {
      id: 'extension-id',
      sendMessage: (message: unknown) => {
        state.messages.push(message);
        return new Promise<unknown>((resolve) => {
          const keepChannelOpen = state.listener?.(message, { id: 'extension-id' }, resolve);
          if (keepChannelOpen !== true) resolve(undefined);
        });
      },
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
    notifications: { create: vi.fn() },
  },
}));

import '@extension/background';

async function flushPromises(): Promise<void> {
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
}

describe('MV3 download lifecycle integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.cancelDownload.mockReset().mockResolvedValue(undefined);
    state.download.mockReset().mockResolvedValue(301);
    state.searchDownload.mockReset().mockResolvedValue([{ id: 301, state: 'interrupted' }]);
    state.downloadChangedListener = null;
    state.messages.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps timeout ownership connected from the adapter through the background retry path', async () => {
    state.searchDownload
      .mockResolvedValueOnce([{ id: 301, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 301, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 301, state: 'in_progress' }])
      .mockResolvedValueOnce([{ id: 301, state: 'interrupted' }]);
    state.cancelDownload.mockRejectedValueOnce(new Error('download is still active'));

    const controller = new AbortController();
    const adapter = new MV3DownloadAdapter();
    const pending = adapter.download(
      'https://pbs.twimg.com/media/example.jpg',
      'example.jpg',
      undefined,
      controller.signal
    );
    const outcome = expect(pending).rejects.toThrow('Download timed out after 5 minutes');

    await flushPromises();
    expect(state.searchDownload).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(DOWNLOAD_TIMEOUT_MS + DOWNLOAD_CANCEL_RETRY_DELAY_MS);
    await outcome;

    expect(state.cancelDownload).toHaveBeenCalledTimes(2);
    expect(
      state.messages.filter(
        (message) =>
          typeof message === 'object' &&
          message !== null &&
          (message as { type?: unknown }).type === 'DOWNLOAD_CANCEL_REQUEST'
      )
    ).toHaveLength(0);

    controller.abort();
    await flushPromises();

    expect(state.cancelDownload).toHaveBeenCalledTimes(3);
    expect(state.searchDownload).toHaveBeenCalledTimes(4);
    expect(
      state.messages.filter(
        (message) =>
          typeof message === 'object' &&
          message !== null &&
          (message as { type?: unknown }).type === 'DOWNLOAD_CANCEL_REQUEST'
      )
    ).toHaveLength(1);
  });
});
