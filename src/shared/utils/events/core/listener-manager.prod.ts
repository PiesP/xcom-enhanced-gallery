/**
 * @fileoverview Simplified event listener manager
 * @description Manages DOM event listener registration, tracking, and cleanup.
 *              Provides context-based grouping for batch removal.
 *
 * @internal This module is an internal implementation detail of EventManager.
 *           External code should use EventManager from @shared/services/event-manager
 *           for unified event management with proper lifecycle support.
 *
 * @see {@link EventManager} for the public API
 */

import { createContextId, createId } from '@shared/utils/id/create-id';
import type { DOMListenerContext } from './dom-listener-context';

// ============================================================================
// Internal Listener Registry
// ============================================================================

/** Internal listener storage - tracks all registered event listeners */
const listeners = new Map<string, DOMListenerContext>();

/** Generate unique listener ID */
function generateListenerId(ctx?: string): string {
  return ctx ? createContextId(ctx) : createId();
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Add event listener with tracking
 *
 * @param element - Target element
 * @param type - Event type
 * @param listener - Event handler
 * @param options - Listener options (passive, capture, once)
 * @param context - Context string for grouping (e.g., 'gallery-keyboard')
 * @returns Listener ID for removal
 */
export function addListener(
  element: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
  context?: string
): string {
  const id = generateListenerId(context);

  if (!element || typeof element.addEventListener !== 'function') {
    return id;
  }

  try {
    element.addEventListener(type, listener, options);

    const listenerContext: DOMListenerContext = {
      id,
      element,
      type,
      listener,
      options,
      context,
    };

    listeners.set(id, listenerContext);
    return id;
  } catch {
    return id;
  }
}

/**
 * Remove event listener by ID
 *
 * @param id - Listener ID from addListener
 * @returns true if removed, false if not found
 */
export function removeEventListenerManaged(id: string): boolean {
  const ctx = listeners.get(id);
  if (!ctx) {
    return false;
  }

  try {
    ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
    listeners.delete(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove all listeners matching a context
 *
 * @param context - Context string to match
 * @returns Number of removed listeners
 */
export function removeEventListenersByContext(context: string): number {
  const toRemove: string[] = [];

  for (const [id, ctx] of listeners) {
    if (ctx.context === context) {
      toRemove.push(id);
    }
  }

  let count = 0;
  for (const id of toRemove) {
    if (removeEventListenerManaged(id)) {
      count++;
    }
  }

  return count;
}

/**
 * Remove all tracked listeners
 */
export function removeAllEventListeners(): void {
  if (listeners.size === 0) {
    return;
  }

  const all = Array.from(listeners.values());
  listeners.clear();

  for (const ctx of all) {
    try {
      ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
    } catch {}
  }
}
