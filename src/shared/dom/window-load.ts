export type WindowLoadCallback = () => void | Promise<void>;

let windowLoadPromise: Promise<void> | null = null;

function hasBrowserContext(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isWindowLoaded(): boolean {
  if (!hasBrowserContext()) {
    return true;
  }

  return document.readyState === 'complete';
}

function createWindowLoadPromise(): Promise<void> {
  if (windowLoadPromise) {
    return windowLoadPromise;
  }

  if (!hasBrowserContext()) {
    windowLoadPromise = Promise.resolve();
    return windowLoadPromise;
  }

  windowLoadPromise = new Promise((resolve) => {
    const handleLoad = (): void => {
      window.removeEventListener('load', handleLoad);
      resolve();
      windowLoadPromise = Promise.resolve();
    };

    window.addEventListener('load', handleLoad, { once: true, passive: true });
  });

  return windowLoadPromise;
}

export function waitForWindowLoad(): Promise<void> {
  if (isWindowLoaded()) {
    return Promise.resolve();
  }

  return createWindowLoadPromise();
}

export async function runAfterWindowLoad(callback: WindowLoadCallback): Promise<void> {
  await waitForWindowLoad();
  await callback();
}
