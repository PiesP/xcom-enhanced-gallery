import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitForWindowLoad } from '@/shared/utils/window-load';

describe('waitForWindowLoad', () => {
  const originalReadyState = Object.getOwnPropertyDescriptor(document, 'readyState');

  function setReadyState(state: 'loading' | 'interactive' | 'complete') {
    Object.defineProperty(document as unknown as Record<string, unknown>, 'readyState', {
      value: state,
      configurable: true,
    });
  }

  beforeEach(() => {
    // reset listeners by creating a fresh window event target spy if needed
  });

  afterEach(() => {
    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState);
    }
  });

  it('resolves immediately when document is already complete', async () => {
    setReadyState('complete');
    const result = await waitForWindowLoad({ timeoutMs: 50 });
    expect(result).toBe(true);
  });

  it('resolves true when load event fires before timeout', async () => {
    setReadyState('loading');
    const p = waitForWindowLoad({ timeoutMs: 200 });
    // simulate load event shortly after
    setTimeout(() => window.dispatchEvent(new Event('load')), 10);
    const result = await p;
    expect(result).toBe(true);
  });

  it('resolves false on timeout when load never fires', async () => {
    setReadyState('loading');
    const result = await waitForWindowLoad({ timeoutMs: 30 });
    expect(result).toBe(false);
  });

  it('forceEventPath waits for load even if readyState is complete', async () => {
    setReadyState('complete');
    const p = waitForWindowLoad({ timeoutMs: 100, forceEventPath: true });
    setTimeout(() => window.dispatchEvent(new Event('load')), 20);
    const result = await p;
    expect(result).toBe(true);
  });
});
