/**
 * @fileoverview Simplified event listener manager
 * @description Manages DOM event listener registration, tracking, and cleanup.
 *              Provides context-based grouping for batch removal.
 *
 * @internal This module is an internal implementation detail of EventManager.
 *           External code should use EventManager from @shared/services/event-manager
 *           for unified event management with proper lifecycle support.
 *           DO NOT USE THIS MODULE DIRECTLY - use EventManager instead.
 *
 * @see {@link EventManager} for the public API
 */

import { logger } from '@shared/logging/logger';
import { createId, createPrefixedId } from '@shared/utils/id/create-id';
import type { DOMListenerContext } from './dom-listener-context';

// ============================================================================
// Internal Listener Registry
// ============================================================================

/** Internal listener storage - tracks all registered event listeners */
const listeners = new Map<string, DOMListenerContext>();

/** Generate unique listener ID */
function generateListenerId(ctx?: string): string {
  return ctx ? createPrefixedId(ctx, ':') : createId();
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
 *
 * @throws Nothing - errors are logged and listener ID returned
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
    if (__DEV__) {
      logger.warn('[listener-manager] Invalid element for addEventListener', {
        type,
        context,
      });
    }
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

    if (__DEV__) {
      logger.debug(`[listener-manager] Listener registered: ${type} (${id})`, {
        context,
      });
    }
    return id;
  } catch (error) {
    if (__DEV__) {
      logger.error('[listener-manager] Failed to add listener', {
        type,
        context,
        error,
      });
    }
    return id;
  }
}

/**
 * Remove event listener by ID
 *
 * @param id - Listener ID from addListener
 * @returns true if removed, false if not found
 *
 * @throws Nothing - errors are logged and false returned
 */
export function removeEventListenerManaged(id: string): boolean {
  const ctx = listeners.get(id);
  if (!ctx) {
    if (__DEV__) {
      logger.warn('[listener-manager] Listener not found for removal', { id });
    }
    return false;
  }

  try {
    ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
    listeners.delete(id);

    if (__DEV__) {
      logger.debug(`[listener-manager] Listener removed: ${ctx.type} (${id})`);
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      logger.error('[listener-manager] Failed to remove listener', {
        id,
        type: ctx.type,
        error,
      });
    }
    return false;
  }
}

/**
 * Get listener statistics
 */
export function getEventListenerStatus() {
  if (!__DEV__) {
    return { total: 0, byContext: {}, byType: {} } as const;
  }

  const byContext: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const ctx of listeners.values()) {
    const c = ctx.context || 'default';
    byContext[c] = (byContext[c] || 0) + 1;
    byType[ctx.type] = (byType[ctx.type] || 0) + 1;
  }

  return { total: listeners.size, byContext, byType };
}
