import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMessage } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}));

vi.mock('@platform/chrome-runtime', () => ({
  browserApi: {
    runtime: { sendMessage },
  },
}));

import { MV3DownloadAdapter } from '@platform/mv3-download-adapters';

describe('MV3DownloadAdapter', () => {
  beforeEach(() => {
    sendMessage.mockReset();
    sendMessage.mockResolvedValue({ success: true });
  });

  it('does not send a cancellation for a download that never started', async () => {
    const controller = new AbortController();
    controller.abort();
    const adapter = new MV3DownloadAdapter();

    await expect(
      adapter.download('https://pbs.twimg.com/media/example.jpg', 'example.jpg', undefined, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('keeps the original request cancellable after a non-terminal background failure', async () => {
    const controller = new AbortController();
    sendMessage.mockImplementationOnce((message: { payload: { requestId: string } }) =>
      Promise.resolve({
        success: false,
        error: 'Download timed out after 5 minutes',
        data: { requestId: message.payload.requestId, terminal: false },
      })
    );
    const adapter = new MV3DownloadAdapter();

    await expect(
      adapter.download(
        'https://pbs.twimg.com/media/example.jpg',
        'example.jpg',
        undefined,
        controller.signal
      )
    ).rejects.toThrow('Download timed out after 5 minutes');

    const firstMessage = sendMessage.mock.calls[0]?.[0] as {
      payload: { requestId: string };
    };
    controller.abort();
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));

    expect(sendMessage.mock.calls[1]?.[0]).toEqual({
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: { requestId: firstMessage.payload.requestId },
    });
  });
});
