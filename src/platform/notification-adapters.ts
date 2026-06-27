// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { IS_MV3 } from './detect';
import { GMNotificationAdapter } from './gm-notification-adapter';
import { MV3NotificationAdapter } from './mv3-notification-adapters';
import type { NotificationAdapter } from './types';

let _notificationAdapter: NotificationAdapter | null = null;

export function getNotificationAdapter(): NotificationAdapter {
  if (_notificationAdapter) return _notificationAdapter;
  _notificationAdapter = IS_MV3 ? new MV3NotificationAdapter() : new GMNotificationAdapter();
  return _notificationAdapter;
}
