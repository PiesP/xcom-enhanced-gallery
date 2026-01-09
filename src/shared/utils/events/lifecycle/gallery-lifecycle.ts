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
 * Default configuration for gallery event listeners.
 */
const DEFAULT_GALLERY_EVENT_OPTIONS = {
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'gallery',
} as const satisfies GalleryEventOptions;

/**
 * Minimal state tracking for gallery event lifecycle.
 */
interface LifecycleState {
  readonly initialized: boolean;
  readonly context: string | null;
}

/**
 * Mutable state for the current lifecycle.
 */
let lifecycleState: LifecycleState = { initialized: false, context: null };

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
 * Resolves initialization input to normalized format.
 * Handles both HTMLElement root and partial options.
 *
 * @param optionsOrRoot - Either partial options or an HTMLElement root
 * @returns Resolved options and root
 */
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

/**
 * Resolves the event target for listener registration.
 *
 * @param explicitRoot - An optional explicit root element
 * @returns The resolved event target
 */
function resolveEventTarget(explicitRoot: HTMLElement | null): EventTarget {
  return explicitRoot || document.body || document.documentElement || document;
}

/**
 * Registers event listeners with the EventManager.
 *
 * @param eventManager - EventManager instance
 * @param target - Event target
 * @param handlers - Event handler callbacks
 * @param options - Configuration options
 * @param context - Listener context
 */
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
    eventManager.addListener(target, 'keydown', keyHandler, listenerOptions, context);
  }

  if (options.enableMediaDetection) {
    const clickHandler: EventListener = async (evt: Event) => {
      await handleMediaClick(evt as MouseEvent, handlers, options);
    };
    eventManager.addListener(target, 'click', clickHandler, listenerOptions, context);
  }
}

/**
 * Initializes gallery event listeners.
 *
 * Automatically cleans up any previous initialization. Registers keyboard and click
 * handlers according to provided options. Returns a cleanup function.
 *
 * @param handlers - Event handler callbacks (keyboard, click)
 * @param optionsOrRoot - Configuration options or an optional HTMLElement root
 * @returns A cleanup function that unregisters all listeners and resets state
 *
 * @example
 * const cleanup = await initializeGalleryEvents(
 *   { onMediaClick: handleClick, onGalleryClose: handleClose },
 *   { enableKeyboard: true }
 * );
 * cleanup(); // Unregisters listeners
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  optionsOrRoot?: Partial<GalleryEventOptions> | HTMLElement
): Promise<() => void> {
  if (lifecycleState.initialized) {
    if (__DEV__) {
      logger.warn('[GalleryLifecycle] Re-initializing, cleaning up previous listeners');
    }
    cleanupGalleryEvents();
  }

  if (!handlers) {
    if (__DEV__) {
      logger.error('[GalleryLifecycle] Missing handlers');
    }
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
  if (!lifecycleState.initialized) return;

  if (lifecycleState.context) {
    EventManager.getInstance().removeByContext(lifecycleState.context);
  }

  resetKeyboardDebounceState();
  lifecycleState = { initialized: false, context: null };
}
