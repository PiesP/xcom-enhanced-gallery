/**
 * Controller interface for lazy singleton accessors.
 * Provides get() plus dev-only peek() and reset() methods.
 * @template T - The singleton type
 */
export interface SingletonController<T> {
  /** Get or create the singleton instance (lazy initialization). */
  get(): T;
  /** Peek at cached instance without creating (dev only). */
  peek?: () => T | null;
  /** Reset cached instance (dev/test only). */
  reset?: () => void;
}

/**
 * Create a lazy singleton accessor with optional dev utilities.
 * Returns the same instance on every call to get().
 * In dev mode, includes peek() to inspect and reset() to clear the cache.
 * @template T - The singleton type
 * @param factory - Function that creates the singleton instance
 * @returns Controller with get() and optional dev methods
 */
export function createSingleton<T>(factory: () => T): SingletonController<T> {
  let hasInstance = false;
  let instance: T;

  const get = (): T => {
    if (!hasInstance) {
      instance = factory();
      hasInstance = true;
    }
    return instance;
  };

  if (!__DEV__) {
    return { get };
  }

  return {
    get,
    peek: () => (hasInstance ? instance : null),
    reset: () => {
      hasInstance = false;
    },
  };
}
