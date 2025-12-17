import { logger } from '@shared/logging';

type PooledObserverEntry = {
  readonly observer: IntersectionObserver;
  /** Number of elements currently observed by this observer key. */
  activeElements: number;
};

const observerPool = new Map<string, PooledObserverEntry>();
let elementCallbackMap = new WeakMap<
  Element,
  Map<string, Map<number, (entry: IntersectionObserverEntry) => void>>
>();
let callbackIdCounter = 0;

let didLogCallbackErrorInDev = false;

// Root identity tracking for stable observer keys without preventing GC.
// IntersectionObserverInit.root can be an Element, a Document, or null/undefined.
let rootIdCounter = 0;
let rootIdMap = new WeakMap<object, number>();

function getRootKey(root: IntersectionObserverInit['root']): string {
  if (!root) {
    return 'root:null';
  }

  const rootObject = root as unknown as object;
  const existing = rootIdMap.get(rootObject);
  if (existing) {
    return `root:${existing}`;
  }

  const id = ++rootIdCounter;
  rootIdMap.set(rootObject, id);
  return `root:${id}`;
}

const createObserverKey = (options: IntersectionObserverInit = {}): string => {
  const rootKey = getRootKey(options.root ?? null);
  const rootMargin = options.rootMargin ?? '0px';
  const threshold = Array.isArray(options.threshold)
    ? options.threshold.join(',')
    : `${options.threshold ?? 0}`;
  return `${rootKey}|${rootMargin}|${threshold}`;
};

const getObserverEntry = (key: string, options: IntersectionObserverInit): PooledObserverEntry => {
  const existing = observerPool.get(key);
  if (existing) {
    return existing;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const callbacksByKey = elementCallbackMap.get(entry.target as Element);
      const callbacks = callbacksByKey?.get(key);
      if (!callbacks || callbacks.size === 0) {
        return;
      }

      callbacks.forEach((cb) => {
        try {
          cb(entry);
        } catch (error) {
          // Swallow errors to avoid interrupting other callbacks.
          // In DEV, log the first failure to improve observability without spamming.
          if (__DEV__ && !didLogCallbackErrorInDev) {
            didLogCallbackErrorInDev = true;
            logger.warn('[SharedObserver] IntersectionObserver callback threw', error);
          }
        }
      });
    });
  }, options);

  const entry: PooledObserverEntry = { observer, activeElements: 0 };
  observerPool.set(key, entry);
  return entry;
};

function releaseObserverIfIdle(key: string): void {
  const entry = observerPool.get(key);
  if (!entry) return;
  if (entry.activeElements > 0) return;

  try {
    entry.observer.disconnect();
  } catch {
    // Ignore: disconnect should be best-effort.
  }
  observerPool.delete(key);
}

export const SharedObserver = {
  observe(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): () => void {
    const key = createObserverKey(options);
    const entry = getObserverEntry(key, options);
    const observer = entry.observer;

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
      entry.activeElements += 1;
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

        // The element is no longer observed for this key.
        const pooled = observerPool.get(key);
        if (pooled) {
          pooled.activeElements = Math.max(0, pooled.activeElements - 1);
          releaseObserverIfIdle(key);
        }
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
      const entry = observerPool.get(key);
      entry?.observer.unobserve(element);

      if (entry) {
        entry.activeElements = Math.max(0, entry.activeElements - 1);
        releaseObserverIfIdle(key);
      }
    });

    elementCallbackMap.delete(element);
  },
};

// Test helper: Reset internal state for test isolation. Not intended for production use.
export function _resetSharedObserverForTests(): void {
  observerPool.clear();
  elementCallbackMap = new WeakMap();
  callbackIdCounter = 0;
  rootIdCounter = 0;
  rootIdMap = new WeakMap();
  didLogCallbackErrorInDev = false;
}
