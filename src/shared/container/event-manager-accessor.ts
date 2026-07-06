// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview EventManager singleton accessor. Lives in a separate module
 * to avoid circular dependencies (container.ts imports theme-service.ts, so
 * theme-service.ts cannot import getEventManager from container.ts directly).
 */

import type { EventManager } from '@shared/services/event-manager';
import { getEventManager as getEventManagerAccessor } from '@shared/services/event-manager';

let eventManagerInstance: EventManager | null = null;

/** Get the singleton EventManager instance */
export function getEventManager(): EventManager {
  if (!eventManagerInstance) {
    eventManagerInstance = getEventManagerAccessor();
  }
  return eventManagerInstance;
}

/** Reset cached reference (called during cleanup to prevent stale references) */
export function resetEventManager(): void {
  eventManagerInstance = null;
}
