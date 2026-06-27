// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * MV3 extension notification adapter.
 *
 * Uses chrome.notifications.create() for desktop notifications.
 */

import type { NotificationAdapter } from './types';

export class MV3NotificationAdapter implements NotificationAdapter {
  private idCounter = 0;

  notify(title: string, message: string, imageUrl?: string): void {
    const id = `xeg-${Date.now()}-${++this.idCounter}`;
    chrome.notifications.create(id, {
      type: 'basic',
      title,
      message,
      iconUrl: imageUrl ?? 'icon128.png',
    });
  }
}
