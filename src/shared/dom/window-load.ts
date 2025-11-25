export type WindowLoadCallback = () => void | Promise<void>;

let windowLoadPromise: Promise<void> | null = null;

const hasBrowserContext = typeof window !== 'undefined' && typeof document !== 'undefined';

function isWindowLoaded(): boolean {
  if (!hasBrowserContext) {
    return true;
  }

  return document.readyState === 'complete';
}

function createWindowLoadPromise(): Promise<void> {
  if (!hasBrowserContext) {
    return Promise.resolve();
  }

  if (windowLoadPromise) {
    return windowLoadPromise;
  }

  windowLoadPromise = new Promise(resolve => {
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

export function runAfterWindowLoad(callback: WindowLoadCallback): Promise<void> {
  return waitForWindowLoad()
    .then(() => Promise.resolve(callback()))
    .then(() => undefined);
}
