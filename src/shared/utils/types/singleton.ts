/**
 * Controller interface for lazy singleton accessors.
 *
 * Provides methods to manage singleton instance lifecycle:
 * - `get()`: Lazily creates and caches the instance
 * - `peek()`: Returns cached instance without creating (dev only)
 * - `reset()`: Clears cached instance (dev/test only)
 *
 * @template T The singleton type
 */
export interface SingletonController<T> {
  /**
   * Lazily build and cache the singleton instance.
   *
   * Creates instance on first call via the factory function and returns
   * the cached copy on subsequent calls. This ensures only one instance
   * exists for the lifetime of the application.
   *
   * @returns The cached singleton instance
   */
  get(): T;

  /**
   * Return the cached instance without creating it.
   *
   * Useful for debugging and testing to inspect state without side effects.
   * Returns null if instance has not been created yet.
   * Only available in development mode (__DEV__).
   *
   * @returns The cached instance, or null if not yet created
   */
  peek?: () => T | null;

  /**
   * Reset the cached instance state.
   *
   * Forces the next call to get() to recreate the instance. Used in testing
   * and development for test isolation and debugging purposes.
   * Only available in development mode (__DEV__).
   */
  reset?: () => void;
}

/**
 * Create a lazy singleton accessor with optional dev-mode utilities.
 *
 * Manages a single cached instance that is created on first access via get().
 * Subsequent calls to get() return the same instance without re-invoking the
 * factory function. In production, only the get() method is exposed.
 * In development, peek() and reset() are also provided for testing and debugging.
 *
 * @template T The singleton type - should be instantiable via the factory function
 * @param factory Function that creates and returns the singleton instance.
 *                Must not throw exceptions in normal operation.
 * @returns Controller object with get() method and optional dev utilities
 *
 * @example
 * ```typescript
 * // Basic usage
 * const singleton = createSingleton(() => new ExpensiveService());
 *
 * // First call creates instance
 * const service1 = singleton.get();
 *
 * // Subsequent calls return cached instance (same reference)
 * const service2 = singleton.get();
 * console.assert(service1 === service2); // true
 *
 * // Dev mode only utilities
 * if (__DEV__) {
 *   // Check if instance was created without creating it
 *   const created = singleton.peek() !== null;
 *
 *   // Clear cache for test isolation
 *   singleton.reset();
 *   const service3 = singleton.get(); // New instance created
 * }
 * ```
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

  const peek = (): T | null => (hasInstance ? instance : null);

  const reset = (): void => {
    hasInstance = false;
    // Intentionally not deleting instance to allow GC in reset flow
  };

  return { get, peek, reset };
}
