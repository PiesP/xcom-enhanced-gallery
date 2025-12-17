/**
 * @fileoverview DOM listener context type definitions
 * @description Types used by the internal listener registry.
 *
 * Note: This file exists to avoid name collisions with
 * `@shared/events/event-context.ts` (app-level subscriptions).
 */

/**
 * DOM listener context
 * Metadata tracking of registered DOM event listeners.
 */
export interface DOMListenerContext {
  id: string;
  element: EventTarget;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions | undefined;
  context?: string | undefined;
  created: number;
}

/**
 * Event handling result
 */
export interface EventHandlingResult {
  handled: boolean;
  reason?: string;
}

/**
 * Gallery event handler interface
 */
export interface EventHandlers {
  onMediaClick: (element: HTMLElement, event: MouseEvent) => Promise<void>;
  onGalleryClose: () => void;
  onKeyboardEvent?: (event: KeyboardEvent) => void;
}

/**
 * Gallery event options
 */
export interface GalleryEventOptions {
  enableKeyboard: boolean;
  enableMediaDetection: boolean;
  debugMode: boolean;
  preventBubbling: boolean;
  context: string;
}

/**
 * Gallery event state snapshot
 */
export interface GalleryEventSnapshot {
  initialized: boolean;
  listenerCount: number;
  options: GalleryEventOptions | null;
  hasHandlers: boolean;
  hasScopedTarget: boolean;
}
