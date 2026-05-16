/**
 * @fileoverview Event Manager — singleton managing DOM event listener registration,
 * context-based cleanup, and lifecycle integration.
 */

import { logger } from '@shared/logging/logger';
import { createId, createPrefixedId } from '@shared/utils/id/create-id';

// ============================================================================
// Internal listener registry
// ============================================================================

interface ListenerContext {
  readonly id: string;
  readonly element: EventTarget;
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
  readonly context: string | undefined;
}

// ============================================================================
// EventManager
// ============================================================================

let _eventManagerInstance: EventManager | null = null;

/**
 * Singleton EventManager with context-based listener grouping.
 */
export class EventManager {
  private readonly listeners = new Map<string, ListenerContext>();

  private constructor() {}

  /** Get singleton instance */
  public static getInstance(): EventManager {
    if (!_eventManagerInstance) _eventManagerInstance = new EventManager();
    return _eventManagerInstance;
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    _eventManagerInstance?.cleanup();
    _eventManagerInstance = null;
  }

  /**
   * Add event listener with tracking and optional context for grouping.
   */
  public addEventListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions & { context?: string }
  ): string | null {
    const normalized = (options ?? {}) as AddEventListenerOptions & { context?: string };
    const { context, ...listenerOptions } = normalized;

    if (!element || typeof element.addEventListener !== 'function') {
      if (__DEV__) {
        logger.warn('[EventManager] Invalid element for addEventListener', { type, context });
      }
      return null;
    }

    try {
      element.addEventListener(type, listener, listenerOptions);

      const id = context ? createPrefixedId(context) : createId();

      const ctx: ListenerContext = {
        id,
        element,
        type,
        listener,
        options: listenerOptions,
        context,
      };
      this.listeners.set(id, ctx);

      return id;
    } catch (error) {
      if (__DEV__) {
        logger.error('[EventManager] Failed to add listener', { type, context, error });
      }
      return null;
    }
  }

  /**
   * Remove event listener by ID.
   */
  public removeListener(id: string): boolean {
    if (!this.listeners.has(id)) {
      return false;
    }

    return this.removeListenerById(id);
  }

  /**
   * Remove all listeners matching a context.
   */
  public removeByContext(context: string): number {
    const toRemove: string[] = [];
    for (const [id, ctx] of this.listeners) {
      if (ctx.context === context) {
        toRemove.push(id);
      }
    }

    let count = 0;
    for (const id of toRemove) {
      if (this.removeListenerById(id)) {
        count++;
      }
    }

    return count;
  }

  /** Get listener statistics (dev only) */
  public getListenerStatus() {
    if (!__DEV__) {
      return { total: 0, byContext: {}, byType: {} } as const;
    }

    const byContext: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const ctx of this.listeners.values()) {
      const c = ctx.context || 'default';
      byContext[c] = (byContext[c] || 0) + 1;
      byType[ctx.type] = (byType[ctx.type] || 0) + 1;
    }

    return { total: this.listeners.size, byContext, byType };
  }

  /** Clean up all listeners */
  public cleanup(): void {
    const entries = Array.from(this.listeners.entries());
    this.listeners.clear();

    for (const [_id, ctx] of entries) {
      try {
        ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
      } catch {
        /* ignored during cleanup */
      }
    }

    if (__DEV__) {
      logger.debug('EventManager cleanup completed');
    }
  }

  /**
   * Remove a listener from the registry and DOM by ID.
   */
  private removeListenerById(id: string): boolean {
    const ctx = this.listeners.get(id);
    if (!ctx) {
      if (__DEV__) {
        logger.warn('[EventManager] Listener not found for removal', { id });
      }
      return false;
    }

    try {
      ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
      this.listeners.delete(id);
      return true;
    } catch (error) {
      if (__DEV__) {
        logger.error('[EventManager] Failed to remove listener', { id, type: ctx.type, error });
      }
      return false;
    }
  }
}
