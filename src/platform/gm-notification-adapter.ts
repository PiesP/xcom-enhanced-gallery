// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) notification adapter.
 *
 * Wraps GM_notification for userscript environments.
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type { NotificationAdapter } from './types';

const ERROR_NOTIFICATION_TIMEOUT_MS = 5000;

export class GMNotificationAdapter implements NotificationAdapter {
  async notify(title: string, message: string, imageUrl?: string): Promise<void> {
    getUserscript().notification({
      title,
      text: message,
      image: imageUrl,
      timeout: ERROR_NOTIFICATION_TIMEOUT_MS,
    });
  }
}
