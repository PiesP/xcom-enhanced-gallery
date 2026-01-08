/**
 * @fileoverview Window load event helpers
 * @description Defer execution until window is fully loaded (caches promise).
 */

let windowLoadPromise: Promise<void> | null = null;

/**
 * Wait for the window load event to complete.
 * Returns immediately if document is already in 'complete' state.
 * Multiple calls share same cached promise.
 * @returns Promise that resolves when window load event completes
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
 * Execute a callback function after the window load event completes.
 * Wrapper around `waitForWindowLoad` for convenience.
 * @param callback - Function to execute after window load (can be sync or async)
 * @returns Promise that resolves when callback execution completes
 */
export async function runAfterWindowLoad(callback: () => void | Promise<void>): Promise<void> {
  await waitForWindowLoad();
  await callback();
}
