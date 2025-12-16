import { getEventBus } from '@shared/events';

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
    const bus = getEventBus();
    let subscriptionId: string | null = null;

    const handleLoad: EventListener = () => {
      if (subscriptionId) {
        bus.remove(subscriptionId);
        subscriptionId = null;
      }
      resolve();
      windowLoadPromise = Promise.resolve();
    };

    subscriptionId = bus.addDOMListener(window, 'load', handleLoad, {
      once: true,
      passive: true,
      context: 'window-load',
    });
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
