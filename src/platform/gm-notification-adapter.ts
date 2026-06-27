// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * GM (userscript) notification adapter.
 *
 * Wraps GM_notification for userscript environments.
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type { NotificationAdapter } from './types';

export class GMNotificationAdapter implements NotificationAdapter {
  notify(title: string, message: string, imageUrl?: string): void {
    getUserscript().notification({
      title,
      text: message,
      image: imageUrl,
    });
  }
}
