import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { waitForWindowLoad } from '@shared/utils/window-load';

describe('waitForWindowLoad', () => {
  setupGlobalTestIsolation();

  type ReadyState = 'loading' | 'interactive' | 'complete';

  let originalReadyStateDescriptor: PropertyDescriptor | undefined;
  let currentReadyState: ReadyState;

  const defineReadyStateProperty = () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => currentReadyState,
    });
  };

  const setReadyState = (state: ReadyState) => {
    currentReadyState = state;
  };

  beforeAll(() => {
    originalReadyStateDescriptor = Object.getOwnPropertyDescriptor(document, 'readyState');
  });

  beforeEach(() => {
    vi.useFakeTimers();
    setReadyState('loading');
    defineReadyStateProperty();
  });

  afterEach(() => {
    if (originalReadyStateDescriptor) {
      Object.defineProperty(document, 'readyState', originalReadyStateDescriptor);
    } else {
      delete (document as unknown as Record<string, unknown>).readyState;
    }
    vi.useRealTimers();
  });

  it('resolves immediately when document is already complete', async () => {
    setReadyState('complete');
    const result = await waitForWindowLoad();
    expect(result).toBe(true);
  });

  it('resolves true when load event fires before timeout', async () => {
    const promise = waitForWindowLoad({ timeoutMs: 5000 });
    window.dispatchEvent(new Event('load'));
    const result = await promise;
    expect(result).toBe(true);
  });

  it('resolves false when timeout elapses first', async () => {
    const promise = waitForWindowLoad({ timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;
    expect(result).toBe(false);
  });

  it('honors forceEventPath even if readyState is complete', async () => {
    setReadyState('complete');
    const promise = waitForWindowLoad({ timeoutMs: 1000, forceEventPath: true });

    // Without dispatching load, promise should resolve via timeout
    await vi.advanceTimersByTimeAsync(1000);
    expect(await promise).toBe(false);
  });

  it('forceEventPath resolves true when load event is dispatched', async () => {
    setReadyState('complete');
    const promise = waitForWindowLoad({ timeoutMs: 1000, forceEventPath: true });
    window.dispatchEvent(new Event('load'));
    expect(await promise).toBe(true);
  });
});
