// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { logger } from '@shared/logging/logger';

/**
 * IntersectionObserver helper with automatic cleanup
 */
const observerRegistry = new WeakMap<Element, Set<IntersectionObserver>>();

export const SharedObserver = {
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): () => void {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        try {
          callback(entry);
        } catch (error) {
          __DEV__ && logger.warn('[SharedObserver] callback threw', error);
        }
      }
    }, options);

    observer.observe(element);

    let set = observerRegistry.get(element);
    if (!set) {
      set = new Set();
      observerRegistry.set(element, set);
    }
    set.add(observer);

    let isActive = true;

    return (): void => {
      if (!isActive) return;
      isActive = false;

      observer.unobserve(element);
      observer.disconnect();

      const currentSet = observerRegistry.get(element);
      if (currentSet) {
        currentSet.delete(observer);
        if (currentSet.size === 0) {
          observerRegistry.delete(element);
        }
      }
    };
  },

  unobserve(element: Element): void {
    const set = observerRegistry.get(element);
    if (!set || set.size === 0) return;

    for (const observer of set) {
      observer.disconnect();
    }
    observerRegistry.delete(element);
  },
};
