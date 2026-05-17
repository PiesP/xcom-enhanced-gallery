import { logger } from '@shared/logging/logger';
import { createId, createPrefixedId } from '@shared/utils/id/create-id';

interface ListenerContext {
  readonly id: string;
  readonly element: EventTarget;
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
  readonly context: string | undefined;
}

let _eventManagerInstance: EventManager | null = null;

export class EventManager {
  private readonly listeners = new Map<string, ListenerContext>();

  private constructor() {}

  public static getInstance(): EventManager {
    if (!_eventManagerInstance) _eventManagerInstance = new EventManager();
    return _eventManagerInstance;
  }

  /** @internal Test helper */
  public static resetForTests(): void {
    _eventManagerInstance?.cleanup();
    _eventManagerInstance = null;
  }

  public addEventListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions & { context?: string }
  ): string | null {
    const normalized = (options ?? {}) as AddEventListenerOptions & { context?: string };
    const { context, ...listenerOptions } = normalized;

    if (!element || typeof element.addEventListener !== 'function') {
      __DEV__ && logger.warn('[EventManager] Invalid element', { type, context });
      return null;
    }

    try {
      element.addEventListener(type, listener, listenerOptions);
      const id = context ? createPrefixedId(context) : createId();
      this.listeners.set(id, {
        id,
        element,
        type,
        listener,
        options: listenerOptions,
        context,
      });
      return id;
    } catch (error) {
      __DEV__ && logger.error('[EventManager] Failed to add listener', { type, context, error });
      return null;
    }
  }

  public removeListener(id: string): boolean {
    if (!this.listeners.has(id)) return false;
    return this.removeListenerById(id);
  }

  public removeByContext(context: string): number {
    const toRemove: string[] = [];
    for (const [id, ctx] of this.listeners) {
      if (ctx.context === context) toRemove.push(id);
    }
    let count = 0;
    for (const id of toRemove) {
      if (this.removeListenerById(id)) count++;
    }
    return count;
  }

  public getListenerStatus() {
    if (!__DEV__) return { total: 0, byContext: {}, byType: {} } as const;

    const byContext: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const ctx of this.listeners.values()) {
      const c = ctx.context || 'default';
      byContext[c] = (byContext[c] || 0) + 1;
      byType[ctx.type] = (byType[ctx.type] || 0) + 1;
    }
    return { total: this.listeners.size, byContext, byType };
  }

  public cleanup(): void {
    const entries = Array.from(this.listeners.entries());
    this.listeners.clear();
    for (const [, ctx] of entries) {
      try {
        ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
      } catch {
        /* ignored */
      }
    }
    __DEV__ && logger.debug('EventManager cleanup completed');
  }

  private removeListenerById(id: string): boolean {
    const ctx = this.listeners.get(id);
    if (!ctx) {
      __DEV__ && logger.warn('[EventManager] Listener not found', { id });
      return false;
    }
    try {
      ctx.element.removeEventListener(ctx.type, ctx.listener, ctx.options);
      this.listeners.delete(id);
      return true;
    } catch (error) {
      __DEV__ &&
        logger.error('[EventManager] Failed to remove listener', { id, type: ctx.type, error });
      return false;
    }
  }
}
