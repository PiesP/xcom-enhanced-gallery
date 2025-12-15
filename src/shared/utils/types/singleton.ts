/**
 * Shared helper for creating lazy singleton accessors.
 */
export interface SingletonController<T> {
  /** Lazily build (and cache) the singleton instance. */
  get(): T;
  /** Return the cached instance without creating it. */
  peek(): T | null;
  /** Reset the cached instance (used in tests). */
  reset(): void;
}

export function createSingleton<T>(factory: () => T): SingletonController<T> {
  let hasInstance = false;
  let instance: T;

  return {
    get(): T {
      if (!hasInstance) {
        instance = factory();
        hasInstance = true;
      }
      return instance;
    },
    peek(): T | null {
      return hasInstance ? instance : null;
    },
    reset(): void {
      hasInstance = false;
    },
  };
}
