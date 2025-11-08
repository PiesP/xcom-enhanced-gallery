/**
 * @fileoverview Event listener registry
 * @description Phase 329: File separation (SRP compliance)
 *              listeners Map and state management separated to a dedicated module
 */

import { logger } from '@shared/logging';
import type { EventContext } from './event-context';

/**
 * Track all registered event listeners
 * Supports listener removal by context, status queries, etc.
 */
class ListenerRegistry {
  private static instance: ListenerRegistry | null = null;
  private readonly listeners = new Map<string, EventContext>();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ListenerRegistry {
    if (!ListenerRegistry.instance) {
      ListenerRegistry.instance = new ListenerRegistry();
    }
    return ListenerRegistry.instance;
  }

  /**
   * Register listener
   */
  register(id: string, context: EventContext): void {
    this.listeners.set(id, context);
    logger.debug(`[ListenerRegistry] Listener registered: ${id}`, {
      type: context.type,
      context: context.context,
    });
  }

  /**
   * Get listener
   */
  get(id: string): EventContext | undefined {
    return this.listeners.get(id);
  }

  /**
   * Unregister listener
   */
  unregister(id: string): boolean {
    const context = this.listeners.get(id);
    if (!context) {
      logger.warn(`[ListenerRegistry] Listener not found: ${id}`);
      return false;
    }

    this.listeners.delete(id);
    logger.debug(`[ListenerRegistry] Listener unregistered: ${id}`, {
      type: context.type,
    });
    return true;
  }

  /**
   * Remove listeners by context
   */
  unregisterByContext(context: string): number {
    let removedCount = 0;
    for (const [id, eventContext] of this.listeners.entries()) {
      if (eventContext.context === context) {
        this.listeners.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`[ListenerRegistry] Removed ${removedCount} listeners for context: ${context}`);
    }
    return removedCount;
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    const count = this.listeners.size;
    this.listeners.clear();
    logger.debug(`[ListenerRegistry] Cleared all ${count} listeners`);
  }

  /**
   * Get listener status
   */
  getStatus() {
    const contextGroups = new Map<string, number>();
    const typeGroups = new Map<string, number>();

    for (const eventContext of this.listeners.values()) {
      const ctx = eventContext.context || 'default';
      contextGroups.set(ctx, (contextGroups.get(ctx) || 0) + 1);
      typeGroups.set(eventContext.type, (typeGroups.get(eventContext.type) || 0) + 1);
    }

    return {
      total: this.listeners.size,
      byContext: Object.fromEntries(contextGroups),
      byType: Object.fromEntries(typeGroups),
      listeners: Array.from(this.listeners.values()).map(ctx => ({
        id: ctx.id,
        type: ctx.type,
        context: ctx.context,
        created: ctx.created,
      })),
    };
  }

  /**
   * Total listener count
   */
  size(): number {
    return this.listeners.size;
  }

  /**
   * Iterate all listeners
   */
  forEach(callback: (context: EventContext, id: string) => void): void {
    for (const [id, context] of this.listeners.entries()) {
      callback(context, id);
    }
  }
}

export const listenerRegistry = ListenerRegistry.getInstance();
