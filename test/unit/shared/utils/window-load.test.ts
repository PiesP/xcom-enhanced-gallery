import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type ReadyState = 'loading' | 'interactive' | 'complete';

function mockReadyState(state: ReadyState): void {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    get: () => state,
  });
}

function resetReadyState(): void {
  if (Object.prototype.hasOwnProperty.call(document, 'readyState')) {
    delete (document as unknown as { readyState?: ReadyState }).readyState;
  }
}

describe('window-load utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    resetReadyState();
  });

  afterEach(() => {
    resetReadyState();
  });

  it('resolves immediately when document is already complete', async () => {
    mockReadyState('complete');

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const { waitForWindowLoad } = await import('@shared/utils/window-load');

    await expect(waitForWindowLoad()).resolves.toBeUndefined();

    const loadRegistrations = addEventListenerSpy.mock.calls.filter(
      ([eventName]) => eventName === 'load'
    );
    expect(loadRegistrations.length).toBe(0);

    addEventListenerSpy.mockRestore();
  });

  it('waits for the window load event before resolving', async () => {
    mockReadyState('loading');

    const { waitForWindowLoad } = await import('@shared/utils/window-load');

    const waitPromise = waitForWindowLoad();

    mockReadyState('complete');
    window.dispatchEvent(new Event('load'));

    await expect(waitPromise).resolves.toBeUndefined();
  });

  it('executes callbacks registered via runAfterWindowLoad', async () => {
    mockReadyState('loading');

    const { runAfterWindowLoad } = await import('@shared/utils/window-load');
    const callback = vi.fn();

    const callbackPromise = runAfterWindowLoad(callback);

    mockReadyState('complete');
    window.dispatchEvent(new Event('load'));

    await callbackPromise;

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
