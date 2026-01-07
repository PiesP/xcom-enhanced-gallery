/**
 * @fileoverview Gallery event lifecycle management
 *
 * Manages initialization and teardown of core gallery event handlers.
 * Maintains internal state to prevent duplicate initialization and ensure
 * proper cleanup of listeners and debounce state.
 *
 * @example
 * const cleanup = await initializeGalleryEvents(handlers, { enableKeyboard: true });
 * // Later...
 * cleanupGalleryEvents(); // or cleanup();
 */

import { logger } from '@shared/logging/logger';
import { EventManager } from '@shared/services/event-manager';
import type {
  EventHandlers,
  GalleryEventOptions,
} from '@shared/utils/events/core/dom-listener-context';
import { handleKeyboardEvent } from '@shared/utils/events/handlers/keyboard';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { resetKeyboardDebounceState } from '@shared/utils/events/keyboard-debounce';

/**
 * Internal state tracking for gallery event lifecycle.
 */
interface LifecycleState {
  readonly initialized: boolean;
  readonly options: GalleryEventOptions | null;
  readonly handlers: EventHandlers | null;
  readonly keyListener: EventListener | null;
  readonly clickListener: EventListener | null;
  readonly listenerContext: string | null;
  readonly eventTarget: EventTarget | null;
}

/**
 * Default configuration for gallery event listeners.
 * Used when no explicit options are provided during initialization.
 */
const DEFAULT_GALLERY_EVENT_OPTIONS: GalleryEventOptions = {
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'gallery',
} as const;

/**
 * Initial state for lifecycle tracking.
 * Used to reset state during cleanup.
 */
const initialLifecycleState: Readonly<LifecycleState> = {
  initialized: false,
  options: null,
  handlers: null,
  keyListener: null,
  clickListener: null,
  listenerContext: null,
  eventTarget: null,
} as const;

/**
 * Mutable state tracking for the current gallery event lifecycle.
 * Updated during initialization and cleanup.
 */
let lifecycleState: LifecycleState = { ...initialLifecycleState };

/**
 * Sanitizes a context string by trimming and validating it.
 * Falls back to the default context if empty or undefined.
 *
 * @param context - The raw context string to sanitize
 * @returns The sanitized context string, never empty
 */
function sanitizeContext(context: string | undefined): string {
  const trimmed = context?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_GALLERY_EVENT_OPTIONS.context;
}

/**
 * Resolves initialization input to a normalized format.
 * Handles both HTMLElement root and partial options as input.
 *
 * @param optionsOrRoot - Either partial options or an HTMLElement root
 * @returns Resolved options and explicit root (if provided as HTMLElement)
 */
function resolveInitializationInput(
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Readonly<{
  options: GalleryEventOptions;
  root: HTMLElement | null;
}> {
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
    context: sanitizeContext(partial.context),
  };

  return {
    options: merged,
    root: null,
  };
}

/**
 * Resolves the event target for listener registration.
 * Prioritizes explicit root, then falls back to document.body or document.
 *
 * @param explicitRoot - An optional explicit root element
 * @returns The resolved event target
 */
function resolveEventTarget(explicitRoot: HTMLElement | null): EventTarget {
  return explicitRoot || document.body || document.documentElement || document;
}

/**
 * Initializes gallery event listeners.
 *
 * Automatically cleans up any previous initialization. Registers keyboard and click
 * handlers according to provided options. Returns a cleanup function for manual cleanup
 * if needed, though cleanup is also called automatically during re-initialization.
 *
 * @param handlers - Event handler callbacks (keyboard, click)
 * @param optionsOrRoot - Configuration options or an optional HTMLElement root for listener attachment
 * @returns A cleanup function that unregisters all listeners and resets state
 *
 * @throws No explicit errors, but logs warnings/errors in development mode
 *
 * @example
 * const cleanup = await initializeGalleryEvents(
 *   { keyboard: handleKey, click: handleClick },
 *   { enableKeyboard: true, enableMediaDetection: false }
 * );
 * // Later...
 * cleanup(); // Unregisters listeners
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Promise<() => void> {
  if (lifecycleState.initialized) {
    if (__DEV__) {
      logger.warn('[GalleryLifecycle] Already initialized, re-initializing');
    }
    cleanupGalleryEvents();
  }

  if (!handlers) {
    if (__DEV__) {
      logger.error('[GalleryLifecycle] Missing handlers');
    }
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

  if (__DEV__ && finalOptions.debugMode) {
    logger.debug('[GalleryEvents] Event listeners registered', {
      context: listenerContext,
    });
  }

  return () => {
    cleanupGalleryEvents();
  };
}

/**
 * Cleans up all gallery event listeners and resets internal state.
 *
 * Safe to call multiple times. Only performs cleanup if initialization was completed.
 * Resets keyboard debounce state and unregisters all listeners by context.
 *
 * @example
 * cleanupGalleryEvents(); // Safe even if not initialized
 */
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
