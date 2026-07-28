// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { createLogger } from '@shared/logging/logger';
import type { NotificationAdapter } from './types';

const log = createLogger('Notification');

/** Deliver a best-effort notification without leaking a rejected Promise. */
export function notifySafely(
  adapter: NotificationAdapter,
  title: string,
  message: string,
  imageUrl?: string
): void {
  void adapter.notify(title, message, imageUrl).catch((error: unknown) => {
    log.warn('Notification delivery failed', error);
  });
}
