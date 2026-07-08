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

/** Map from serialized options → shared observer + per-element callbacks. */
const observerPool = new Map<
  string,
  {
    readonly observer: IntersectionObserver;
    readonly callbacks: WeakMap<Element, (entry: IntersectionObserverEntry) => void>;
    readonly refCount: Map<Element, number>; // one element can be observed multiple times
  }
>();

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

/** Reset the shared observer pool — clears all observers for test isolation. */
export function resetSharedObserverPool(): void {
  for (const poolEntry of observerPool.values()) {
    poolEntry.observer.disconnect();
  }
  observerPool.clear();
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
      const callbacks = new WeakMap<Element, (entry: IntersectionObserverEntry) => void>();
      const refCount = new Map<Element, number>();

      const observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          // MED-3: Auto-cleanup disconnected elements in observer callback.
          // If element was removed from DOM without dispose(), remove it here.
          const isConnected = e.target.isConnected;
          if (!isConnected) {
            callbacks.delete(e.target);
            refCount.delete(e.target);
            // Don't call unobserve — the observer itself will stop tracking it.
            continue;
          }
          const cb = callbacks.get(e.target);
          if (cb) {
            try {
              cb(e);
            } catch (error) {
              __DEV__ && logger.warn('[SharedObserver] callback threw', error);
            }
          }
        }
      }, options);

      entry = { observer, callbacks, refCount };
      observerPool.set(key, entry);
    }

    const alreadyTracked = entry.callbacks.has(element);

    entry.callbacks.set(element, callback);
    entry.refCount.set(element, (entry.refCount.get(element) ?? 0) + 1);

    if (!alreadyTracked) {
      entry.observer.observe(element);
    }

    let disposed = false;

    return (): void => {
      if (disposed) return;
      disposed = true;

      const poolEntry = observerPool.get(key);
      if (!poolEntry) return;

      // Decrement ref count; if this element is still observed by another caller, keep it
      const count = (poolEntry.refCount.get(element) ?? 1) - 1;
      if (count <= 0) {
        // Last disposer for this element — actually unobserve
        poolEntry.callbacks.delete(element);
        poolEntry.refCount.delete(element);
        poolEntry.observer.unobserve(element);
      } else {
        poolEntry.refCount.set(element, count);
        // Remaining callers still track this element — do NOT re-observe
        // (the observer is already tracking it).
      }

      // If no more elements tracked by this observer, clean it up
      if (poolEntry.refCount.size === 0) {
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
      for (const element of poolEntry.refCount.keys()) {
        if (!element.isConnected) {
          stale.push(element);
        }
      }
      // Remove stale elements
      for (const element of stale) {
        poolEntry.callbacks.delete(element);
        poolEntry.refCount.delete(element);
        poolEntry.observer.unobserve(element);
        cleaned++;
      }
      // Remove empty observers from the pool
      if (poolEntry.refCount.size === 0) {
        poolEntry.observer.disconnect();
        observerPool.delete(key);
      }
    }
    return cleaned;
  },
};
