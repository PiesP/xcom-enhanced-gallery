/**
 * Window load helpers.
 *
 * This module intentionally caches the in-flight promise so multiple callers
 * can await the same window load event without registering duplicate listeners.
 */

let windowLoadPromise: Promise<void> | null = null;

export function waitForWindowLoad(): Promise<void> {
  if (typeof document !== 'undefined' && document.readyState === 'complete') {
    return Promise.resolve();
  }

  if (windowLoadPromise) {
    return windowLoadPromise;
  }

  windowLoadPromise = new Promise<void>((resolve) => {
    const onLoad = () => {
      window.removeEventListener('load', onLoad);
      resolve();
    };

    window.addEventListener('load', onLoad);
  });

  return windowLoadPromise;
}

export async function runAfterWindowLoad(callback: () => void | Promise<void>): Promise<void> {
  await waitForWindowLoad();
  await callback();
}
