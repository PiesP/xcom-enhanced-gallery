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
  readonly id: string;
  readonly element: EventTarget;
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions | undefined;
  readonly context?: string | undefined;
}

/**
 * Event handling result
 */
export interface EventHandlingResult {
  readonly handled: boolean;
  readonly reason?: string;
}

/**
 * Gallery event handler interface
 */
export interface EventHandlers {
  readonly onMediaClick: (element: HTMLElement, event: MouseEvent) => Promise<void>;
  readonly onGalleryClose: () => void;
  readonly onKeyboardEvent?: (event: KeyboardEvent) => void;
}

/**
 * Gallery event options
 */
export interface GalleryEventOptions {
  readonly enableKeyboard: boolean;
  readonly enableMediaDetection: boolean;
  readonly debugMode: boolean;
  readonly preventBubbling: boolean;
  readonly context: string;
}
