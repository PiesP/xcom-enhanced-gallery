// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { createAdapter } from './adapter-factory';
import { GMNotificationAdapter } from './gm-notification-adapter';
import { MV3NotificationAdapter } from './mv3-notification-adapters';
import type { NotificationAdapter } from './types';

/**
 * Returns the singleton notification adapter for the current platform.
 *
 * - MV3 extension: {@link MV3NotificationAdapter} (`chrome.notifications`)
 * - Userscript: {@link GMNotificationAdapter} (`GM_notification`)
 */
export const getNotificationAdapter: () => NotificationAdapter = createAdapter(
  () => new MV3NotificationAdapter(),
  () => new GMNotificationAdapter()
);
