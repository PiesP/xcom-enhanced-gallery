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
});
