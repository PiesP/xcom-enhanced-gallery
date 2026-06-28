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

import type { NotificationAdapter } from './types';

export class MV3NotificationAdapter implements NotificationAdapter {
  private idCounter = 0;

  notify(title: string, message: string, imageUrl?: string): void {
    // Fire-and-forget: notifications are non-critical, no need to await response.
    const id = `xeg-${Date.now()}-${++this.idCounter}`;
    chrome.runtime
      .sendMessage({
        type: 'SHOW_NOTIFICATION',
        payload: { id, title, message, imageUrl },
      })
      .catch(() => {
        // Notification relay failed — silently ignore (non-critical).
      });
  }
}
