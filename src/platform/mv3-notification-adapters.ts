// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension notification adapter.
 *
 * Relays notification requests to the background service worker via
 * chrome.runtime.sendMessage. ISOLATED world content scripts cannot
 * access chrome.notifications directly — it's only available in
 * extension pages (background SW, popup, options).
 */

import { browserApi } from './chrome-runtime';
import type { NotificationAdapter } from './types';

export class MV3NotificationAdapter implements NotificationAdapter {
  private idCounter = 0;

  async notify(title: string, message: string, imageUrl?: string): Promise<void> {
    const id = `xeg-${Date.now()}-${++this.idCounter}`;
    const response: unknown = await browserApi.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { id, title, message, imageUrl },
    });

    if (!response || typeof response !== 'object') {
      throw new Error('Empty or invalid response from background SW');
    }
    const result = response as Record<string, unknown>;
    if (result.success !== true) {
      throw new Error(
        typeof result.error === 'string' && result.error.length > 0
          ? result.error
          : 'Notification failed'
      );
    }
  }
}
