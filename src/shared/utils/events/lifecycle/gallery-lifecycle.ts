/** @fileoverview Gallery event lifecycle: init/teardown keyboard + click listeners. */

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import type {
  EventHandlers,
  EventHandlingResult,
  GalleryEventOptions,
} from '@shared/services/event-types';
import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';

const DEFAULT_GALLERY_EVENT_OPTIONS = {
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'gallery',
} as const satisfies GalleryEventOptions;

interface LifecycleState {
  readonly initialized: boolean;
  readonly context: string | null;
}

let lifecycleState: LifecycleState = { initialized: false, context: null };

function sanitizeContext(context: string | undefined): string {
  const trimmed = context?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_GALLERY_EVENT_OPTIONS.context;
}

function resolveInitializationInput(
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Readonly<{
  options: GalleryEventOptions;
  root: HTMLElement | null;
}> {
  if (optionsOrRoot instanceof HTMLElement) {
    return { options: { ...DEFAULT_GALLERY_EVENT_OPTIONS }, root: optionsOrRoot };
  }
  const partial = optionsOrRoot ?? {};
  return {
    options: {
      ...DEFAULT_GALLERY_EVENT_OPTIONS,
      ...partial,
      context: sanitizeContext(partial.context),
    },
    root: null,
  };
}

function resolveEventTarget(explicitRoot: HTMLElement | null): EventTarget {
  return explicitRoot || document.body || document.documentElement || document;
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
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): () => void {
  if (lifecycleState.initialized) {
    if (__DEV__) logger.warn('[GalleryLifecycle] Re-initializing, cleaning up previous listeners');
    cleanupGalleryEvents();
  }

  if (!handlers) {
    if (__DEV__) logger.error('[GalleryLifecycle] Missing handlers');
    return cleanupGalleryEvents;
  }

  const { options: finalOptions, root: explicitGalleryRoot } =
    resolveInitializationInput(optionsOrRoot);
  const context = sanitizeContext(finalOptions.context);
  const target = resolveEventTarget(explicitGalleryRoot);

  const eventManager = EventManager.getInstance();
  registerListeners(eventManager, target, handlers, finalOptions, context);
  resetKeyboardDebounceState();

  lifecycleState = { initialized: true, context };

  if (__DEV__ && finalOptions.debugMode) {
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
