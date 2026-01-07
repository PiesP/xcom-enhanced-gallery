/**
 * Window load event helpers.
 *
 * This module provides utilities to safely defer execution until the window is fully loaded.
 * The module intentionally caches the in-flight promise so multiple callers can await
 * the same window load event without registering duplicate listeners.
 *
 * @module window-load
 */

/**
 * Cached promise for window load event.
 * Prevents duplicate listener registration across multiple callers.
 */
let windowLoadPromise: Promise<void> | null = null;

/**
 * Waits for the window load event to complete.
 *
 * This function returns immediately if the document is already in 'complete' state.
 * Otherwise, it returns a cached promise that resolves when the window 'load' event fires.
 * Multiple calls share the same promise to avoid redundant event listeners.
 *
 * @returns Promise that resolves when window load event completes
 *
 * @example
 * ```typescript
 * await waitForWindowLoad();
 * console.log('Window is fully loaded');
 * ```
 */
export function waitForWindowLoad(): Promise<void> {
  // Safety check for non-browser environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve();
  }

  // Already loaded
  if (document.readyState === 'complete') {
    return Promise.resolve();
  }

  // Return cached promise if already registered
  if (windowLoadPromise !== null) {
    return windowLoadPromise;
  }

  // Create and cache new promise
  windowLoadPromise = new Promise<void>((resolve) => {
    const onLoad = (): void => {
      window.removeEventListener('load', onLoad);
      resolve();
    };

    window.addEventListener('load', onLoad);
  });

  return windowLoadPromise;
}

/**
 * Executes a callback function after the window load event completes.
 *
 * This is a convenience wrapper around `waitForWindowLoad` that ensures
 * the provided callback runs only after the window is fully loaded.
 * The callback can be synchronous or asynchronous.
 *
 * @param callback - Function to execute after window load (can be sync or async)
 * @returns Promise that resolves when callback execution completes
 *
 * @example
 * ```typescript
 * await runAfterWindowLoad(() => {
 *   console.log('Initializing app after window load');
 * });
 * ```
 *
 * @example
 * ```typescript
 * await runAfterWindowLoad(async () => {
 *   await initializeServices();
 *   await loadUserPreferences();
 * });
 * ```
 */
export async function runAfterWindowLoad(callback: () => void | Promise<void>): Promise<void> {
  await waitForWindowLoad();
  await callback();
}
