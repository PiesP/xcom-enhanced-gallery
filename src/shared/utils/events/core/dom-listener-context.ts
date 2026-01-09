/**
 * @fileoverview DOM listener context and event handler types
 * @description Types for internal listener registry and gallery event management.
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
 * Gallery event handler callback signatures.
 */
export interface EventHandlers {
  readonly onMediaClick: (element: HTMLElement, event: MouseEvent) => Promise<void>;
  readonly onGalleryClose: () => void;
  readonly onKeyboardEvent?: (event: KeyboardEvent) => void;
}

/**
 * Gallery event configuration.
 */
export interface GalleryEventOptions {
  readonly enableKeyboard: boolean;
  readonly enableMediaDetection: boolean;
  readonly debugMode: boolean;
  readonly preventBubbling: boolean;
  readonly context: string;
}

/**
 * Media click handling result.
 */
export interface EventHandlingResult {
  readonly handled: boolean;
  readonly reason?: string;
}
