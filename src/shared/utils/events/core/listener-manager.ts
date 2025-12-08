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

import { logger } from '@shared/logging';
import type { EventContext } from './event-context';

// ============================================================================
// Internal Listener Registry
// ============================================================================

/** Internal listener storage - tracks all registered event listeners */
const listeners = new Map<string, EventContext>();

/** Generate unique listener ID */
function generateListenerId(ctx?: string): string {
  const r = Math.random().toString(36).slice(2, 11);
  return ctx ? `${ctx}:${r}` : r;
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
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string {
  const id = generateListenerId(context);

  if (!element || typeof element.addEventListener !== 'function') {
    logger.warn('Invalid element passed to addListener', { type, context });
    return id;
  }

  try {
    element.addEventListener(type, listener, options);

    const eventContext: EventContext = {
      id,
      element,
      type,
      listener,
      options,
      context,
      created: Date.now(),
    };

    listeners.set(id, eventContext);
    logger.debug(`Listener registered: ${type} (${id})`, { context });
    return id;
  } catch (error) {
    logger.error(`Failed to add listener: ${type}`, { error, context });
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
    logger.warn(`Listener not found for removal: ${id}`);
    return false;
  }

  try {
    ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
    listeners.delete(id);
    logger.debug(`Listener removed: ${ctx.type} (${id})`);
    return true;
  } catch (error) {
    logger.error(`Failed to remove listener: ${id}`, error);
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

  if (count > 0) {
    logger.debug(`Removed ${count} listeners for context: ${context}`);
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

  let count = 0;
  for (const ctx of all) {
    try {
      ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
      count++;
    } catch (error) {
      logger.warn(`Failed to remove listener: ${ctx.type}`, { error, context: ctx.context });
    }
  }

  logger.debug(`Removed all ${count} listeners`);
}

/**
 * Get listener statistics
 */
export function getEventListenerStatus() {
  const byContext: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const ctx of listeners.values()) {
    const c = ctx.context || 'default';
    byContext[c] = (byContext[c] || 0) + 1;
    byType[ctx.type] = (byType[ctx.type] || 0) + 1;
  }

  return { total: listeners.size, byContext, byType };
}

// ============================================================================
// Test Utilities
// ============================================================================

/** @internal Check if listener exists */
export function __testHasListener(id: string): boolean {
  return listeners.has(id);
}

/** @internal Get listener context */
export function __testGetListener(id: string): EventContext | undefined {
  return listeners.get(id);
}

/** @internal Unregister without DOM removal */
export function __testRegistryUnregister(id: string): boolean {
  return listeners.delete(id);
}
