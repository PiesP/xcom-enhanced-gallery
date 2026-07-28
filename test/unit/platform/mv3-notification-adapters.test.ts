import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMessage } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}));

vi.mock('@platform/chrome-runtime', () => ({
  browserApi: {
    runtime: { sendMessage },
  },
}));

import { MV3NotificationAdapter } from '@platform/mv3-notification-adapters';

describe('MV3NotificationAdapter', () => {
  beforeEach(() => {
    sendMessage.mockReset();
  });

  it('rejects when the background reports notification creation failure', async () => {
    sendMessage.mockResolvedValue({
      success: false,
      error: 'notifications unavailable',
    });

    const adapter = new MV3NotificationAdapter();

    await expect(adapter.notify('Download', 'Complete')).rejects.toThrow(
      'notifications unavailable'
    );
  });
});
