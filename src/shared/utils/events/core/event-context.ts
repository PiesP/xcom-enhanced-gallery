/**
 * @fileoverview Event handler and context type definitions
 * @description Phase 329: File separation (SRP compliance)
 *              Type definitions separated from events.ts
 */

/**
 * Event listener context
 * Metadata tracking of registered listeners
 */
export interface EventContext {
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
