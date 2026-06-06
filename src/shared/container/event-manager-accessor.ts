// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview EventManager singleton accessor. Lives in a separate module
 * to avoid circular dependencies (container.ts imports theme-service.ts, so
 * theme-service.ts cannot import getEventManager from container.ts directly).
 */

import { EventManager } from '@shared/services/event-manager';

let eventManagerInstance: EventManager | null = null;

export function getEventManager(): EventManager {
  if (!eventManagerInstance) {
    eventManagerInstance = EventManager.getInstance();
  }
  return eventManagerInstance;
}
