/**
 * @fileoverview Gallery event lifecycle management
 * Simplified initialization and teardown of core gallery event handlers.
 */

import { logger } from '@shared/logging';
import { EventManager } from '@shared/services/event-manager';
import type { EventHandlers, GalleryEventOptions } from '@shared/utils/events/core/event-context';
import { handleKeyboardEvent } from '@shared/utils/events/handlers/keyboard';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { resetKeyboardDebounceState } from '@shared/utils/events/keyboard-debounce';

interface LifecycleState {
  initialized: boolean;
  options: GalleryEventOptions | null;
  handlers: EventHandlers | null;
  keyListener: EventListener | null;
  clickListener: EventListener | null;
  listenerContext: string | null;
  eventTarget: EventTarget | null;
}

const DEFAULT_GALLERY_EVENT_OPTIONS: GalleryEventOptions = {
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'gallery',
};

const initialLifecycleState: LifecycleState = {
  initialized: false,
  options: null,
  handlers: null,
  keyListener: null,
  clickListener: null,
  listenerContext: null,
  eventTarget: null,
};

let lifecycleState: LifecycleState = { ...initialLifecycleState };

function sanitizeContext(context: string | undefined): string {
  const trimmed = context?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_GALLERY_EVENT_OPTIONS.context;
}

function resolveInitializationInput(optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement): {
  options: GalleryEventOptions;
  root: HTMLElement | null;
} {
  if (optionsOrRoot instanceof HTMLElement) {
    return {
      options: { ...DEFAULT_GALLERY_EVENT_OPTIONS },
      root: optionsOrRoot,
    };
  }

  const partial = optionsOrRoot ?? {};
  const merged: GalleryEventOptions = {
    ...DEFAULT_GALLERY_EVENT_OPTIONS,
    ...partial,
  };

  merged.context = sanitizeContext(merged.context);

  return {
    options: merged,
    root: null,
  };
}

function resolveEventTarget(explicitRoot: HTMLElement | null): EventTarget {
  return explicitRoot || document.body || document.documentElement || document;
}

export async function initializeGalleryEvents(
  handlers: EventHandlers,
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Promise<() => void> {
  if (lifecycleState.initialized) {
    logger.warn('[GalleryLifecycle] Already initialized, re-initializing');
    cleanupGalleryEvents();
  }

  if (!handlers) {
    logger.error('[GalleryLifecycle] Missing handlers');
    return () => {};
  }

  const { options: finalOptions, root: explicitGalleryRoot } =
    resolveInitializationInput(optionsOrRoot);
  const listenerContext = sanitizeContext(finalOptions.context);

  const keyHandler: EventListener = (evt: Event) => {
    const event = evt as KeyboardEvent;
    handleKeyboardEvent(event, handlers, finalOptions);
  };

  const clickHandler: EventListener = async (evt: Event) => {
    const event = evt as MouseEvent;
    await handleMediaClick(event, handlers, finalOptions);
  };

  const target = resolveEventTarget(explicitGalleryRoot);
  const listenerOptions: AddEventListenerOptions = {
    capture: true,
    passive: false,
  };

  const eventManager = EventManager.getInstance();

  if (finalOptions.enableKeyboard) {
    eventManager.addListener(target, 'keydown', keyHandler, listenerOptions, listenerContext);
  }

  if (finalOptions.enableMediaDetection) {
    eventManager.addListener(target, 'click', clickHandler, listenerOptions, listenerContext);
  }

  resetKeyboardDebounceState();

  lifecycleState = {
    initialized: true,
    options: finalOptions,
    handlers,
    keyListener: keyHandler,
    clickListener: clickHandler,
    listenerContext,
    eventTarget: target,
  };

  if (finalOptions.debugMode) {
    logger.debug('[GalleryEvents] Event listeners registered', {
      context: listenerContext,
    });
  }

  return () => {
    cleanupGalleryEvents();
  };
}

export function cleanupGalleryEvents(): void {
  if (!lifecycleState.initialized) {
    return;
  }

  if (lifecycleState.listenerContext) {
    EventManager.getInstance().removeByContext(lifecycleState.listenerContext);
  }

  resetKeyboardDebounceState();

  lifecycleState = { ...initialLifecycleState };
}

export function updateGalleryEventOptions(newOptions: Partial<GalleryEventOptions>): void {
  if (lifecycleState.options) {
    lifecycleState.options = { ...lifecycleState.options, ...newOptions };
  }
}

export function getGalleryEventSnapshot() {
  return {
    initialized: lifecycleState.initialized,
    options: lifecycleState.options,
    isConnected: lifecycleState.initialized,
  };
}
