// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** @fileoverview Gallery event lifecycle: init/teardown keyboard + click listeners. */

import { logger } from '@shared/logging/logger';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { getEventManager } from '@shared/services/event-manager';
import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';

export interface GalleryLifecycle {
  initialize(handlers: EventHandlers, options?: Partial<GalleryEventOptions>): () => void;
  cleanup(): void;
}

/**
 * Create a self-contained gallery lifecycle with instance-scoped state.
 * Each call creates an independent lifecycle — safe for multiple gallery instances.
 */
export function createGalleryLifecycle(): GalleryLifecycle {
  let initialized = false;
  let currentContext: string | null = null;

  function initialize(handlers: EventHandlers, options?: Partial<GalleryEventOptions>): () => void {
    if (initialized) {
      __DEV__ && logger.warn('[GalleryLifecycle] Re-initializing, cleaning up previous listeners');
      cleanup();
    }

    if (!handlers) {
      __DEV__ && logger.error('[GalleryLifecycle] Missing handlers');
      return cleanup;
    }

    // Focus restoration is handled by GalleryContainer.tsx on mount/cleanup.
    // No need to capture openerElement here.
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
    const eventManager = getEventManager();
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

    return cleanup;
  }

  function cleanup(): void {
    if (!initialized) return;

    if (currentContext) {
      getEventManager().removeByContext(currentContext);
    }

    // Focus restoration is handled by GalleryContainer.tsx onCleanup.
    // This lifecycle module only manages listeners — removing the duplicate
    // focus() call prevents a race condition where the wrong element receives focus.

    resetKeyboardDebounceState();
    initialized = false;
    currentContext = null;
  }

  return { initialize, cleanup };
}
