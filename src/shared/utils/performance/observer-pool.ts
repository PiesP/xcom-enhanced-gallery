// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { logger } from '@shared/logging/logger';

/**
 * True shared IntersectionObserver pool — keyed by options.
 *
 * Before: each `observe()` call created a NEW `IntersectionObserver` instance,
 * resulting in N+V observers per gallery open (one per item + one per video).
 *
 * After: observers are pooled by serialized options. Only one observer exists
 * per unique configuration, regardless of how many elements are observed.
 * For this project: 2 unique configs → exactly 2 observers (not N+V).
 */

type ObserverCallback = (entry: IntersectionObserverEntry) => void;

interface ObserverPoolEntry {
  readonly observer: IntersectionObserver;
  readonly callbacks: Map<Element, Map<number, ObserverCallback>>;
  nextSubscriptionId: number;
}

/** Map from serialized options → shared observer + per-element subscriptions. */
const observerPool = new Map<string, ObserverPoolEntry>();

/** Serialize options into a stable key (sorted keys for determinism). */
function optionsKey(options: IntersectionObserverInit): string {
  // root is always null (viewport) in this codebase; omit it to keep keys simple
  const threshold = options.threshold;
  const rootMargin = options.rootMargin ?? '0px';
  const t =
    typeof threshold === 'number'
      ? threshold
      : Array.isArray(threshold)
        ? threshold.join(',')
        : '0';
  return `t:${t}|m:${rootMargin}`;
}

export const SharedObserver = {
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): () => void {
    const key = optionsKey(options);

    let entry = observerPool.get(key);
    if (!entry) {
      const callbacks = new Map<Element, Map<number, ObserverCallback>>();

      const observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          // MED-3: Auto-cleanup disconnected elements in observer callback.
          // If element was removed from DOM without dispose(), remove it here.
          const isConnected = e.target.isConnected;
          if (!isConnected) {
            callbacks.delete(e.target);
            observer.unobserve(e.target);
            if (callbacks.size === 0) {
              observer.disconnect();
              const currentEntry = observerPool.get(key);
              if (currentEntry?.observer === observer) observerPool.delete(key);
            }
            continue;
          }
          const targetCallbacks = callbacks.get(e.target);
          if (!targetCallbacks) continue;
          for (const cb of [...targetCallbacks.values()]) {
            try {
              cb(e);
            } catch (error) {
              __DEV__ && logger.warn('[SharedObserver] callback threw', error);
            }
          }
        }
      }, options);

      entry = { observer, callbacks, nextSubscriptionId: 0 };
      observerPool.set(key, entry);
    }

    const observedEntry = entry;
    let targetCallbacks = observedEntry.callbacks.get(element);
    if (!targetCallbacks) {
      targetCallbacks = new Map<number, ObserverCallback>();
      observedEntry.callbacks.set(element, targetCallbacks);
      observedEntry.observer.observe(element);
    }
    const subscriptionId = observedEntry.nextSubscriptionId++;
    targetCallbacks.set(subscriptionId, callback);

    let disposed = false;

    return (): void => {
      if (disposed) return;
      disposed = true;

      const poolEntry = observerPool.get(key);
      if (poolEntry !== observedEntry) return;

      const currentCallbacks = poolEntry.callbacks.get(element);
      if (!currentCallbacks) return;
      currentCallbacks.delete(subscriptionId);
      if (currentCallbacks.size === 0) {
        // Last disposer for this element — actually unobserve
        poolEntry.callbacks.delete(element);
        poolEntry.observer.unobserve(element);
      }

      // If no more elements tracked by this observer, clean it up
      if (poolEntry.callbacks.size === 0) {
        poolEntry.observer.disconnect();
        observerPool.delete(key);
      }
    };
  },

  /**
   * MED-3: Garbage collect stale observer pool entries.
   *
   * Iterates all pool entries and removes elements that have been
   * disconnected from the DOM. If an observer ends up with zero
   * tracked elements, it is fully disconnected and removed from the pool.
   *
   * Call this when closing a gallery session (e.g. on overlay close)
   * to prevent accumulation of stale entries across sessions.
   */
  gc(): number {
    let cleaned = 0;
    for (const [key, poolEntry] of observerPool) {
      // Collect elements that are no longer connected
      const stale: Element[] = [];
      for (const element of poolEntry.callbacks.keys()) {
        if (!element.isConnected) {
          stale.push(element);
        }
      }
      // Remove stale elements
      for (const element of stale) {
        poolEntry.callbacks.delete(element);
        poolEntry.observer.unobserve(element);
        cleaned++;
      }
      // Remove empty observers from the pool
      if (poolEntry.callbacks.size === 0) {
        poolEntry.observer.disconnect();
        observerPool.delete(key);
      }
    }
    return cleaned;
  },
};
