import { describe, expect, it, vi } from 'vitest';

type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void
) => boolean | undefined;

const state = vi.hoisted(() => ({
  listener: null as MessageListener | null,
  createNotification: vi.fn(),
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
      download: vi.fn(),
      cancel: vi.fn(),
      search: vi.fn(),
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    notifications: { create: state.createNotification },
  },
}));

import '@extension/background';

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
