// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { logger } from '@shared/logging/logger';
import { createSingleton } from '@shared/services/singleton-base';
import { createId, createPrefixedId } from '@shared/utils/id';

/** @fileoverview Event types for gallery event handling. */

export interface EventHandlers {
  readonly onMediaClick: (element: HTMLElement, event: MouseEvent) => Promise<void>;
  readonly onGalleryClose: () => void;
  readonly onKeyboardEvent?: (event: KeyboardEvent) => void;
}

export interface GalleryEventOptions {
  readonly enableKeyboard: boolean;
  readonly enableMediaDetection: boolean;
  readonly debugMode: boolean;
  readonly preventBubbling: boolean;
  readonly context: string;
}

interface ListenerContext {
  readonly id: string;
  readonly element: EventTarget;
  readonly type: string;
  readonly listener: EventListener;
  readonly options?: boolean | AddEventListenerOptions;
  readonly context: string | undefined;
}

/** Composite key for duplicate detection: `${type}::${element}::${listenerRef}` */
function makeCompositeKey(element: EventTarget, type: string, listener: EventListener): string {
  return `${type}::${String(Object(element))}::${String(listener)}`;
}

export class EventManager {
  private readonly listeners = new Map<string, ListenerContext>();
  // Composite key for O(1) duplicate detection: `${type}::${element}::${listenerRef}`
  private readonly listenerKeys = new Map<string, Set<string>>();

  constructor() {}

  /** Destroy service */
  public destroy(): void {
    this.cleanup();
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

    if (typeof listener !== 'function') {
      __DEV__ && logger.warn('[EventManager] Listener must be a function', { type, context });
      return null;
    }

    // M7: Use composite key (element, type, listener) to correctly detect
    // duplicates across different elements.
    const compositeKey = makeCompositeKey(element, type, listener);
    const typeKeys = this.listenerKeys.get(type);
    if (typeKeys?.has(compositeKey)) {
      __DEV__ && logger.warn('[EventManager] Duplicate listener skipped', { type, context });
      return null;
    }

    // L12: Check for already-aborted signal before adding tracking entry.
    // If the signal is already aborted, native addEventListener won't register
    // the listener, so we should not track it either.
    const signal = (listenerOptions as { signal?: AbortSignal }).signal;
    if (signal?.aborted) {
      __DEV__ &&
        logger.warn('[EventManager] Signal already aborted, skipping listener', {
          type,
          context,
        });
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
      // Track composite key for O(1) duplicate detection
      if (!this.listenerKeys.has(type)) {
        this.listenerKeys.set(type, new Set());
      }
      this.listenerKeys.get(type)!.add(compositeKey);

      // M6: Listen for abort on the signal to clean up tracking entries
      // when the signal fires and the DOM auto-removes the listener.
      if (signal) {
        const onSignalAbort = (): void => {
          signal.removeEventListener('abort', onSignalAbort);
          this.listeners.delete(id);
          const keys = this.listenerKeys.get(type);
          if (keys) {
            keys.delete(compositeKey);
            if (keys.size === 0) this.listenerKeys.delete(type);
          }
        };
        signal.addEventListener('abort', onSignalAbort);
      }

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

  public getListenerStatus(): number {
    return this.listeners.size;
  }

  public cleanup(): void {
    const entries = Array.from(this.listeners.entries());
    this.listeners.clear();
    this.listenerKeys.clear();
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
      // Clean up duplicate-detection index
      const compositeKey = makeCompositeKey(ctx.element, ctx.type, ctx.listener);
      const typeKeys = this.listenerKeys.get(ctx.type);
      if (typeKeys) {
        typeKeys.delete(compositeKey);
        if (typeKeys.size === 0) this.listenerKeys.delete(ctx.type);
      }
      return true;
    } catch (error) {
      __DEV__ &&
        logger.error('[EventManager] Failed to remove listener', { id, type: ctx.type, error });
      return false;
    }
  }
}

const { getInstance: getEventManager, resetForTests: resetEventManagerForTests } = createSingleton(
  () => new EventManager()
);

export { getEventManager, resetEventManagerForTests };
