const observerPool = new Map<string, IntersectionObserver>();
let elementCallbackMap = new WeakMap<
  Element,
  Map<string, Map<number, (entry: IntersectionObserverEntry) => void>>
>();
let callbackIdCounter = 0;

const createObserverKey = (options: IntersectionObserverInit = {}): string => {
  const rootMargin = options.rootMargin ?? '0px';
  const threshold = Array.isArray(options.threshold)
    ? options.threshold.join(',')
    : `${options.threshold ?? 0}`;
  return `${rootMargin}|${threshold}`;
};

const getObserver = (key: string, options: IntersectionObserverInit): IntersectionObserver => {
  let observer = observerPool.get(key);
  if (observer) {
    return observer;
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const callbacksByKey = elementCallbackMap.get(entry.target as Element);
      const callbacks = callbacksByKey?.get(key);
      if (!callbacks || callbacks.size === 0) {
        return;
      }

      callbacks.forEach((cb) => {
        try {
          cb(entry);
        } catch {
          // Swallow errors to avoid interrupting other callbacks
        }
      });
    });
  }, options);

  observerPool.set(key, observer);
  return observer;
};

export const SharedObserver = {
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {},
  ): () => void {
    const key = createObserverKey(options);
    const observer = getObserver(key, options);

    let callbacksByKey = elementCallbackMap.get(element);
    if (!callbacksByKey) {
      callbacksByKey = new Map();
      elementCallbackMap.set(element, callbacksByKey);
    }

    let callbacks = callbacksByKey.get(key);
    if (!callbacks) {
      callbacks = new Map();
      callbacksByKey.set(key, callbacks);
    }

    const callbackId = ++callbackIdCounter;
    const isFirstForKey = callbacks.size === 0;
    callbacks.set(callbackId, callback);

    if (isFirstForKey) {
      observer.observe(element);
    }

    let isActive = true;

    const unsubscribe = () => {
      if (!isActive) {
        return;
      }
      isActive = false;

      const callbacksByKeyCurrent = elementCallbackMap.get(element);
      const callbacksForKey = callbacksByKeyCurrent?.get(key);

      callbacksForKey?.delete(callbackId);

      if (callbacksForKey && callbacksForKey.size === 0) {
        callbacksByKeyCurrent?.delete(key);
        observer.unobserve(element);
      }

      if (!callbacksByKeyCurrent || callbacksByKeyCurrent.size === 0) {
        elementCallbackMap.delete(element);
      }
    };

    return unsubscribe;
  },

  unobserve(element: Element) {
    const callbacksByKey = elementCallbackMap.get(element);
    if (!callbacksByKey) {
      return;
    }

    callbacksByKey.forEach((_callbacks, key) => {
      const observer = observerPool.get(key);
      observer?.unobserve(element);
    });

    elementCallbackMap.delete(element);
  },
};

// Test helper: Reset internal state for test isolation. Not intended for production use.
export function _resetSharedObserverForTests(): void {
  observerPool.clear();
  elementCallbackMap = new WeakMap();
  callbackIdCounter = 0;
}
