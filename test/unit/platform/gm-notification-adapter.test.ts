// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notification: vi.fn(),
}));

vi.mock('@shared/external/userscript/adapter', () => ({
  getUserscript: () => ({ notification: mocks.notification }),
}));

import { GMNotificationAdapter } from '@platform/gm-notification-adapter';

describe('GMNotificationAdapter', () => {
  it('auto-dismisses userscript notifications after five seconds', async () => {
    await new GMNotificationAdapter().notify('Download failed', 'Network error');

    expect(mocks.notification).toHaveBeenCalledWith({
      title: 'Download failed',
      text: 'Network error',
      image: undefined,
      timeout: 5000,
    });
  });
});
