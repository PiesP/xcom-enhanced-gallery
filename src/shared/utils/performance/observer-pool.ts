import { logger } from '@shared/logging';

let didLogCallbackErrorInDev = false;

// Minimal implementation: create one IntersectionObserver per subscription.
// This avoids pooling/registry complexity and keeps the runtime small.
let observerRegistry = new WeakMap<Element, Set<IntersectionObserver>>();

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
          // Swallow errors to avoid interrupting other callbacks.
          // In DEV, log the first failure to improve observability without spamming.
          if (__DEV__ && !didLogCallbackErrorInDev) {
            didLogCallbackErrorInDev = true;
            logger.warn('[SharedObserver] IntersectionObserver callback threw', error);
          }
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

    const unsubscribe = () => {
      if (!isActive) {
        return;
      }
      isActive = false;

      try {
        observer.unobserve(element);
      } catch {
        // Ignore: unobserve should be best-effort.
      }

      try {
        observer.disconnect();
      } catch {
        // Ignore: disconnect should be best-effort.
      }

      const currentSet = observerRegistry.get(element);
      if (currentSet) {
        currentSet.delete(observer);
        if (currentSet.size === 0) {
          observerRegistry.delete(element);
        }
      }
    };

    return unsubscribe;
  },

  unobserve(element: Element) {
    const set = observerRegistry.get(element);
    if (!set || set.size === 0) {
      return;
    }

    for (const observer of set) {
      try {
        observer.disconnect();
      } catch {
        // Ignore: disconnect should be best-effort.
      }
    }

    observerRegistry.delete(element);
  },
};

// Test helper: Reset internal state for test isolation. Not intended for production use.
function _resetSharedObserverForTests(): void {
  observerRegistry = new WeakMap();
  didLogCallbackErrorInDev = false;
}
