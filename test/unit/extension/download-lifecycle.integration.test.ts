import { webcrypto } from 'node:crypto';
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
          const keepChannelOpen = state.listener?.(
            message,
            {
              id: 'extension-id',
              tab: { id: 7 },
              url: 'https://x.com/author/status/1',
            },
            resolve
          );
          if (keepChannelOpen !== true) {
            resolve(undefined);
          }
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
          if (keys === null) {
            return { ...state.storageValues };
          }
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
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete state.storageValues[key];
          }
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

describe('MV3 download lifecycle integration', () => {
  beforeEach(() => {
    // Native URL hashing runs on WebCrypto's real task queue. Keep this
    // integration on real timers so reconciliation cannot outrun that queue.
    vi.useRealTimers();
    vi.stubGlobal('crypto', webcrypto);
    state.cancelDownload.mockReset().mockResolvedValue(undefined);
    state.download.mockReset().mockResolvedValue(301);
    state.searchDownload.mockReset().mockResolvedValue([{ id: 301, state: 'interrupted' }]);
    state.downloadChangedListener = null;
    state.messages.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps an active native request pending and cancellable past the initial checks', async () => {
    const url = 'https://pbs.twimg.com/media/example.jpg';
    let nativeState = 'in_progress';
    state.searchDownload.mockImplementation(async () => [{ id: 301, url, state: nativeState }]);
    state.cancelDownload.mockImplementation(async (downloadId: number) => {
      nativeState = 'interrupted';
      state.downloadChangedListener?.({ id: downloadId, state: 'interrupted' });
    });

    const controller = new AbortController();
    const adapter = new MV3DownloadAdapter();
    const pending = adapter.download(url, 'example.jpg', undefined, controller.signal);
    let settled = false;
    const outcome = pending.catch((error: unknown) => {
      settled = true;
      return error;
    });

    await vi.waitFor(() => {
      expect(state.download).toHaveBeenCalledOnce();
      const records = state.storageValues['xeg.download-tracking.v1'];
      expect(Object.values(records as Record<string, { downloadId?: number }>)).toEqual(
        expect.arrayContaining([expect.objectContaining({ downloadId: 301 })])
      );
    });
    await new Promise((resolve) => setTimeout(resolve, 3_500));
    expect(settled).toBe(false);

    expect(state.download).toHaveBeenCalledOnce();
    expect(
      state.messages.filter(
        (message) =>
          typeof message === 'object' &&
          message !== null &&
          (message as { type?: unknown }).type === 'DOWNLOAD_CANCEL_REQUEST'
      )
    ).toHaveLength(0);

    controller.abort();
    expect(await outcome).toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(state.cancelDownload).toHaveBeenCalledWith(301));
    expect(
      state.messages.filter(
        (message) =>
          typeof message === 'object' &&
          message !== null &&
          (message as { type?: unknown }).type === 'DOWNLOAD_CANCEL_REQUEST'
      )
    ).toHaveLength(1);
    expect(state.download).toHaveBeenCalledOnce();
  }, 10_000);
});
