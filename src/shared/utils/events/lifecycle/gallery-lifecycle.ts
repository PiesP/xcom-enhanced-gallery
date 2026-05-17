/** @fileoverview Gallery event lifecycle: init/teardown keyboard + click listeners. */

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-types';
import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';

interface LifecycleState {
  readonly initialized: boolean;
  readonly context: string | null;
}

let lifecycleState: LifecycleState = { initialized: false, context: null };

function resolveEventTarget(explicitRoot: HTMLElement | null): EventTarget {
  return explicitRoot ?? document.body;
}

function registerListeners(
  eventManager: EventManager,
  target: EventTarget,
  handlers: EventHandlers,
  options: GalleryEventOptions,
  context: string
): void {
  const listenerOptions: AddEventListenerOptions = { capture: true, passive: false };

  if (options.enableKeyboard) {
    const keyHandler: EventListener = (evt: Event) => {
      handleKeyboardEvent(evt as KeyboardEvent, handlers, options);
    };
    eventManager.addEventListener(target, 'keydown', keyHandler, { ...listenerOptions, context });
  }

  if (options.enableMediaDetection) {
    const clickHandler: EventListener = async (evt: Event) => {
      await handleMediaClick(evt as MouseEvent, handlers, options);
    };
    eventManager.addEventListener(target, 'click', clickHandler, { ...listenerOptions, context });
  }
}

export function initializeGalleryEvents(
  handlers: EventHandlers,
  options?: Partial<GalleryEventOptions>
): () => void {
  if (lifecycleState.initialized) {
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

  const target = resolveEventTarget(null);

  const eventManager = EventManager.getInstance();
  registerListeners(eventManager, target, handlers, mergedOptions, context);
  resetKeyboardDebounceState();

  lifecycleState = { initialized: true, context };

  if (__DEV__ && mergedOptions.debugMode) {
    logger.debug('[GalleryEvents] Listeners registered', { context });
  }

  return cleanupGalleryEvents;
}

export function cleanupGalleryEvents(): void {
  if (!lifecycleState.initialized) return;

  if (lifecycleState.context) {
    EventManager.getInstance().removeByContext(lifecycleState.context);
  }

  resetKeyboardDebounceState();
  lifecycleState = { initialized: false, context: null };
}
