/**
 * @fileoverview Gallery event lifecycle management
 * Simplified initialization and teardown of core gallery event handlers.
 */

import { logger } from '@shared/logging';
import { resetKeyboardDebounceState } from '../../keyboard-debounce';
import { handleKeyboardEvent } from '../handlers/keyboard-handler';
import { handleMediaClick } from '../handlers/media-click-handler';
import { addListener, removeEventListenersByContext } from '../core/listener-manager';
import type { EventHandlers, GalleryEventOptions } from '../core/event-context';

interface LifecycleState {
  initialized: boolean;
  options: GalleryEventOptions | null;
  handlers: EventHandlers | null;
  keyListener: EventListener | null;
  clickListener: EventListener | null;
  listenerContext: string | null;
  eventTarget: EventTarget | null;
}

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

function resolveEventTarget(explicitRoot: HTMLElement | null): EventTarget {
  if (explicitRoot) {
    return explicitRoot;
  }

  if (document.body) {
    return document.body;
  }

  if (document.documentElement) {
    return document.documentElement;
  }

  return document;
}

export async function initializeGalleryEvents(
  handlers: EventHandlers,
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Promise<() => void> {
  if (lifecycleState.initialized) {
    cleanupGalleryEvents();
  }

  let finalOptions: GalleryEventOptions;
  let explicitGalleryRoot: HTMLElement | null = null;

  if (optionsOrRoot instanceof HTMLElement) {
    explicitGalleryRoot = optionsOrRoot;
    finalOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'gallery',
    };
  } else {
    const options = optionsOrRoot || {};
    finalOptions = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: 'gallery',
      ...options,
    };
  }

  const keyHandler: EventListener = (evt: Event) => {
    const event = evt as KeyboardEvent;
    handleKeyboardEvent(event, handlers, finalOptions);
  };

  const clickHandler: EventListener = async (evt: Event) => {
    const event = evt as MouseEvent;
    const result = await handleMediaClick(event, handlers, finalOptions);
    if (result.handled && finalOptions.preventBubbling) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const target = resolveEventTarget(explicitGalleryRoot);
  const listenerOptions: AddEventListenerOptions = {
    capture: true,
    passive: false,
  };

  addListener(target, 'keydown', keyHandler, listenerOptions, finalOptions.context);
  addListener(target, 'click', clickHandler, listenerOptions, finalOptions.context);

  lifecycleState = {
    initialized: true,
    options: finalOptions,
    handlers,
    keyListener: keyHandler,
    clickListener: clickHandler,
    listenerContext: finalOptions.context,
    eventTarget: target,
  };

  logger.debug('[GalleryEvents] Event listeners registered', {
    context: finalOptions.context,
  });

  return () => {
    cleanupGalleryEvents();
  };
}

export function cleanupGalleryEvents(): void {
  if (!lifecycleState.initialized) {
    return;
  }

  if (lifecycleState.listenerContext) {
    removeEventListenersByContext(lifecycleState.listenerContext);
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
