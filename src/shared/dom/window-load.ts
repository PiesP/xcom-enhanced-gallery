import { EventManager } from '@shared/services/event-manager';
import { createDeferred } from '@shared/utils/async/promise-helpers';

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

  const deferred = createDeferred<void>();
  windowLoadPromise = deferred.promise;

  const eventManager = EventManager.getInstance();
  const controller = new AbortController();

  const handleLoad: EventListener = () => {
    controller.abort();
    deferred.resolve();
    windowLoadPromise = Promise.resolve();
  };

  eventManager.addEventListener(window, 'load', handleLoad, {
    once: true,
    passive: true,
    signal: controller.signal,
    context: 'window-load',
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
