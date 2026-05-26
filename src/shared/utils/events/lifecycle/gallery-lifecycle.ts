// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Gallery event lifecycle: init/teardown keyboard + click listeners. */

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-types';
import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';

let initialized = false;
let currentContext: string | null = null;

export function initializeGalleryEvents(
  handlers: EventHandlers,
  options?: Partial<GalleryEventOptions>
): () => void {
  if (initialized) {
    if (__DEV__) logger.warn('[GalleryLifecycle] Re-initializing, cleaning up previous listeners');
    cleanupGalleryEvents();
  }

  if (!handlers) {
    if (__DEV__) logger.error('[GalleryLifecycle] Missing handlers');
    return cleanupGalleryEvents;
  }

  const context = options?.context?.trim() || 'gallery';
  const mergedOptions: GalleryEventOptions = {
    enableKeyboard: true,
    enableMediaDetection: true,
    debugMode: false,
    preventBubbling: true,
    ...options,
    context,
  };

  const target = document.body;
  const eventManager = EventManager.getInstance();
  const listenerOptions: AddEventListenerOptions = { capture: true, passive: false };

  if (mergedOptions.enableKeyboard) {
    const keyHandler: EventListener = (evt: Event) => {
      handleKeyboardEvent(evt as KeyboardEvent, handlers, mergedOptions);
    };
    eventManager.addEventListener(target, 'keydown', keyHandler, { ...listenerOptions, context });
  }

  if (mergedOptions.enableMediaDetection) {
    const clickHandler: EventListener = async (evt: Event) => {
      await handleMediaClick(evt as MouseEvent, handlers, mergedOptions);
    };
    eventManager.addEventListener(target, 'click', clickHandler, { ...listenerOptions, context });
  }

  resetKeyboardDebounceState();
  initialized = true;
  currentContext = context;

  if (__DEV__ && mergedOptions.debugMode) {
    logger.debug('[GalleryEvents] Listeners registered', { context });
  }

  return cleanupGalleryEvents;
}

export function cleanupGalleryEvents(): void {
  if (!initialized) return;

  if (currentContext) {
    EventManager.getInstance().removeByContext(currentContext);
  }

  resetKeyboardDebounceState();
  initialized = false;
  currentContext = null;
}
